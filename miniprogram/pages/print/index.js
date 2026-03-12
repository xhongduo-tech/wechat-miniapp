// pages/print/index.js
const db = wx.cloud.database();

Page({
  data: {
    isLoading: true, // 初始加载遮罩
    step: 'idle',    // idle, countdown, process, finished
    
    // 我的数据
    fileName: '',       
    fileId: '',
    dbId: '', 
    
    // 倒计时
    timeLeft: 10,       
    
    // 状态数据
    frontCount: 0,      
    printStatus: 'queuing', // 'queuing' | 'printing'
    totalWaiting: 0, // 全局排队数
    
    // 定时器
    countDownTimer: null,
    pollTimer: null
  },

  onShow() {
    this.setData({ isLoading: true }); // 进页面先显示 Loading
    this.checkStatusByCloud(); // 第一次立即检查
    this.startPolling(); // 开启自动轮询
  },

  onHide() { this.clearAllTimers(); },
  onUnload() { this.clearAllTimers(); },

  clearAllTimers() {
    if (this.data.countDownTimer) clearInterval(this.data.countDownTimer);
    if (this.data.pollTimer) clearInterval(this.data.pollTimer);
  },

  // === 1. 核心：调用云函数检查状态 ===
  async checkStatusByCloud() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getPrintStatus'
      });
      
      const result = res.result;
      
      // 更新全局总数
      this.setData({ 
        totalWaiting: result.totalWaiting,
        isLoading: false // 解除 Loading
      });

      if (!result.exists) {
        // [情况A] 无记录 -> 允许上传
        // 如果当前已经在倒计时中，不要打断
        if (this.data.step !== 'countdown') {
          this.setData({ step: 'idle' });
        }
        return;
      }

      // [情况B] 有记录 -> 恢复状态
      const myItem = result.data;
      
      // 更新基础信息
      this.setData({
        dbId: myItem._id,
        fileName: myItem.fileName || 'User_Photo.JPG',
        fileId: myItem.fileId
      });

      // 状态判断逻辑
      if (myItem.status === 'success') {
        // B1. 彻底完成
        this.setData({ step: 'finished' });
        this.stopPolling(); // 完成后停止轮询
      } 
      else {
        // B2. 过程中 (waiting 或 finished以外的状态)
        // 如果当前是 countdown，说明用户刚传完，还在10s后悔期，不要强制覆盖为 process
        if (this.data.step !== 'countdown') {
          this.setData({ step: 'process' });
        }

        // 判断是排队还是打印
        // 逻辑：如果 frontNum 为 0，说明轮到我了 (正在打印)
        if (result.frontNum === 0) {
          this.setData({ printStatus: 'printing', frontCount: 0 });
        } else {
          this.setData({ printStatus: 'queuing', frontCount: result.frontNum });
        }
      }

    } catch (err) {
      console.error('云函数调用失败', err);
      this.setData({ isLoading: false });
    }
  },

  // === 2. 上传逻辑 ===
  handleUpload() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        const fakeName = `IMG_${Math.floor(Math.random()*9000)+1000}.JPG`;
        this.setData({ fileName: fakeName });
        this.uploadToCloud(tempPath);
      }
    });
  },

  handleDisabledClick() {
    let msg = '任务进行中';
    if (this.data.step === 'finished') msg = '您已完成打印，感谢支持';
    wx.showToast({ title: msg, icon: 'none' });
  },

  uploadToCloud(filePath) {
    wx.showLoading({ title: '安全校验中' });
    const cloudPath = `print_photos/${Date.now()}_${Math.floor(Math.random()*1000)}.png`;
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath, filePath: filePath,
      success: res => {
        wx.hideLoading();
        // 上传成功后，前端直接写入数据库 (带上 openid)
        // 注意：虽然这里前端写库，但查询全靠云函数，所以逻辑是闭环的
        this.createRecord(res.fileID);
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '失败重试', icon: 'none' });
      }
    });
  },

  createRecord(fileId) {
    db.collection('print_queue').add({
      data: {
        fileId: fileId,
        fileName: this.data.fileName,
        status: 'waiting',
        createTime: db.serverDate()
        // _openid 会由云数据库自动注入
      }
    }).then(res => {
      this.setData({ dbId: res._id, fileId: fileId });
      this.startGracePeriod(); // 开启倒计时
    });
  },

  // === 3. 倒计时 & 撤回 ===
  startGracePeriod() {
    // 进入倒计时状态，暂停轮询 (防止轮询结果把 UI 刷成 process)
    this.stopPolling(); 
    
    this.setData({ step: 'countdown', timeLeft: 10 });
    this.data.countDownTimer = setInterval(() => {
      if (this.data.timeLeft > 0) {
        this.setData({ timeLeft: this.data.timeLeft - 1 });
      } else {
        clearInterval(this.data.countDownTimer);
        // 倒计时结束 -> 锁定 -> 开启轮询
        this.setData({ step: 'process' });
        this.startPolling();
      }
    }, 1000);
  },

  handleWithdraw() {
    if (this.data.countDownTimer) clearInterval(this.data.countDownTimer);
    
    wx.showLoading({ title: '撤回中' });
    
    // 物理删除
    db.collection('print_queue').doc(this.data.dbId).remove().then(() => {
      wx.hideLoading();
      this.setData({ step: 'idle', timeLeft: 10, fileName: '', dbId: '' });
      wx.showToast({ title: '已撤回', icon: 'none' });
      
      // 撤回后，立即刷新一下云函数，更新总排队数
      this.checkStatusByCloud();
      // 恢复轮询
      this.startPolling();
    });
  },

  // === 4. 轮询控制 ===
  startPolling() {
    if (this.data.pollTimer) clearInterval(this.data.pollTimer);
    // 每 3 秒呼叫一次云函数
    this.data.pollTimer = setInterval(() => {
      this.checkStatusByCloud();
    }, 3000);
  },

  stopPolling() {
    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer);
      this.data.pollTimer = null;
    }
  },

  onShareAppMessage() {
    return { title: '照片打印服务', path: '/pages/print/index' }
  }
});
Page({
  data: {
    currentTab: 0,
    // 建议使用一张深色系的背景图，效果最佳。若无图，CSS中的渐变色也会起作用。
    bgImage: '/images/home.png', 

    // 1. 现场座位表（按实际布局顺序排列）
    tableList: [
      '信用卡+筹备组', '风险线', '管理团队', '渠道线', 
      '信用卡线', '风险线', '生态线', '混合线', 
      '资产线', '工具线', '工具线', '个金线',
      '资产线', '资产线', '对公线', '对公线'
    ],

    // 2. 节目单数据
    programList: [
      // category: 'game'(游戏) | 'show'(表演) | 'speech'(致辞)
      { category: 'game', dept: '全员互动', name: '零食大作战', type: '暖场游戏', duration: '12 min', color: '#faad14' },
      { category: 'show', dept: '资产线', name: '《四时巡礼》', type: '舞蹈+情景剧', duration: '5 min', color: '#ff6b6b' },
      { category: 'show', dept: '个金线', name: '《马到成功》', type: '舞蹈', duration: '3 min', color: '#ff9f43' },
      { category: 'show', dept: '对公线', name: '《新年year》', type: '非洲鼓', duration: '3.5 min', color: '#54a0ff' },
      
      { category: 'game', dept: '全员互动', name: '马到成功', type: '中场游戏', duration: '10 min', color: '#faad14' },
      
      { category: 'show', dept: '风险线', name: '《大模型你行不行》', type: '趣味配音', duration: '5.5 min', color: '#1dd1a1' },
      { category: 'show', dept: '信用卡线', name: '《流星雨》', type: '歌曲+情景剧', duration: '4.5 min', color: '#5f27cd' },
      { category: 'show', dept: '生态线', name: '《i人行为观察报告》', type: '情景剧', duration: '5 min', color: '#ff9f43' },
      
      { category: 'game', dept: '全员互动', name: '击鼓传花', type: '全员游戏', duration: '10 min', color: '#faad14' },
      
      { category: 'show', dept: '工具线', name: '《三句半+运球舞》', type: '综合表演', duration: '5 min', color: '#8395a7' },
      { category: 'show', dept: '渠道线', name: '《爱如火》', type: '热舞', duration: '2.5 min', color: '#8395a7' },
      { category: 'show', dept: '管理团队', name: '《莫生气+我相信》', type: '压轴表演', duration: '4.5 min', color: '#ff6b6b' },
      
      { category: 'speech', dept: '同总', name: '新春寄语', type: '领导致辞', duration: '5 min', color: '#000000' },
      { category: 'speech', dept: '敦总', name: '新春寄语', type: '领导致辞', duration: '5 min', color: '#000000' }
    ],

    infoMap: {
      'sound': { title: '音控组', content: '吉炳贺（牵头）\n汪雨扬、赵婉聿' },
      'stage': { title: '场务组', content: '宋维真（牵头）\n朱涵、柳青、陈鑫' },
      'mobile': { title: '机动组', content: '马家琛、韩星宇、李哲丞...' },
      'camera': { title: '摄影组', content: '徐鸿铎（牵头）\n小修哥、安然' },
      'director': { title: '导演组', content: '胡思远、周思琪' },
      'sign': { title: '签到区', content: '✍️ 请在此处签到' },
      'drink': { title: '开放饮品区', content: '☕️ 提供：自取阿拉比卡挂耳咖啡' },
      'halal': { title: '清真专区', content: '🕌 专属清真食品' },
      'food': { title: '美食区', content: '🍰 提供：各式精美甜点' },
      'print': { title: '照片打印', content: '📸 现场专业照片打印服务' },
      'ai': { title: '大模型体验', content: '🤖 生成马年专属头像' }
    }
  },

  // 切换 Tab (包含顶部导航和悬浮按钮)
  handleSwitch(e) {
    wx.vibrateShort({ type: 'light' });
    this.setData({ currentTab: Number(e.currentTarget.dataset.index) });
  },

  // 显示弹窗信息
  handleShowInfo(e) {
    wx.vibrateShort({ type: 'medium' });
    const key = e.currentTarget.dataset.key;
    const info = this.data.infoMap[key];
    if (info) {
      wx.showModal({
        title: info.title,
        content: info.content,
        showCancel: false,
        confirmText: '确认',
        confirmColor: '#A61B29'
      });
    }
  },

  // 点击桌子显示部门名称
  handleTableClick(e) {
    wx.vibrateShort({ type: 'medium' });
    const name = e.currentTarget.dataset.name;
    wx.showToast({
      title: name + '位置',
      icon: 'none',
      duration: 1500
    });
  },

  onShareAppMessage() {
    return { title: '2026大数据部新春活动', path: '/pages/home/index' }
  }
})
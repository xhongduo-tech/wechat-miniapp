Page({
  data: {
    steps: [
      {
        description: "扫描相册界面二维码打开晚会相册",
        imageSrc: "/images/step1.png" // 注意：去掉 /miniprogram 前缀
      },
      {
        description: "随便选择打开一张照片",
        imageSrc: "/images/step2.png"
      },
      {
        description: "弹幕已经投射在上方",
        imageSrc: "/images/step3.png"
      },
      {
        description: "输入内容，点击发送！",
        imageSrc: "/images/step4.png"
      }
    ]
  },

  previewImage: function(e) {
    const current = e.currentTarget.dataset.src;
    const urls = this.data.steps.map(step => step.imageSrc);

    wx.previewImage({
      current: current,
      urls: urls
    })
  },

  onShareAppMessage: function () {
    return {
      title: '春风策马 - 互动指南'
    }
  }
})
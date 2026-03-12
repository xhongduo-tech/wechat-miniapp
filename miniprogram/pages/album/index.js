Page({
  data: {
    // 你的海报图片路径
    posterUrl: '/images/album_cover.png'
  },

  // 唯一交互：全屏查看图片
  handlePreview() {
    wx.previewImage({
      current: this.data.posterUrl, // 当前显示图片的http链接
      urls: [this.data.posterUrl]   // 需要预览的图片http链接列表
    })
  },

  onShareAppMessage() {
    return {
      title: '大数据部活动云相册',
      path: '/pages/album/index'
    }
  }
})
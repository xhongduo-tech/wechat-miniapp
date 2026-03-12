Page({
  data: {
    // 顶部头图：请确保 images/team/ 文件夹下有 header.png (包含艺术字的那张图)
    headerImg: '/images/team.png',

    // 筹备组名单数据
    teamList: [
      { role: '总体方案', members: '胡思远、周思琪' },
      { role: '节目主持', members: '汪雨扬、韩青卓、孙祺航、朱涵' },
      { role: '节目对接', members: '汪雨扬、赵婉聿' },
      { role: 'PPT制作与播放', members: '吉炳贺、赵婉聿' },
      { role: '游戏设计', members: '马家琛、徐鸿铎、周思琪、胡思远' },
      { role: '采购预算', members: '韩星宇、周思琪' },
      { role: '拜年视频与现场摄影', members: '徐鸿铎、小修哥、安然' },
      { role: '会场设计与现场组织', members: '宋维真、柳青、陈鑫' },
      { role: '小程序开发与大模型支持', members: '徐鸿铎' }
    ]
  },

  onShareAppMessage() {
    return {
      title: '大数据部新春活动筹备组',
      path: '/pages/team/index'
    }
  }
})
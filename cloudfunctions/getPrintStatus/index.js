// cloudfunctions/getPrintStatus/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const OPENID = wxContext.OPENID // 核心：获取真实 OpenID

  // 1. 并行查询：查我的记录 & 查全网排队总数
  const [myRes, totalRes] = await Promise.all([
    db.collection('print_queue').where({
      _openid: OPENID
    }).get(),
    db.collection('print_queue').where({
      status: 'waiting'
    }).count()
  ])

  const totalWaiting = totalRes.total
  const myRecord = myRes.data[0] || null

  // A. 如果我没有记录
  if (!myRecord) {
    return {
      exists: false,
      totalWaiting: totalWaiting
    }
  }

  // B. 如果我有记录，且还在排队，计算排在我前面的人数
  let frontNum = 0
  if (myRecord.status === 'waiting') {
    const countRes = await db.collection('print_queue').where({
      status: 'waiting',
      createTime: _.lt(myRecord.createTime) // 创建时间比我早的
    }).count()
    frontNum = countRes.total
  }

  // 返回完整信息
  return {
    exists: true,
    data: myRecord,    // 我的详细数据
    frontNum: frontNum, // 排在我前面的人数
    totalWaiting: totalWaiting // 当前总排队数
  }
}
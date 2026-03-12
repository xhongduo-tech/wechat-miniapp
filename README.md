# 2026 大数据应用部新春年会微信小程序

> 春风策马 · 大数据部部门年会一站式活动小程序

## 项目概述

本项目为 **2026 年大数据应用部部门年会** 打造的微信小程序，集活动安排、现场互动、云相册、照片打印、筹备组信息于一体，为年会参与者提供完整的数字化体验。

### 核心功能

| 模块 | 功能说明 |
|------|----------|
| **安排** | 现场座位表、节目单、功能区指引（音控、场务、摄影、签到、饮品、美食、打印、大模型体验等） |
| **互动** | 弹幕互动指南，扫码相册后发送弹幕投射到大屏 |
| **相册** | 活动云相册入口，支持全屏预览与分享 |
| **打印** | 现场照片打印服务，上传照片后自动排队，实时显示排队状态与打印进度 |
| **筹备** | 筹备组名单与分工（总体方案、主持、节目对接、PPT、游戏设计、采购、摄影、会场设计、小程序开发等） |

### 技术架构

- **前端**：微信小程序原生框架（WXML / WXSS / JS）
- **后端**：微信云开发（云函数、云数据库、云存储）
- **打印**：Python 守护进程 `autoprint.py`，轮询云数据库打印队列，对接 Canon SELPHY CP1500 等打印机

### 全自动照片打印流程

1. 用户在小程序「打印」页选择照片并提交
2. 照片上传至云存储，记录写入云数据库 `print_queue`（状态 `waiting`）
3. 本地运行 `autoprint.py`，持续轮询 `status: waiting` 的任务
4. 获取云文件下载链接 → 下载到本地 → 调用 `lp` 命令发送至打印机
5. 打印成功后更新数据库状态为 `success`，小程序实时轮询展示完成状态

---

## 项目结构

```
springfestival-app/
├── miniprogram/              # 小程序前端
│   ├── pages/
│   │   ├── home/             # 安排（座位表、节目单、功能区）
│   │   ├── chat/             # 互动（弹幕指南）
│   │   ├── album/            # 相册
│   │   ├── print/            # 打印（上传、排队、状态）
│   │   └── team/             # 筹备组
│   ├── images/               # 静态资源
│   ├── app.js / app.json
│   └── envList.js
├── cloudfunctions/
│   └── getPrintStatus/       # 云函数：查询用户打印状态与排队人数
├── autoprint.py              # 打印队列监听与自动打印脚本
├── uploadCloudFunction.sh    # 云函数部署脚本
├── project.config.json
└── README.md
```

---

## 快速开始

### 1. 小程序开发

1. 使用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开项目
2. 配置 `project.config.json` 中的 AppID 与云开发环境
3. 在 `miniprogram/envList.js` 中配置云环境 ID
4. 编译并预览

### 2. 云函数部署

```bash
# 部署 getPrintStatus 云函数
./uploadCloudFunction.sh
```

### 3. 自动打印服务（可选）

适用于现场连接 Canon SELPHY CP1500 等支持 `lp` 的打印机：

```bash
# 安装依赖
pip install requests

# 修改 autoprint.py 中的配置
# - APP_ID / APP_SECRET
# - ENV_ID（云环境 ID）
# - PRINTER_NAME（执行 lpstat -p 查看打印机名称）

# 启动监听
python autoprint.py
```

---

## 云数据库集合

| 集合名 | 说明 |
|--------|------|
| `print_queue` | 打印任务队列，字段含 `fileId`、`fileName`、`status`（waiting/success）、`createTime`、`_openid` |

---

## 开发说明

- 导航栏主题色：`#ff4d4f`
- TabBar 包含 5 个页面：安排、互动、相册、打印、筹备
- 各页面均支持 `onShareAppMessage` 分享

---

## 许可证

内部项目，仅供大数据应用部年会使用。

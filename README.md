# Cloudflare Worker Telegram 机器人

这是一个基于 Cloudflare Worker 平台构建的 Telegram 机器人，旨在将普通用户的消息转发给管理员，并允许管理员直接在 Telegram 中回复这些用户。机器人还具备用户屏蔽、解除屏蔽和查询状态的功能。

## ✨ 功能特性

* 消息转发：用户发送给机器人的消息将自动转发给管理员。
* 管理员回复：管理员可以直接回复转发来的用户消息，机器人会将回复内容发送给原用户。
* 用户屏蔽/解除屏蔽：管理员可以通过命令屏蔽或解除屏蔽特定用户，被屏蔽的用户将无法向机器人发送消息。
* 屏蔽状态查询：管理员可以查询用户的当前屏蔽状态。
* 多语言欢迎语：支持中文和英文的 /start 欢迎消息。
* 通知间隔：控制用户再次收到消息已转发通知的间隔时间，避免重复打扰。

## 🚀 部署前的准备

在部署机器人之前，请确保您已拥有以下资源和信息：

### Cloudflare 账户

一个活跃的 Cloudflare 账户

### Telegram Bot Token

1. 在 Telegram 中搜索并找到 @BotFather
2. 发送 `/newbot` 命令，按照提示创建机器人
3. 获得一个 HTTP API Token，示例： `123456:ABC-DEF1234ghIkl-zyx57W2v1u123`

### Telegram 管理员 User ID

1. 在 Telegram 中搜索 @userinfobot
2. 发送任意消息，将回复您的 User ID，示例：`123456789`

### Cloudflare KV Namespace

1. 登录 Cloudflare 仪表盘
2. 轨道: Workers & Pages -> KV
3. 点击 创建 Namespace，命名（示例：my-bot-kv），点击 添加

## 🛠️ 部署步骤

### 1. 创建 Worker

* 登录 Cloudflare 仪表盘
* 左侧选择 Workers & Pages
* 点击 创建应用 -> 创建 Worker
* 命名后点击部署

### 2. 配置环境变量

* 进入 Worker 概览 -> 设置 -> 环境变量
* 添加下列变量：

  * `ENV_BOT_TOKEN` ：您的 Telegram Bot Token
  * `ENV_BOT_SECRET` ：随机字符串，用于 Webhook 验证
  * `ENV_ADMIN_UID` ：您的 Telegram User ID

### 3. 绑定 KV Namespace

* Worker -> 设置 -> KV 命名空间绑定
* 变量名称: `nfd` (必须为 nfd)
* 选择之前创建的 namespace

### 4. 粘贴代码

* Worker -> 概览 -> 编辑代码
* 将提供的代码复制入编辑器
* 点击部署

### 5. 注册 Webhook

* 查看 Worker 域名：如 `my-telegram-bot.yourname.workers.dev`
* 打开浏览器，访问:

```
https://您的Worker域名/registerWebhook
```

* 如成功，将显示 `ok: true`

### 6. 设置按钮命令菜单 ( 非必，推荐 )

* 访问:

```
https://您的Worker域名/setMenu
```

* 成功后显示 JSON 响应，包括 /start /block /unblock /checkblock 等指令

## 🤖 机器人使用说明

### 普通用户

* 直接发送消息给机器人
* `/start` 命令可观看欢迎语。根据 Telegram 设置会显示中文或英文

### 管理员

* 您 (ENV\_ADMIN\_UID) 会收到所有用户转发消息
* **回复用户**：请直接回复当前转发消息，不要单独发消息

### 屏蔽用户

* 命令: `/block`
* 用法: 回复指定用户消息，然后发送 /block

### 解除屏蔽

* 命令: `/unblock`
* 用法: 回复指定用户消息，然后发送 /unblock

### 查询状态

* 命令: `/checkblock`
* 用法: 回复用户消息后发送命令

## ⚡ Troubleshooting 疑难解答

### 机器人无响应

* 查看 Worker 日志 Logs
* 确认环境变量配置正确
* 确认 KV 命名空间已绑定
* 确认 Webhook 注册成功
* 尝试先扣注册 /unRegisterWebhook ，再重新注册

### 无法回复用户

* 确保是回复原始消息，不是单独发送
* 检查 Worker Logs ，看是否显示找不到 userID ，可能是 KV 数据遗失或回复了过时消息

### 命令无效

* 确保您是管理员
* 确保是在回复状态下发送指令
* 重新运行 `/setMenu` 指令

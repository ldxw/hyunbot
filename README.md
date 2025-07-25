# Hyun Telegram 私聊机器人

一个基于 Cloudflare Workers 的 Telegram 私聊机器人，支持消息转发给管理员、屏蔽用户、自动识别诈骗用户等功能，支持多语言欢迎语和管理员命令。

---



## 项目介绍

该机器人通过 Telegram Bot API 与用户私聊交互，管理员可实时收到用户消息转发，支持自动识别诈骗用户并提醒管理员，方便管理私聊咨询和防诈骗。

---

## 功能特点

- 用户消息自动转发给管理员
- 管理员可以屏蔽或解除屏蔽用户
- 诈骗用户自动检测与提醒
- 多语言 `/start` 欢迎消息支持
- 自定义命令菜单（菜单按钮）
- 通过 Cloudflare Workers 部署，性能高效，免维护

---

## 环境配置

你需要准备：

- 一个 Telegram 机器人 Token，来自 [@BotFather](https://t.me/BotFather)
- Cloudflare Workers 账户
- 一个管理员 Telegram 用户ID，使用 [@username_to_id_bot](https://t.me/username_to_id_bot) 获取

环境变量（可通过 Cloudflare Workers KV 或 Worker Secrets 配置）：

| 名称           | 说明                         |
| -------------- | ---------------------------- |
| ENV_BOT_TOKEN  | Telegram 机器人 Token        |
| ENV_BOT_SECRET | Webhook Secret Token (自定义) |
| ENV_ADMIN_UID  | 管理员 Telegram 用户 ID       |

---

## 部署步骤

1. Fork 或 Clone 本仓库到你的账户  
2. 在 Cloudflare Workers 创建新项目  
3. 配置上述环境变量  
4. 部署代码到 Worker  
5. 访问 `https://你的域名/registerWebhook` 注册 Webhook  
6. 访问 `https://你的域名/setMenu` 设置命令菜单  
7. 机器人启动成功，开始使用！

---

## 使用说明

- 用户首次私聊机器人，发送 `/start` 会收到欢迎消息（支持中英文自动切换）  
- 用户发送消息会自动转发给管理员  
- 管理员收到消息后可以回复，机器人会帮忙转发给用户  

---

## 管理员命令

管理员通过回复转发消息并发送以下命令操作：

| 命令         | 说明               |
| ------------ | ------------------ |
| `/block`     | 屏蔽该用户         |
| `/unblock`   | 解除屏蔽           |
| `/checkblock`| 查询用户屏蔽状态   |

---

## 常见问题

**Q1:** 命令菜单没显示怎么办？  
A1: 请确保已访问 `/setMenu` 路由完成菜单设置，Telegram 客户端可能需要重新启动。

**Q2:** 如何获取管理员 UID？  
A2: 使用 [@username_to_id_bot](https://t.me/username_to_id_bot) 获取你的 Telegram 用户 ID。

**Q3:** 如何更换欢迎消息？  
A3: 修改 `startMessage.zh.md` 和 `startMessage.en.md` 两个远程文件即可。

---

## 贡献指南

欢迎提交 Issue 和 Pull Request，帮忙改进机器人功能和体验。

---

## 许可证

MIT License


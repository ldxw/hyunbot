# Telegram Worker Bot 部署教程

本项目将帮助你快速部署一个支持按钮菜单的 Telegram Bot，并通过 Cloudflare Worker 实现服务器less自动化服务。

> 💡 **提示**：所有截图可点击放大查看。

---

## 📦 项目地址

> worker 主脚本地址（访问链接复制所有内容）

```
https://raw.githubusercontent.com/Tsaihyun/hyunbot/refs/heads/main/worker.js
```

---

## 🚀 快速开始

### 第一步：修改提示链接代码

将 worker.js 中的提示链接修改为你自己的地址，推荐放到 GitHub：

- 英文提示：[startMessage.en.md](https://raw.githubusercontent.com/Tsaihyun/hyunbot/refs/heads/main/data/startMessage.en.md)
- 中文提示：[startMessage.zh.md](https://raw.githubusercontent.com/Tsaihyun/hyunbot/refs/heads/main/data/startMessage.zh.md)

![startMessage 示例图](https://t.nsa.cc/d/BQACAgEAAxkDAAJAAAFoiy0ruk6rG-OjY96jvKzLsRodxgAC2gYAAjUrWUTPEwABbn5hMDw2BA)

---

### 第二步：创建 Worker 并配置环境变量

路径：**Worker → 概览 → 设置 → 环境变量**

添加如下变量：

| 变量名            | 描述                                |
|------------------|-------------------------------------|
| `ENV_BOT_TOKEN`  | 你的 Telegram Bot Token              |
| `ENV_BOT_SECRET` | 用于验证 Webhook 的随机字符串，可从 [uuidgenerator.net](https://www.uuidgenerator.net/) 获取 |
| `ENV_ADMIN_UID`  | 你的 Telegram 用户 ID                |

![环境变量配置示例](https://t.nsa.cc/d/BQACAgEAAxkDAAJAAmiLLekhbJlYfcrqolAY0yHsBvGbAALbBgACNStZRApY8mHtTQ-NNgQ)

---

### 第三步：绑定 KV Namespace

路径：**Worker → 设置 → KV 命名空间绑定**

- 变量名必须为：`nfd`  
- 绑定你已经创建的 Namespace（KV 存储空间）

![KV 绑定示例](https://t.nsa.cc/d/BQACAgEAAxkDAAJAA2iLLjOpM6QfITbW1coyiwlQ3PlRAALcBgACNStZRCFw3-c1c0vkNgQ)

---

### 第四步：粘贴代码并部署

路径：**Worker → 概览 → 编辑代码**

将提供的代码粘贴进去，点击右上角【部署】即可。

![代码粘贴部署图](https://t.nsa.cc/d/BQACAgEAAxkDAAJABGiLLoaev5YspJwkuwY-_LsINSdrAALdBgACNStZRH6RnhU2AnE0NgQ)

---

### 第五步：注册 Webhook

在浏览器中访问以下地址：

```
https://你的Worker域名/registerWebhook
```

成功返回示例：

```json
{ "ok": true }
```

---

### 第六步：设置按钮菜单（可选）

可选步骤，用于设置 Telegram Bot 的菜单按钮：

```
https://你的Worker域名/setMenu
```

![按钮命令配置图](https://t.nsa.cc/d/BQACAgEAAxkDAAJABWiLMBazAi28atolLJv6BBQsz74CAALeBgACNStZRCoKt8BJ9jNTNgQ)

---

## ✅ 部署完成！

现在你可以在 Telegram 上与自己的 Bot 交互了。

如有疑问欢迎提交 issue 或 PR，感谢使用！

---


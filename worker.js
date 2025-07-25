const TOKEN = ENV_BOT_TOKEN
const WEBHOOK = '/endpoint'
const SECRET = ENV_BOT_SECRET
const ADMIN_UID = ENV_ADMIN_UID

const NOTIFY_INTERVAL = 3600 * 1000
const fraudDb = 'https://raw.githubusercontent.com/Tsaihyun/hyunbot/refs/heads/main/data/fraud.db'

const enable_notification = true

function apiUrl(method, params = null) {
  let query = ''
  if (params) {
    query = '?' + new URLSearchParams(params).toString()
  }
  return `https://api.telegram.org/bot${TOKEN}/${method}${query}`
}

function requestTelegram(method, body, params = null) {
  return fetch(apiUrl(method, params), body).then(r => r.json())
}

function makeReqBody(body) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}

function sendMessage(msg = {}) {
  return requestTelegram('sendMessage', makeReqBody(msg))
}

function copyMessage(msg = {}) {
  return requestTelegram('copyMessage', makeReqBody(msg))
}

function forwardMessage(msg) {
  return requestTelegram('forwardMessage', makeReqBody(msg))
}

addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (url.pathname === WEBHOOK) {
    event.respondWith(handleWebhook(event))
  } else if (url.pathname === '/registerWebhook') {
    event.respondWith(registerWebhook(event, url, WEBHOOK, SECRET))
  } else if (url.pathname === '/unRegisterWebhook') {
    event.respondWith(unRegisterWebhook(event))
  } else if (url.pathname === '/setMenu') {
    event.respondWith(handleSetMenu())
  } else {
    event.respondWith(new Response('No handler for this request'))
  }
})

async function handleWebhook(event) {
  if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
    return new Response('Unauthorized', { status: 403 })
  }
  const update = await event.request.json()
  event.waitUntil(onUpdate(update))
  return new Response('Ok')
}

async function onUpdate(update) {
  if ('message' in update) {
    await onMessage(update.message)
  }
}

async function onMessage(message) {
  if (message.text === '/start') {
    const lang = message.from?.language_code || 'en'
    const fileUrl = lang.startsWith('zh')
      ? 'https://raw.githubusercontent.com/Tsaihyun/hyunbot/refs/heads/main/data/startMessage.zh.md'
      : 'https://raw.githubusercontent.com/Tsaihyun/hyunbot/refs/heads/main/data/startMessage.en.md'
    const startMsg = await fetch(fileUrl).then(r => r.text())
    return sendMessage({ chat_id: message.chat.id, text: startMsg })
  }

  if (message.chat.id.toString() === ADMIN_UID) {
    if (!message?.reply_to_message?.chat) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '🙅请不要直接回复机器人，请点击转发的消息进行回复'
      })
    }
    if (/^\/block$/.test(message.text)) return handleBlock(message)
    if (/^\/unblock$/.test(message.text)) return handleUnBlock(message)
    if (/^\/checkblock$/.test(message.text)) return checkBlock(message)

    const guestId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "json" })
    return copyMessage({
      chat_id: guestId,
      from_chat_id: message.chat.id,
      message_id: message.message_id
    })
  }

  return handleGuestMessage(message)
}

async function handleGuestMessage(message) {
  const chatId = message.chat.id
  const blocked = await nfd.get('isblocked-' + chatId, { type: "json" })
  if (blocked) {
    return sendMessage({ chat_id: chatId, text: 'You are blocked' })
  }
  const forward = await forwardMessage({
    chat_id: ADMIN_UID,
    from_chat_id: message.chat.id,
    message_id: message.message_id
  })
  if (forward.ok) {
    await nfd.put('msg-map-' + forward.result.message_id, chatId)
  }
  return handleNotify(message)
}

async function handleNotify(message) {
  const chatId = message.chat.id
  if (await isFraud(chatId)) {
    return sendMessage({ chat_id: ADMIN_UID, text: `检测到骗子 UID: ${chatId}` })
  }
  if (enable_notification) {
    const lastTime = await nfd.get('lastmsg-' + chatId, { type: "json" })
    if (!lastTime || Date.now() - lastTime > NOTIFY_INTERVAL) {
      await nfd.put('lastmsg-' + chatId, Date.now())
      const note = await fetch(notificationUrl).then(r => r.text())
      return sendMessage({ chat_id: ADMIN_UID, text: note })
    }
  }
}

async function handleBlock(message) {
  const guestId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "json" })
  if (guestId === ADMIN_UID) {
    return sendMessage({ chat_id: ADMIN_UID, text: '不能屏蔽自己' })
  }
  await nfd.put('isblocked-' + guestId, true)
  return sendMessage({ chat_id: ADMIN_UID, text: `UID:${guestId} 已屏蔽` })
}

async function handleUnBlock(message) {
  const guestId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "json" })
  await nfd.put('isblocked-' + guestId, false)
  return sendMessage({ chat_id: ADMIN_UID, text: `UID:${guestId} 已解除屏蔽` })
}

async function checkBlock(message) {
  const guestId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "json" })
  const blocked = await nfd.get('isblocked-' + guestId, { type: "json" })
  return sendMessage({
    chat_id: ADMIN_UID,
    text: `UID:${guestId} ${blocked ? '已被屏蔽' : '未被屏蔽'}`
  })
}

async function registerWebhook(event, url, suffix, secret) {
  const webhookUrl = `${url.protocol}//${url.hostname}${suffix}`
  const res = await (await fetch(apiUrl('setWebhook', {
    url: webhookUrl,
    secret_token: secret
  }))).json()
  return new Response(res.ok ? 'Ok' : JSON.stringify(res, null, 2))
}

async function unRegisterWebhook(event) {
  const res = await (await fetch(apiUrl('setWebhook', { url: '' }))).json()
  return new Response(res.ok ? 'Ok' : JSON.stringify(res, null, 2))
}

async function isFraud(id) {
  id = id.toString()
  const db = await fetch(fraudDb).then(r => r.text())
  return db.split('\n').includes(id)
}

// -------------- 新增：设置菜单命令 ------------------
async function setBotCommands() {
  const adminCommands = [
    { command: "block", description: "屏蔽用户" },
    { command: "unblock", description: "解除屏蔽" },
    { command: "checkblock", description: "查询是否屏蔽）" }
  ];

  const userCommands = [
    { command: "start", description: "关于" },
  ];

  // 设置所有用户通用命令
  await fetch(apiUrl('setMyCommands'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ commands: userCommands })
  });

  // 设置管理员专属命令（通过scope限定）
  const adminScope = {
    type: "chat",
    chat_id: parseInt(ADMIN_UID)
  };

  const adminRes = await fetch(apiUrl('setMyCommands'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ commands: adminCommands, scope: adminScope })
  });

  return adminRes.json();
}

async function handleSetMenu() {
  const res = await setBotCommands();
  return new Response(JSON.stringify(res, null, 2), { headers: { 'content-type': 'application/json' } });
}

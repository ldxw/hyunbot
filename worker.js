const TOKEN = ENV_BOT_TOKEN;
const WEBHOOK = '/endpoint';
const SECRET = ENV_BOT_SECRET;
const ADMIN_UID = ENV_ADMIN_UID;

const NOTIFY_INTERVAL = 3600 * 1000;
const START_MSG_ZH_URL = 'https://raw.githubusercontent.com/Tsaihyun/hyunbot/refs/heads/main/data/startMessage.zh.md';
const START_MSG_EN_URL = 'https://raw.githubusercontent.com/Tsaihyun/hyunbot/refs/heads/main/data/startMessage.en.md';

const ENABLE_NOTIFICATION = true;

const ADMIN_REPLY_PROMPT_ZH = '🙅 请点击**转发的用户消息**进行回复，这样我才能知道您是想回复哪位用户。直接发送消息我无法识别目标用户。';
const ADMIN_REPLY_PROMPT_EN = '🙅 Please click **reply to the forwarded user message** so I know which user you want to reply to. I cannot identify the target user if you send a message directly.';

const USER_BLOCKED_PROMPT_ZH = '🚫 您已被管理员屏蔽，无法发送消息。';
const USER_BLOCKED_PROMPT_EN = '🚫 You have been blocked by the administrator and cannot send messages.';

const MESSAGE_FORWARD_FAIL_PROMPT_ZH = '抱歉，您的消息未能成功转发给管理员，请稍后再试或联系管理员。';
const MESSAGE_FORWARD_FAIL_PROMPT_EN = 'Sorry, your message could not be forwarded to the administrator. Please try again later or contact the administrator.';

const MESSAGE_FORWARDED_NOTIF_ZH = "🔔 您好，您的消息已转发给管理员，请耐心等待回复。";
const MESSAGE_FORWARDED_NOTIF_EN = "🔔 Hello, your message has been forwarded to the administrator. Please wait patiently for a reply.";

const USER_UNBLOCKED_PROMPT_ZH = '🎉 您已被管理员解除屏蔽，现在可以正常发送消息了。';
const USER_UNBLOCKED_PROMPT_EN = '🎉 You have been unblocked by the administrator. You can now send messages normally.';

const ADMIN_BLOCK_SELF_PROMPT_ZH = '⚠️ 不能屏蔽自己！';
const ADMIN_BLOCK_SELF_PROMPT_EN = '⚠️ You cannot block yourself!';

const ADMIN_CANNOT_IDENTIFY_USER_PROMPT_ZH = '❌ 无法识别要操作的用户。请确保您回复的是用户转发给您的消息。';
const ADMIN_CANNOT_IDENTIFY_USER_PROMPT_EN = '❌ Cannot identify the user to operate on. Please make sure you are replying to a message forwarded to you by the user.';

const ADMIN_CANNOT_FIND_USER_ID_PROMPT_ZH = '⚠️ 无法找到对应的用户ID。可能是旧的转发消息或非转发消息。请检查。';
const ADMIN_CANNOT_FIND_USER_ID_PROMPT_EN = '⚠️ Cannot find the corresponding user ID. This may be an old forwarded message or a non-forwarded message. Please check.';

function apiUrl(method, params = null) {
  let query = '';
  if (params) {
    query = '?' + new URLSearchParams(params).toString();
  }
  return `https://api.telegram.org/bot${TOKEN}/${method}${query}`;
}

function makeReqBody(body) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

async function requestTelegram(method, body, params = null) {
  try {
    const response = await fetch(apiUrl(method, params), makeReqBody(body));
    if (!response.ok) {
      console.error(`Telegram API请求失败 (${method}): ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('错误详情:', errorBody);
      return { ok: false, description: `API请求失败: ${response.status} ${response.statusText}`, errorDetails: errorBody };
    }
    return response.json();
  } catch (error) {
      console.error(`执行 ${method} 方法时发生Fetch错误:`, error);
      return { ok: false, description: `网络或未知错误: ${error.message}` };
  }
}

const sendMessage = (msg) => requestTelegram('sendMessage', msg);
const copyMessage = (msg) => requestTelegram('copyMessage', msg);
const forwardMessage = (msg) => requestTelegram('forwardMessage', msg);
const setMyCommands = (commands, scope = {}) => requestTelegram('setMyCommands', { commands, scope });
const setWebhook = (url, secret_token) => requestTelegram('setWebhook', { url, secret_token });

addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname === WEBHOOK) {
    event.respondWith(handleWebhook(event));
  } else if (url.pathname === '/registerWebhook') {
    event.respondWith(registerWebhook(event, url));
  } else if (url.pathname === '/unRegisterWebhook') {
    event.respondWith(unRegisterWebhook());
  } else if (url.pathname === '/setMenu') {
    event.respondWith(handleSetMenu());
  } else {
    event.respondWith(new Response('请求路径未找到处理程序', { status: 404 }));
  }
});

async function handleWebhook(event) {
  if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
    return new Response('未经授权', { status: 403 });
  }

  try {
    const update = await event.request.json();
    event.waitUntil(onUpdate(update));
    return new Response('Ok');
  } catch (error) {
    console.error('解析Webhook更新数据时出错:', error);
    return new Response('错误请求，JSON解析失败', { status: 400 });
  }
}

async function onUpdate(update) {
  if ('message' in update) {
    await onMessage(update.message);
  }
}

function getLocalizedPrompt(langCode, prompts) {
    if (langCode && langCode.startsWith('zh')) {
        return prompts.zh;
    }
    return prompts.en;
}

async function onMessage(message) {
    const chatId = message.chat.id;
    const isAdmin = chatId.toString() === ADMIN_UID;
    const lang = message.from?.language_code || 'en';

    if (message.text === '/start') {
        const startMsgUrl = lang.startsWith('zh') ? START_MSG_ZH_URL : START_MSG_EN_URL;
        try {
            const startMsg = await fetch(startMsgUrl).then(r => r.text());
            await sendMessage({ chat_id: chatId, text: startMsg, parse_mode: 'Markdown' });
        } catch (error) {
            console.error('获取开始消息内容失败:', error);
            const fallbackWelcome = getLocalizedPrompt(lang, {
                zh: '欢迎！很抱歉，未能加载完整的欢迎消息。',
                en: 'Welcome! Sorry, the full welcome message could not be loaded.'
            });
            await sendMessage({ chat_id: chatId, text: fallbackWelcome });
        }
        return;
    }

    if (isAdmin) {
        if (message.reply_to_message) {
            if (/^\/block$/.test(message.text)) return handleBlock(message, lang);
            if (/^\/unblock$/.test(message.text)) return handleUnblock(message, lang);
            if (/^\/checkblock$/.test(message.text)) return checkBlock(message, lang);

            const guestId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "text" });
            if (guestId) {
                await copyMessage({
                    chat_id: guestId,
                    from_chat_id: message.chat.id,
                    message_id: message.message_id
                });
            } else {
                const prompt = getLocalizedPrompt(lang, {
                    zh: ADMIN_CANNOT_FIND_USER_ID_PROMPT_ZH,
                    en: ADMIN_CANNOT_FIND_USER_ID_PROMPT_EN
                });
                await sendMessage({ chat_id: ADMIN_UID, text: prompt });
            }
        } else {
            const prompt = getLocalizedPrompt(lang, {
                zh: ADMIN_REPLY_PROMPT_ZH,
                en: ADMIN_REPLY_PROMPT_EN
            });
            await sendMessage({ chat_id: ADMIN_UID, text: prompt });
        }
        return;
    }

    await handleGuestMessage(message, lang);
}

async function handleGuestMessage(message, lang) {
    const chatId = message.chat.id;

    const blocked = await nfd.get('isblocked-' + chatId, { type: "json" });
    if (blocked) {
        const prompt = getLocalizedPrompt(lang, {
            zh: USER_BLOCKED_PROMPT_ZH,
            en: USER_BLOCKED_PROMPT_EN
        });
        await sendMessage({ chat_id: chatId, text: prompt });
        return;
    }

    const forwardResult = await forwardMessage({
        chat_id: parseInt(ADMIN_UID),
        from_chat_id: message.chat.id,
        message_id: message.message_id
    });

    if (forwardResult.ok) {
        await nfd.put('msg-map-' + forwardResult.result.message_id, chatId.toString());
        await handleNotify(message, lang);
    } else {
        console.error('转发用户消息失败:', forwardResult);
        const prompt = getLocalizedPrompt(lang, {
            zh: MESSAGE_FORWARD_FAIL_PROMPT_ZH,
            en: MESSAGE_FORWARD_FAIL_PROMPT_EN
        });
        await sendMessage({ chat_id: chatId, text: prompt });
    }
}

async function handleNotify(message, lang) {
  const chatId = message.chat.id;

  if (ENABLE_NOTIFICATION) {
    const lastTimeStr = await nfd.get('lastmsg-' + chatId, { type: "text" });
    const lastTime = lastTimeStr ? parseInt(lastTimeStr, 10) : 0;

    if (Date.now() - lastTime > NOTIFY_INTERVAL) {
      await nfd.put('lastmsg-' + chatId, Date.now().toString());
      const notificationText = getLocalizedPrompt(lang, {
          zh: MESSAGE_FORWARDED_NOTIF_ZH,
          en: MESSAGE_FORWARDED_NOTIF_EN
      });
      await sendMessage({ chat_id: chatId, text: notificationText });
    }
  }
}

async function handleBlock(message, lang) {
  const guestId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "text" });

  if (!guestId) {
    const prompt = getLocalizedPrompt(lang, {
        zh: ADMIN_CANNOT_IDENTIFY_USER_PROMPT_ZH,
        en: ADMIN_CANNOT_IDENTIFY_USER_PROMPT_EN
    });
    return sendMessage({ chat_id: ADMIN_UID, text: prompt });
  }
  if (guestId === ADMIN_UID) {
    const prompt = getLocalizedPrompt(lang, {
        zh: ADMIN_BLOCK_SELF_PROMPT_ZH,
        en: ADMIN_BLOCK_SELF_PROMPT_EN
    });
    return sendMessage({ chat_id: ADMIN_UID, text: prompt });
  }

  await nfd.put('isblocked-' + guestId, true);
  await sendMessage({ chat_id: parseInt(ADMIN_UID), text: getLocalizedPrompt(lang, {
      zh: `✅ 用户 \`${guestId}\` 已被成功屏蔽。`,
      en: `✅ User \`${guestId}\` has been successfully blocked.`
  }), parse_mode: 'Markdown' });

  const userBlockedPrompt = getLocalizedPrompt(guestId.startsWith('zh') ? 'zh' : 'en', {
      zh: USER_BLOCKED_PROMPT_ZH,
      en: USER_BLOCKED_PROMPT_EN
  });
  await sendMessage({ chat_id: parseInt(guestId), text: userBlockedPrompt });
}

async function handleUnblock(message, lang) {
  const guestId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "text" });

  if (!guestId) {
    const prompt = getLocalizedPrompt(lang, {
        zh: ADMIN_CANNOT_IDENTIFY_USER_PROMPT_ZH,
        en: ADMIN_CANNOT_IDENTIFY_USER_PROMPT_EN
    });
    return sendMessage({ chat_id: ADMIN_UID, text: prompt });
  }

  await nfd.put('isblocked-' + guestId, false);
  await sendMessage({ chat_id: parseInt(ADMIN_UID), text: getLocalizedPrompt(lang, {
      zh: `✅ 用户 \`${guestId}\` 已被成功解除屏蔽。`,
      en: `✅ User \`${guestId}\` has been successfully unblocked.`
  }), parse_mode: 'Markdown' });

  const userUnblockedPrompt = getLocalizedPrompt(guestId.startsWith('zh') ? 'zh' : 'en', {
      zh: USER_UNBLOCKED_PROMPT_ZH,
      en: USER_UNBLOCKED_PROMPT_EN
  });
  await sendMessage({ chat_id: parseInt(guestId), text: userUnblockedPrompt });
}

async function checkBlock(message, lang) {
  const guestId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "text" });

  if (!guestId) {
    const prompt = getLocalizedPrompt(lang, {
        zh: ADMIN_CANNOT_IDENTIFY_USER_PROMPT_ZH,
        en: ADMIN_CANNOT_IDENTIFY_USER_PROMPT_EN
    });
    return sendMessage({ chat_id: ADMIN_UID, text: prompt });
  }

  const blocked = await nfd.get('isblocked-' + guestId, { type: "json" });
  await sendMessage({
    chat_id: parseInt(ADMIN_UID),
    text: getLocalizedPrompt(lang, {
        zh: `用户信息：\`${guestId}\` ${blocked ? '已被屏蔽 🚫' : '未被屏蔽 ✅'}`,
        en: `User Info: \`${guestId}\` ${blocked ? 'is blocked 🚫' : 'is not blocked ✅'}`
    }),
    parse_mode: 'Markdown'
  });
}

async function registerWebhook(event, url) {
  const webhookUrl = `${url.protocol}//${url.hostname}${WEBHOOK}`;
  const res = await setWebhook(webhookUrl, SECRET);
  return new Response(JSON.stringify(res, null, 2), { headers: { 'Content-Type': 'application/json' } });
}

async function unRegisterWebhook() {
  const res = await setWebhook('');
  return new Response(JSON.stringify(res, null, 2), { headers: { 'Content-Type': 'application/json' } });
}

async function setBotCommands() {
  const adminCommands = [
    { command: "block", description: "屏蔽用户 (需回复用户消息)" },
    { command: "unblock", description: "解除屏蔽 (需回复用户消息)" },
    { command: "checkblock", description: "查询屏蔽状态 (需回复用户消息)" }
  ];

  const userCommands = [
    { command: "start", description: "获取关于此机器人的信息" },
  ];

  const userRes = await setMyCommands(userCommands);
  if (!userRes.ok) {
    console.error('设置用户命令失败:', userRes);
  }

  const adminScope = {
    type: "chat",
    chat_id: parseInt(ADMIN_UID)
  };
  const adminRes = await setMyCommands(adminCommands, adminScope);
  if (!adminRes.ok) {
    console.error('设置管理员命令失败:', adminRes);
  }

  return { userCommandsSet: userRes.ok, adminCommandsSet: adminRes.ok, adminResponse: adminRes };
}

async function handleSetMenu() {
  const res = await setBotCommands();
  return new Response(JSON.stringify(res, null, 2), { headers: { 'Content-Type': 'application/json' } });
}

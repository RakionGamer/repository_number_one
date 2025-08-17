import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN || '8053119867:AAG1vVTjrgAUlj0DTYeGKfYzDthLXmHNt2I';
const bot = new TelegramBot(token);

const webhookUrl = 'https://mp-tasas.vercel.app/api/bot';

bot.setWebHook(webhookUrl)
  .then(() => console.log('✅ Webhook configurado en:', webhookUrl))
  .catch(console.error);

bot.getWebHookInfo()
  .then(info => console.log('ℹ️ Info del webhook:', info))

  .catch(console.error);

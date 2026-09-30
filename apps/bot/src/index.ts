import { createBot } from './bot';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.log('[bot] TELEGRAM_BOT_TOKEN not set — bot not started. Set it to run the Telegram bot.');
  process.exit(0);
}

const bot = createBot(token);
console.log('[bot] starting long-polling…');
bot.start();

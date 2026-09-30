import { Bot, InlineKeyboard } from 'grammy';
import { Role, Locale } from '@dayak/db';
import { notifyNewRequest } from '@dayak/notifications';
import { onboardFromBot, createBrowseRequest, buildMagicLink, parseSource } from './logic';
import * as texts from './texts';

const LOCALES: Locale[] = [Locale.hy, Locale.ru, Locale.en];

export function createBot(token: string): Bot {
  const bot = new Bot(token);
  // Remember the deep-link source per Telegram user until they finish onboarding.
  const pendingSource = new Map<number, string | null>();

  bot.command('start', async (ctx) => {
    if (ctx.from) pendingSource.set(ctx.from.id, parseSource(ctx.match));
    const kb = new InlineKeyboard()
      .text('Հայերեն', 'lang:hy')
      .text('Русский', 'lang:ru')
      .text('English', 'lang:en');
    await ctx.reply(texts.CHOOSE_LANGUAGE, { reply_markup: kb });
  });

  bot.command('id', async (ctx) => {
    await ctx.reply(`chat_id: ${ctx.chat?.id}\nuser_id: ${ctx.from?.id}`);
  });

  bot.callbackQuery(/^lang:(hy|ru|en)$/, async (ctx) => {
    const locale = ctx.match![1] as Locale;
    const kb = new InlineKeyboard()
      .text(texts.roleParent[locale], `role:PARENT:${locale}`)
      .text(texts.roleNanny[locale], `role:NANNY:${locale}`);
    await ctx.editMessageText(texts.chooseRole[locale], { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^role:(PARENT|NANNY):(hy|ru|en)$/, async (ctx) => {
    const role = ctx.match![1] as Role;
    const locale = ctx.match![2] as Locale;
    const from = ctx.from;
    if (!from) return;

    const name =
      [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Telegram user';
    const source = pendingSource.get(from.id) ?? null;

    const res = await onboardFromBot({
      telegramId: BigInt(from.id),
      name,
      role,
      locale,
      source,
    });

    if (res.role === Role.NANNY) {
      const link = await buildMagicLink(res.userId, locale, '/nanny/interview');
      await ctx.editMessageText(texts.nannyDone(locale, link));
    } else {
      if (res.parentProfileId) {
        const requestId = await createBrowseRequest(res.parentProfileId);
        await notifyNewRequest(requestId);
      }
      const link = await buildMagicLink(res.userId, locale, '/dashboard');
      await ctx.editMessageText(texts.parentDone(locale, link));
    }
    await ctx.answerCallbackQuery();
    pendingSource.delete(from.id);
  });

  return bot;
}

export { LOCALES };

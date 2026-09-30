import type { EmailContent } from './templates';

/** Send email via Resend REST; logs to console in dev when no key is set. */
export async function sendEmail(to: string | null | undefined, content: EmailContent): Promise<void> {
  if (!to) return;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email:dev] to=${to} subject="${content.subject}"`);
    return;
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'Dayak <hello@dayak.am>',
        to,
        subject: content.subject,
        text: content.body,
      }),
    });
  } catch (e) {
    console.error('[email] send failed', e);
  }
}

/** Send a Telegram message; logs to console in dev when no bot token is set. */
export async function sendTelegram(chatId: bigint | string | null | undefined, text: string): Promise<void> {
  if (chatId == null) return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log(`[telegram:dev] chat=${chatId} text="${text.replace(/\n/g, ' ')}"`);
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId.toString(), text }),
    });
  } catch (e) {
    console.error('[telegram] send failed', e);
  }
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

import { z } from 'zod';
import { prisma, NannyStatus, Locale } from '@dayak/db';
import {
  streamTurn,
  processFinishedInterview,
  trace,
  DEFAULT_MODEL,
  MAX_TURNS,
  type TranscriptTurn,
} from '@dayak/ai';
import { requireNanny, UnauthorizedError } from '@/lib/session';
import { completeInterviewToDocs } from '@/server/onboarding';
import { rateLimit, LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ message: z.string().max(4000).optional() });

function sse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let nannyId: string;
  try {
    ({
      nanny: { id: nannyId },
    } = await requireNanny());
  } catch (e) {
    if (e instanceof UnauthorizedError) return new Response('forbidden', { status: 403 });
    throw e;
  }

  // Rate limit: 60 interview turns / hour per nanny (spec 11.7).
  const rl = rateLimit(`interview:${nannyId}`, LIMITS.interviewTurn.limit, LIMITS.interviewTurn.windowMs);
  if (!rl.ok) {
    return new Response('rate_limited', {
      status: 429,
      headers: { 'retry-after': String(rl.retryAfterSec) },
    });
  }

  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview || interview.nannyId !== nannyId) {
    return new Response('not_found', { status: 404 });
  }
  if (interview.completedAt) {
    return new Response('completed', { status: 409 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new Response('bad_request', { status: 400 });

  const transcript = (interview.transcript as unknown as TranscriptTurn[]) ?? [];
  if (transcript.length >= MAX_TURNS * 2) {
    return new Response('turn_limit', { status: 429 });
  }

  // Append the user's message (if any) before the interviewer's turn.
  const now = Date.now();
  if (parsed.data.message && parsed.data.message.trim()) {
    transcript.push({ role: 'user', content: parsed.data.message.trim(), ts: now });
  }

  const locale = interview.locale as Locale;
  await trace({
    name: 'interview_turn',
    userId: nannyId,
    model: DEFAULT_MODEL,
    locale,
    metadata: { interviewId: id, turns: transcript.length },
  });

  const encoder = new TextEncoder();
  let assistantText = '';
  let finished = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const ev of streamTurn({ locale, transcript })) {
          if (ev.type === 'text') {
            assistantText += ev.text;
            controller.enqueue(encoder.encode(sse({ type: 'text', text: ev.text })));
          } else if (ev.type === 'finish') {
            finished = true;
            if (assistantText.trim()) {
              transcript.push({ role: 'assistant', content: assistantText, ts: Date.now() });
              assistantText = '';
            }
            // Persist transcript + structured, advance status, seed profile/refs.
            await prisma.interview.update({
              where: { id },
              data: { transcript: transcript as object },
            });
            await processFinishedInterview(id, ev.structured);
            await completeInterviewToDocs(nannyId, nannyId);
            controller.enqueue(encoder.encode(sse({ type: 'done', status: NannyStatus.DOCS_PENDING })));
          }
        }

        if (!finished) {
          if (assistantText.trim()) {
            transcript.push({ role: 'assistant', content: assistantText, ts: Date.now() });
          }
          await prisma.interview.update({
            where: { id },
            data: { transcript: transcript as object },
          });
          controller.enqueue(encoder.encode(sse({ type: 'end' })));
        }
      } catch {
        controller.enqueue(encoder.encode(sse({ type: 'error' })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}

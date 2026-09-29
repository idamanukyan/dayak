/**
 * Minimal LLM-call tracer (spec Section 2/5.2 — Langfuse). No-op unless Langfuse
 * env keys are configured. Kept dependency-free: when keys are present it posts a
 * trace to Langfuse's ingestion endpoint via fetch; otherwise it does nothing.
 * A fuller Langfuse integration (spans, generations) can replace this later.
 */
export interface TraceInput {
  name: string;
  userId?: string;
  model: string;
  locale: string;
  metadata?: Record<string, unknown>;
}

export function langfuseEnabled(): boolean {
  return !!process.env.LANGFUSE_PUBLIC_KEY && !!process.env.LANGFUSE_SECRET_KEY;
}

export async function trace(input: TraceInput): Promise<void> {
  if (!langfuseEnabled()) return;
  const host = process.env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com';
  const auth = Buffer.from(
    `${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`,
  ).toString('base64');
  try {
    await fetch(`${host}/api/public/ingestion`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Basic ${auth}` },
      body: JSON.stringify({
        batch: [
          {
            type: 'trace-create',
            id: `${input.name}-${input.userId ?? 'anon'}`,
            body: {
              name: input.name,
              userId: input.userId,
              metadata: { model: input.model, locale: input.locale, ...input.metadata },
            },
          },
        ],
      }),
    });
  } catch {
    // Tracing must never break an interview turn.
  }
}

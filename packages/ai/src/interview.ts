import Anthropic from '@anthropic-ai/sdk';
import type { Locale } from '@dayak/db';
import { systemPromptFor } from './prompts';
import {
  finishInterviewSchema,
  finishInterviewJsonSchema,
  FINISH_TOOL_NAME,
  type FinishInterview,
} from './finishTool';

export interface TranscriptTurn {
  role: 'assistant' | 'user';
  content: string;
  ts: number;
}

export type TurnEvent =
  | { type: 'text'; text: string }
  | { type: 'finish'; structured: FinishInterview };

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5';
export const MAX_TURNS = 40;

/** Real API when a key is present; deterministic mock otherwise (dev/tests/offline). */
export function useMock(): boolean {
  return process.env.DAYAK_AI_MOCK === '1' || !process.env.ANTHROPIC_API_KEY;
}

export interface StreamTurnOptions {
  locale: Locale;
  transcript: TranscriptTurn[];
  model?: string;
}

/** Stream one interviewer turn. Yields text deltas and, at completion, a finish event. */
export async function* streamTurn(opts: StreamTurnOptions): AsyncGenerator<TurnEvent> {
  if (useMock()) {
    yield* mockTurn(opts);
    return;
  }
  yield* anthropicTurn(opts);
}

// --- Real Anthropic provider ---
async function* anthropicTurn(opts: StreamTurnOptions): AsyncGenerator<TurnEvent> {
  const client = new Anthropic();
  const model = opts.model ?? DEFAULT_MODEL;

  const messages: Anthropic.MessageParam[] = opts.transcript.map((t) => ({
    role: t.role,
    content: t.content,
  }));

  // `strict` is accepted by the API but not yet in this SDK's Tool type — cast.
  const finishTool = {
    name: FINISH_TOOL_NAME,
    description:
      'Record the structured interview result once every topic has been covered. Call this exactly once, at the end.',
    strict: true,
    input_schema: finishInterviewJsonSchema,
  } as unknown as Anthropic.Tool;

  const stream = client.messages.stream({
    model,
    max_tokens: 1024,
    thinking: { type: 'disabled' },
    system: systemPromptFor(opts.locale),
    tools: [finishTool],
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield { type: 'text', text: event.delta.text };
    }
  }

  const final = await stream.finalMessage();
  const toolUse = final.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === FINISH_TOOL_NAME,
  );
  if (toolUse) {
    const parsed = finishInterviewSchema.safeParse(toolUse.input);
    if (parsed.success) {
      yield { type: 'finish', structured: parsed.data };
    }
  }
}

// --- Deterministic offline mock ---
const MOCK_QUESTIONS: Record<Locale, string[]> = {
  hy: [
    'Բարև Ձեզ։ Ուրախ եմ ծանոթանալ։ Քանի՞ տարվա փորձ ունեք դայակի աշխատանքում։',
    'Ո՞ր տարիքի երեխաների հետ եք ամենավստահ աշխատում։',
    'Պատմեք մի դեպք, երբ երեխան հիվանդացավ Ձեր հսկողության տակ։ Ի՞նչ արեցիք։',
    'Ո՞ր թաղամասերում եք պատրաստ աշխատել, և որքա՞ն է ճանապարհը։',
    'Ի՞նչ ժամացույց և վարձ եք ակնկալում (ժամով և ամսով, դրամով)։',
    'Խնդրում եմ նշեք երկու երաշխավոր՝ ծնողներ, ում մոտ աշխատել եք (անուն և հեռախոս)։',
  ],
  ru: [
    'Здравствуйте! Рада знакомству. Сколько лет вы работаете няней?',
    'С детьми какого возраста вам работать увереннее всего?',
    'Расскажите случай, когда ребёнок заболел при вас. Что вы сделали?',
    'В каких районах вы готовы работать и сколько занимает дорога?',
    'Какой график и ставку вы ожидаете (в час и в месяц, в драмах)?',
    'Назовите, пожалуйста, двух рекомендателей — родителей, у которых вы работали (имя и телефон).',
  ],
  en: [
    "Hello! Lovely to meet you. How many years have you worked as a nanny?",
    'Which age group are you most confident working with?',
    'Tell me about a time a child fell ill on your watch. What did you do?',
    'Which districts will you travel to, and how long is the commute?',
    'What schedule and rate do you expect (per hour and per month, in AMD)?',
    'Please share two references — parents you worked for (name and phone).',
  ],
};

const MOCK_CLOSING: Record<Locale, string> = {
  hy: 'Շնորհակալություն Ձեր պատասխանների համար։ Հարցազրույցն ավարտված է. մեր համակարգողը շուտով կկապվի Ձեզ հետ։',
  ru: 'Спасибо за ваши ответы. Интервью завершено — наш координатор скоро свяжется с вами.',
  en: 'Thank you for your answers. The interview is complete — our coordinator will be in touch soon.',
};

async function* mockTurn(opts: StreamTurnOptions): AsyncGenerator<TurnEvent> {
  const questions = MOCK_QUESTIONS[opts.locale];
  const userTurns = opts.transcript.filter((t) => t.role === 'user').length;

  if (userTurns < questions.length) {
    // Ask the next scripted question. (Scripted flow is inherently immune to
    // prompt-injection in user turns — see the guardrail test.)
    const q = questions[userTurns]!;
    for (const chunk of q.match(/.{1,24}(\s|$)/g) ?? [q]) {
      yield { type: 'text', text: chunk };
    }
    return;
  }

  // All topics covered → closing line + finish.
  yield { type: 'text', text: MOCK_CLOSING[opts.locale] };
  yield { type: 'finish', structured: buildMockStructured(opts) };
}

function buildMockStructured(opts: StreamTurnOptions): FinishInterview {
  return finishInterviewSchema.parse({
    experience_years: 5,
    last_families: [{ child_ages: '2,5', duration_months: 18, why_ended: 'family moved' }],
    age_groups_ok: ['1-3', '3-6'],
    age_groups_declined: ['0-1'],
    districts: ['ARABKIR', 'KENTRON'],
    max_commute_min: 40,
    schedules: ['FULL_DAY'],
    earliest_start: 'this_week',
    rate_hour_amd: 1500,
    rate_month_amd: 250000,
    languages: [
      { code: 'HY', level: 'native' },
      { code: 'RU', level: 'fluent' },
    ],
    currently_placed_via: 'none',
    backup_willing: true,
    backup_days_per_week: 2,
    references: [
      { name: 'Ref One', phone: '+37491000001', relation: 'parent_employer' },
      { name: 'Ref Two', phone: '+37491000002', relation: 'parent_employer' },
    ],
    id_consent: true,
    red_flags: [],
    strengths: ['calm', 'experienced with toddlers'],
    summary_for_admin:
      'Mock summary: 5 years experience, confident with 1–6y, willing backup 2 days/week, two parent references provided.',
    public_summary: 'Experienced, calm nanny confident with toddlers and preschoolers.',
    consistency_score: 82,
  });
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Msg {
  role: 'assistant' | 'user';
  content: string;
}

export function InterviewChat({
  interviewId,
  initialTranscript,
}: {
  interviewId: string;
  initialTranscript: Msg[];
}) {
  const t = useTranslations('nanny.interview');
  const locale = useLocale();

  const [messages, setMessages] = useState<Msg[]>(
    initialTranscript.map((m) => ({ role: m.role, content: m.content })),
  );
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const sendTurn = useCallback(
    async (message?: string) => {
      setBusy(true);
      // Append an empty assistant bubble we stream into.
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      try {
        const res = await fetch(`/api/interview/${interviewId}/turn`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(message ? { message } : {}),
        });
        if (!res.ok || !res.body) throw new Error('turn_failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';
          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith('data:')) continue;
            const evt = JSON.parse(line.slice(5).trim());
            if (evt.type === 'text') {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  content: next[next.length - 1]!.content + evt.text,
                };
                return next;
              });
            } else if (evt.type === 'done') {
              setDone(true);
            }
          }
        }
      } catch {
        setMessages((prev) => {
          const next = [...prev];
          if (next[next.length - 1]?.content === '') next.pop();
          return next;
        });
      } finally {
        setBusy(false);
      }
    },
    [interviewId],
  );

  // Kick off the interviewer's opening question if the transcript is empty.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (messages.length === 0) void sendTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After completion, return to the dashboard. Hard navigation avoids serving a
  // stale Router Cache entry of the dashboard from before the status changed.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => {
      window.location.href = `/${locale}/nanny`;
    }, 2500);
    return () => clearTimeout(id);
  }, [done, locale]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy || done) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    void sendTurn(text);
  }

  const lastIsEmptyAssistant =
    busy && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '';

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={scrollRef}
        className="flex h-[55vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
              m.role === 'assistant'
                ? 'self-start bg-muted text-foreground'
                : 'self-end bg-primary text-primary-foreground',
            )}
          >
            {m.content || (lastIsEmptyAssistant && i === messages.length - 1 ? t('typing') : '')}
          </div>
        ))}
      </div>

      {done ? (
        <p className="rounded-xl bg-verified/10 px-4 py-3 text-center text-sm font-medium text-verified">
          {t('done')}
        </p>
      ) : (
        <form onSubmit={submit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e);
            }}
            rows={2}
            placeholder={t('placeholder')}
            disabled={busy}
            className="flex-1 resize-none rounded-xl border border-input bg-card p-3 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <Button type="submit" disabled={busy || !input.trim()} aria-label={t('send')}>
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">{busy ? t('sending') : t('send')}</span>
          </Button>
        </form>
      )}
    </div>
  );
}

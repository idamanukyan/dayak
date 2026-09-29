import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingChecklist } from '@/lib/onboarding';

export function Stepper({ checklist }: { checklist: OnboardingChecklist }) {
  const t = useTranslations('nanny');
  const steps = [
    { key: 'profile', done: checklist.profileComplete },
    { key: 'interview', done: checklist.interviewComplete },
    { key: 'documents', done: checklist.documentsComplete },
    { key: 'references', done: checklist.referencesComplete },
  ] as const;

  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {steps.map((step, i) => (
        <li
          key={step.key}
          className={cn(
            'flex flex-col gap-2 rounded-2xl border p-4',
            step.done ? 'border-verified/30 bg-verified/5' : 'border-border bg-card',
          )}
        >
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
              step.done ? 'bg-verified text-verified-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {step.done ? <Check className="h-4 w-4" /> : i + 1}
          </span>
          <span className="text-sm font-medium">{t(`steps.${step.key}`)}</span>
          <span className={cn('text-xs', step.done ? 'text-verified' : 'text-muted-foreground')}>
            {step.done ? t('done') : t('todo')}
          </span>
        </li>
      ))}
    </ol>
  );
}

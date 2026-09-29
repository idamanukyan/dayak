import { SiteHeader } from '@/components/site-header';

export function PhasePlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <>
      <SiteHeader />
      <main className="container flex min-h-[60vh] flex-col items-center justify-center gap-3 py-20 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="max-w-md text-muted-foreground">{note}</p>
      </main>
    </>
  );
}

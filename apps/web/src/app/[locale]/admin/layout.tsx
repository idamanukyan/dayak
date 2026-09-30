import { setRequestLocale } from 'next-intl/server';
import { ShieldCheck, LogOut } from 'lucide-react';
import { Role } from '@dayak/db';
import { getActor } from '@/lib/session';
import { redirect, Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/app/[locale]/auth/actions';

// Admin UI is English-only (spec 6). Lives under /[locale]/admin — link as /en/admin.
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const actor = await getActor();
  if (!actor) redirect({ href: '/auth/login', locale });
  else if (actor.role !== Role.ADMIN) redirect({ href: '/', locale });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 font-bold text-primary">
              <ShieldCheck className="h-5 w-5" /> Dayak Admin
            </span>
            <nav className="flex items-center gap-1 text-sm">
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin">Queue</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/requests">Requests</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/metrics">Metrics</Link>
              </Button>
            </nav>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}

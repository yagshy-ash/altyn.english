import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { getT } from "@/i18n/server";
import { LanguageSwitcher } from "./language-switcher";
import { NavLink, type NavItem } from "./nav-link";
import { Logo } from "./logo";

// Masaüstünde sol menü, mobilde üst bar + yatay kaydırılan menü.
// `stats`: öğrenci için seri/XP rozetleri (sağ üst).
export async function AppShell({
  nav,
  userName,
  stats,
  children,
}: {
  nav: NavItem[];
  userName: string;
  stats?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { locale, t } = await getT();
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r-2 border-line px-4 py-6 lg:flex">
        <div className="px-3">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {nav.map((n) => (
            <NavLink key={n.href} item={n} />
          ))}
        </nav>
        <div className="flex flex-col gap-3 border-t-2 border-line pt-4">
          <div className="flex items-center gap-3 px-1">
            <span className="grid size-10 place-items-center rounded-full bg-yellow text-sm font-black text-white">{initials}</span>
            <span className="min-w-0 flex-1 truncate font-bold">{userName}</span>
            <form action={logout}>
              <button title={t.nav.logout} aria-label={t.nav.logout} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-line/60 hover:text-ink">
                <LogOut size={18} />
              </button>
            </form>
          </div>
          <LanguageSwitcher current={locale} label={t.common.language} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b-2 border-line bg-bg/95 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Logo />
            <div className="ml-auto flex items-center gap-2">{stats}</div>
            <form action={logout}>
              <button aria-label={t.nav.logout} className="grid size-9 place-items-center rounded-xl text-muted">
                <LogOut size={18} />
              </button>
            </form>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {nav.map((n) => (
              <NavLink key={n.href} item={n} compact />
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {stats && <div className="mb-6 hidden items-center justify-end gap-3 lg:flex">{stats}</div>}
          {children}
          <div className="mt-10 flex justify-center lg:hidden">
            <LanguageSwitcher current={locale} label={t.common.language} />
          </div>
        </main>
      </div>
    </div>
  );
}

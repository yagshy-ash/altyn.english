"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Headphones,
  Home,
  Layers,
  LayoutDashboard,
  Library,
  Megaphone,
  MessageCircle,
  Mic,
  PenLine,
  Puzzle,
  RotateCcw,
  Users,
  type LucideIcon,
} from "lucide-react";

// Sunucu bileşenleri fonksiyon (ikon) geçemez; ikonlar isimle seçilir
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  overview: LayoutDashboard,
  students: Users,
  calendar: CalendarDays,
  posts: Megaphone,
  content: Library,
  assignments: ClipboardList,
  vocabulary: Layers,
  reading: BookOpen,
  listening: Headphones,
  grammar: Puzzle,
  writing: PenLine,
  speaking: Mic,
  chat: MessageCircle,
  review: RotateCcw,
  lessons: CalendarDays,
};

const COLORS: Record<string, string> = {
  vocabulary: "text-purple",
  reading: "text-blue",
  listening: "text-orange",
  grammar: "text-green",
  writing: "text-pink",
  speaking: "text-teal",
  chat: "text-blue",
  review: "text-purple",
};

export type NavItem = { href: string; label: string; icon: string; exact?: boolean; badge?: number };

export function NavLink({ item, compact }: { item: NavItem; compact?: boolean }) {
  const path = usePathname();
  const active = item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/");
  const Icon = ICONS[item.icon] ?? Home;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={
        compact
          ? "flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-transparent px-3 py-1.5 text-xs font-extrabold tracking-wide text-muted uppercase aria-[current=page]:border-blue aria-[current=page]:bg-blue-soft aria-[current=page]:text-blue-dark"
          : "group flex items-center gap-3 rounded-2xl border-2 border-transparent px-3 py-2.5 text-sm font-extrabold tracking-wide text-muted uppercase hover:bg-line/50 aria-[current=page]:border-blue aria-[current=page]:bg-blue-soft aria-[current=page]:text-blue-dark"
      }
    >
      <Icon size={compact ? 16 : 24} strokeWidth={2.5} className={COLORS[item.icon] ?? ""} />
      <span className="truncate">{item.label}</span>
      {!!item.badge && (
        <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-red px-1.5 text-[11px] text-white">{item.badge}</span>
      )}
    </Link>
  );
}

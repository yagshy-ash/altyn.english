import { requireStudent } from "@/lib/dal";
import { studentStats } from "@/lib/student-data";
import { getT } from "@/i18n/server";
import { AppShell } from "@/components/app-shell";
import { StatBadges } from "@/components/stat-badges";
import { Heartbeat } from "@/components/heartbeat";

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const user = await requireStudent();
  const { t } = await getT();
  const stats = await studentStats(user.id);
  const nav = [
    { href: "/student", label: t.nav.home, icon: "home", exact: true },
    { href: "/student/review", label: t.nav.review, icon: "review", badge: stats.due },
    { href: "/student/vocabulary", label: t.skills.VOCABULARY.name, icon: "vocabulary" },
    { href: "/student/reading", label: t.skills.READING.name, icon: "reading" },
    { href: "/student/listening", label: t.skills.LISTENING.name, icon: "listening" },
    { href: "/student/grammar", label: t.skills.GRAMMAR.name, icon: "grammar" },
    { href: "/student/writing", label: t.skills.WRITING.name, icon: "writing" },
    { href: "/student/speaking", label: t.skills.SPEAKING.name, icon: "speaking" },
    { href: "/student/chat", label: t.nav.chat, icon: "chat" },
    { href: "/student/lessons", label: t.nav.lessons, icon: "lessons" },
  ];
  return (
    <AppShell nav={nav} userName={user.name} stats={<StatBadges streak={stats.streak} xp={stats.xp} streakLabel={t.student.streak} />}>
      <Heartbeat />
      {children}
    </AppShell>
  );
}

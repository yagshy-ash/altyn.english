import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { AppShell } from "@/components/app-shell";

export default async function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  const user = await requireTeacher();
  const { t } = await getT();
  const overdue = await db.assignment.count({ where: { teacherId: user.id, completedAt: null, dueAt: { lt: new Date() } } });
  const nav = [
    { href: "/teacher", label: t.nav.overview, icon: "overview", exact: true },
    { href: "/teacher/students", label: t.nav.students, icon: "students" },
    { href: "/teacher/calendar", label: t.nav.calendar, icon: "calendar" },
    { href: "/teacher/posts", label: t.nav.posts, icon: "posts" },
    { href: "/teacher/videos", label: t.nav.videos, icon: "videos" },
    { href: "/teacher/content", label: t.nav.content, icon: "content" },
    { href: "/teacher/assignments", label: t.nav.assignments, icon: "assignments", badge: overdue },
  ];
  return (
    <AppShell nav={nav} userName={user.name}>
      {children}
    </AppShell>
  );
}

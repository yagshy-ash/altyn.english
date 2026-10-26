import { ExternalLink, Pin } from "lucide-react";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatDate } from "@/lib/format";
import { deletePost, togglePin } from "@/app/actions/teacher";
import { DeleteButton } from "@/components/delete-button";
import { PinButton } from "./pin-button";
import { PostForm } from "./post-form";

export default async function PostsPage() {
  const teacher = await requireTeacher();
  const { locale, t } = await getT();
  const [posts, students] = await Promise.all([
    db.post.findMany({
      where: { teacherId: teacher.id },
      include: { student: { select: { name: true } } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    db.user.findMany({ where: { teacherId: teacher.id, active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="h1">📣 {t.posts.title}</h1>
      <section className="card border-b-4">
        <PostForm students={students} t={t} />
      </section>
      {posts.length ? (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => (
            <li key={p.id} className={`card flex flex-col gap-2 ${p.pinned ? "border-yellow bg-yellow-soft" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="chip bg-blue-soft text-blue-dark">
                  {p.student ? p.student.name : p.level ? fmt(t.posts.levelOnly, { level: p.level }) : t.posts.everyone}
                </span>
                {p.pinned && (
                  <span className="chip bg-yellow text-white">
                    <Pin size={12} /> {t.posts.pinned}
                  </span>
                )}
                <span className="ml-auto text-xs font-bold text-muted">{formatDate(p.createdAt, locale, true)}</span>
                <PinButton action={togglePin.bind(null, p.id)} label={t.posts.pin} pinned={p.pinned} />
                <DeleteButton action={deletePost.bind(null, p.id)} confirm={t.common.confirmDelete} label={t.common.delete} />
              </div>
              <p className="font-semibold whitespace-pre-wrap">{p.body}</p>
              {p.link && (
                <a href={p.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-extrabold break-all text-blue">
                  <ExternalLink size={14} /> {p.link}
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center font-semibold text-muted">{t.posts.empty}</p>
      )}
    </div>
  );
}

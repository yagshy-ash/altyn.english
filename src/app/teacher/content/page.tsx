import Link from "next/link";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n";
import { SKILLS } from "@/lib/skills";
import { SkillIcon } from "@/components/skill-icon";
import { Level, Skill } from "@/generated/prisma/enums";
import { GenerateForm } from "./generate-form";
import { TextForm } from "./text-form";

export default async function ContentLibrary({ searchParams }: PageProps<"/teacher/content">) {
  await requireTeacher();
  const { t } = await getT();
  const sp = await searchParams;
  const level = Object.values(Level).includes(sp.level as Level) ? (sp.level as Level) : undefined;
  const skill = SKILLS.includes(sp.skill as Skill) ? (sp.skill as Skill) : undefined;

  const [items, counts] = await Promise.all([
    db.content.findMany({
      where: { ...(level ? { level } : {}), ...(skill ? { skill } : {}) },
      orderBy: [{ level: "asc" }, { skill: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { attempts: true, assignments: true } } },
    }),
    db.content.groupBy({ by: ["level"], _count: { _all: true } }),
  ]);
  const href = (p: { level?: string; skill?: string }) => {
    const q = new URLSearchParams();
    const l = "level" in p ? p.level : level;
    const s = "skill" in p ? p.skill : skill;
    if (l) q.set("level", l);
    if (s) q.set("skill", s);
    return `/teacher/content${q.size ? `?${q}` : ""}`;
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem] xl:items-start">
      <section className="flex min-w-0 flex-col gap-4">
        <h1 className="h1">📚 {t.content.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={href({ level: undefined })} className={`btn btn-sm ${!level ? "btn-blue" : ""}`}>{t.common.all}</Link>
          {Object.values(Level).map((l) => (
            <Link key={l} href={href({ level: l })} className={`btn btn-sm ${level === l ? "btn-blue" : ""}`}>
              {l} <span className="opacity-70">{counts.find((c) => c.level === l)?._count._all ?? 0}</span>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={href({ skill: undefined })} className={`btn btn-sm ${!skill ? "btn-blue" : ""}`}>{t.common.all}</Link>
          {SKILLS.map((s) => (
            <Link key={s} href={href({ skill: s })} className={`btn btn-sm ${skill === s ? "btn-blue" : ""}`}>{t.skills[s].name}</Link>
          ))}
        </div>
        <p className="font-bold text-muted">{fmt(t.content.count, { n: items.length })}</p>
        {items.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {items.map((c) => (
              <li key={c.id}>
                <Link href={`/teacher/content/${c.id}`} className={`card flex h-full items-start gap-3 border-b-4 p-4 transition-transform hover:-translate-y-0.5 ${c.published ? "" : "opacity-60"}`}>
                  <SkillIcon skill={c.skill} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{c.title}</p>
                    <p className="truncate text-sm font-semibold text-muted">{c.topic}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="chip bg-yellow-soft text-yellow-dark">{c.level}</span>
                      {!c.aiGenerated && <span className="chip bg-blue-soft text-blue-dark">{t.ownText.own}</span>}
                      {!c.published && <span className="chip bg-line">{t.content.hidden}</span>}
                      {c._count.attempts > 0 && <span className="chip bg-green-soft text-green-dark">✓ {c._count.attempts}</span>}
                      {c._count.assignments > 0 && <span className="chip bg-purple-soft text-purple-dark">📌 {c._count.assignments}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card font-semibold text-muted">{t.content.empty}</p>
        )}
      </section>
      <div className="flex flex-col gap-6">
        <section className="card border-b-4">
          <h2 className="h2 mb-4">📝 {t.ownText.heading}</h2>
          <TextForm t={t} defaultLevel={level} />
        </section>
        <section className="card border-b-4">
          <h2 className="h2 mb-4">✨ {t.content.generate}</h2>
          <GenerateForm t={t} defaultLevel={level} defaultSkill={skill} />
        </section>
      </div>
    </div>
  );
}

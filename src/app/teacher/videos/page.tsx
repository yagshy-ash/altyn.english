import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatDate } from "@/lib/format";
import { MAX_VIDEOS_PER_LEVEL, thumbnailUrl } from "@/lib/youtube";
import { deleteVideo } from "@/app/actions/teacher";
import { DeleteButton } from "@/components/delete-button";
import { Level } from "@/generated/prisma/enums";
import { VideoForm } from "./video-form";

export default async function VideosPage() {
  const teacher = await requireTeacher();
  const { locale, t } = await getT();
  const videos = await db.video.findMany({ where: { teacherId: teacher.id }, orderBy: { createdAt: "asc" } });
  const byLevel = Object.values(Level).map((level) => ({ level, items: videos.filter((v) => v.level === level) }));
  const counts = Object.fromEntries(byLevel.map((g) => [g.level, g.items.length]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="h1">🎬 {t.videos.title}</h1>
      <section className="card border-b-4">
        <VideoForm t={t} counts={counts} />
      </section>

      {videos.length ? (
        byLevel
          .filter((g) => g.items.length)
          .map((g) => (
            <section key={g.level} className="flex flex-col gap-3">
              <h2 className="h2 flex items-center gap-2">
                {t.levels[g.level]}
                <span className="chip bg-red-soft text-red-dark">
                  {fmt(t.videos.perLevel, { n: g.items.length, max: MAX_VIDEOS_PER_LEVEL })}
                </span>
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {g.items.map((v) => (
                  <li key={v.id} className="card flex gap-3 p-3">
                    <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- harici YouTube küçük resmi */}
                      <img src={thumbnailUrl(v.youtubeId)} alt="" width={160} height={90} className="h-[90px] w-[160px] rounded-xl object-cover" />
                    </a>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="line-clamp-2 font-black">{v.title}</p>
                      <p className="text-xs font-bold text-muted">{formatDate(v.createdAt, locale)}</p>
                      <div className="mt-auto self-end">
                        <DeleteButton action={deleteVideo.bind(null, v.id)} confirm={t.common.confirmDelete} label={t.common.delete} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
      ) : (
        <p className="text-center font-semibold text-muted">{t.videos.empty}</p>
      )}
    </div>
  );
}

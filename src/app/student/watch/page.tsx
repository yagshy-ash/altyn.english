import Link from "next/link";
import { Play } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { thumbnailUrl } from "@/lib/youtube";

export default async function WatchPage() {
  const student = await requireStudent();
  const { t } = await getT();
  const videos = await db.video.findMany({
    where: { level: student.level, teacherId: student.teacherId ?? undefined },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div>
        <h1 className="h1">🎬 {t.videos.studentTitle}</h1>
        <p className="font-bold text-muted">{t.videos.studentDesc}</p>
      </div>
      {videos.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <li key={v.id}>
              <Link href={`/student/watch/${v.id}`} className="card group flex flex-col gap-3 p-3 transition-transform hover:-translate-y-0.5">
                <div className="relative overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element -- harici YouTube küçük resmi */}
                  <img src={thumbnailUrl(v.youtubeId)} alt="" width={320} height={180} className="aspect-video w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/25">
                    <span className="grid size-14 place-items-center rounded-full bg-red text-white shadow-lg">
                      <Play size={26} fill="currentColor" className="ml-1" />
                    </span>
                  </span>
                </div>
                <p className="line-clamp-2 font-black">{v.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card font-semibold text-muted">{t.videos.studentEmpty}</p>
      )}
    </div>
  );
}

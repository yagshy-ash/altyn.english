import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { embedUrl } from "@/lib/youtube";

export default async function WatchVideoPage({ params }: PageProps<"/student/watch/[id]">) {
  const { id } = await params;
  const student = await requireStudent();
  const { t } = await getT();
  const video = await db.video.findFirst({ where: { id, level: student.level, teacherId: student.teacherId ?? undefined } });
  if (!video) notFound();
  const others = await db.video.findMany({
    where: { level: student.level, teacherId: video.teacherId, NOT: { id } },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link href="/student/watch" className="flex w-fit items-center gap-1 font-extrabold text-muted hover:text-ink">
        <ArrowLeft size={18} /> {t.videos.studentTitle}
      </Link>
      <h1 className="h1">{video.title}</h1>
      <div className="overflow-hidden rounded-3xl border-2 border-line bg-black">
        <iframe
          src={embedUrl(video.youtubeId)}
          title={video.title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {others.length > 0 && (
        <ul className="card flex flex-col p-2">
          {others.map((o) => (
            <li key={o.id} className="border-t-2 border-line first:border-t-0">
              <Link href={`/student/watch/${o.id}`} className="block rounded-xl p-3 font-bold hover:bg-bg">
                ▶ {o.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

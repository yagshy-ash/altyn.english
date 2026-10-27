"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createVideo } from "@/app/actions/teacher";
import { fmt, type Dict } from "@/i18n";
import { MAX_VIDEOS_PER_LEVEL } from "@/lib/youtube";
import { Level } from "@/generated/prisma/enums";

export function VideoForm({ t, counts }: { t: Dict; counts: Partial<Record<Level, number>> }) {
  const [state, action, pending] = useActionState(createVideo, undefined);
  const error =
    state?.error === "limit"
      ? fmt(t.videos.limit, { max: MAX_VIDEOS_PER_LEVEL })
      : state?.error === "badUrl"
        ? t.videos.badUrl
        : state?.error && t.common.error;
  return (
    <form key={state?.at ?? "f"} action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="url" className="label">{t.videos.url}</label>
        <input id="url" name="url" type="url" required className="input" placeholder="https://www.youtube.com/watch?v=…" />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <div>
          <label htmlFor="title" className="label">{t.videos.videoTitle}</label>
          <input id="title" name="title" required maxLength={200} className="input" />
        </div>
        <div>
          <label htmlFor="level" className="label">{t.videos.level}</label>
          <select id="level" name="level" className="input" defaultValue="A1">
            {Object.values(Level).map((l) => (
              <option key={l} value={l} disabled={(counts[l] ?? 0) >= MAX_VIDEOS_PER_LEVEL}>
                {l} · {fmt(t.videos.perLevel, { n: counts[l] ?? 0, max: MAX_VIDEOS_PER_LEVEL })}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button className="btn btn-red self-end px-8" disabled={pending}>
        <Plus size={18} /> {t.videos.add}
      </button>
      {error && <p className="font-bold text-red-dark">{error}</p>}
    </form>
  );
}

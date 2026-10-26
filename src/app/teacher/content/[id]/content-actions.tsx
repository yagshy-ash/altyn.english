"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { deleteContent, setPublished } from "@/app/actions/teacher";
import type { Dict } from "@/i18n";

export function ContentActions({ id, published, t }: { id: string; published: boolean; t: Dict }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      <p className={`font-black ${published ? "text-green-dark" : "text-muted"}`}>{published ? `● ${t.content.published}` : t.content.hidden}</p>
      <div className="flex gap-2">
        <button className="btn btn-sm flex-1" disabled={pending} onClick={() => start(() => setPublished(id, !published))}>
          {published ? <EyeOff size={14} /> : <Eye size={14} />} {published ? t.content.unpublish : t.content.publish}
        </button>
        <button
          className="btn btn-sm btn-red"
          disabled={pending}
          onClick={() => window.confirm(t.common.confirmDelete) && start(() => deleteContent(id))}
        >
          <Trash2 size={14} /> {t.common.delete}
        </button>
      </div>
    </div>
  );
}

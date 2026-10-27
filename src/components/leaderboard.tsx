import { Trophy } from "lucide-react";
import type { Dict } from "@/i18n";
import type { RankRow } from "@/lib/ranking";

const MEDAL = ["", "🥇", "🥈", "🥉"];

function Row({ r, mine, you }: { r: RankRow; mine: boolean; you: string }) {
  return (
    <li className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${mine ? "bg-yellow-soft font-black" : ""}`}>
      <span className="w-8 text-center font-black text-muted tabular-nums">{MEDAL[r.rank] ?? r.rank}</span>
      <span className="min-w-0 flex-1 truncate font-bold">
        {r.username}
        {mine && <span className="ml-1 text-xs text-yellow-dark">({you})</span>}
      </span>
      <span className="font-black text-purple tabular-nums">{r.xp} XP</span>
    </li>
  );
}

// İlk 10 + (listede değilse) bakan öğrencinin kendi satırı
export function Leaderboard({ rows, t, meId, limit = 10 }: { rows: RankRow[]; t: Dict; meId?: string; limit?: number }) {
  const top = rows.slice(0, limit);
  const me = meId ? rows.find((r) => r.id === meId) : undefined;
  const showMe = me && !top.some((r) => r.id === me.id);

  return (
    <section className="card flex flex-col gap-2">
      <h2 className="flex items-center gap-2 font-black">
        <Trophy size={20} className="text-yellow-dark" /> {t.ranking.title}
      </h2>
      <p className="text-xs font-bold text-muted">{t.ranking.hint}</p>
      {top.length ? (
        <ol className="flex flex-col">
          {top.map((r) => (
            <Row key={r.id} r={r} mine={r.id === meId} you={t.ranking.you} />
          ))}
          {showMe && (
            <>
              <li className="text-center text-muted" aria-hidden>⋯</li>
              <Row r={me} mine you={t.ranking.you} />
            </>
          )}
        </ol>
      ) : (
        <p className="font-semibold text-muted">{t.ranking.empty}</p>
      )}
    </section>
  );
}

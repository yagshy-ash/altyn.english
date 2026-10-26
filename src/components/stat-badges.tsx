import { Flame, Gem } from "lucide-react";

export function StatBadges({ streak, xp, streakLabel }: { streak: number; xp: number; streakLabel: string }) {
  return (
    <>
      <span title={`${streak} ${streakLabel}`} className="flex items-center gap-1 rounded-2xl px-2 py-1 font-black text-orange">
        <Flame size={22} fill={streak ? "currentColor" : "none"} strokeWidth={2.5} />
        <span className="tabular-nums">{streak}</span>
      </span>
      <span title="XP" className="flex items-center gap-1 rounded-2xl px-2 py-1 font-black text-blue">
        <Gem size={20} fill="currentColor" strokeWidth={2} />
        <span className="tabular-nums">{xp}</span>
      </span>
    </>
  );
}

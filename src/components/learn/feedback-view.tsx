import type { Dict } from "@/i18n";
import type { Feedback } from "@/lib/content-schemas";

// Yapay zeka değerlendirmesi: öğrenci ve öğretmen ekranlarında ortak
export function FeedbackView({ f, t }: { f: Feedback; t: Dict }) {
  const color = f.score >= 80 ? "border-green bg-green-soft" : f.score >= 50 ? "border-yellow bg-yellow-soft" : "border-red bg-red-soft";
  return (
    <div className="flex flex-col gap-4">
      <div className={`animate-pop card flex flex-wrap items-center gap-4 border-b-4 ${color}`}>
        <span className="text-5xl">{f.score >= 80 ? "🏆" : f.score >= 50 ? "💪" : "🌱"}</span>
        <div className="flex-1">
          <p className="text-3xl font-black tabular-nums">{f.score}%</p>
          <p className="font-semibold">{f.summary}</p>
        </div>
        <div className="text-center">
          <p className="eyebrow">{t.writing.levelGuess}</p>
          <p className="text-3xl font-black text-purple-dark">{f.levelGuess}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card flex flex-col gap-2">
          <h3 className="eyebrow">{t.writing.corrected}</h3>
          <p className="font-read whitespace-pre-wrap">{f.corrected}</p>
        </section>
        <section className="card flex flex-col gap-2 border-blue">
          <h3 className="eyebrow">{t.writing.natural}</h3>
          <p className="font-read whitespace-pre-wrap">{f.natural}</p>
        </section>
      </div>

      {f.mistakes.length > 0 && (
        <section className="card flex flex-col gap-1">
          <h3 className="h2 mb-2">{t.writing.mistakes}</h3>
          {f.mistakes.map((m, i) => (
            <div key={i} className="flex flex-col gap-0.5 border-t-2 border-line py-3 first:border-t-0">
              <span className="eyebrow">{t.mistakeTypes[m.type] ?? m.type}</span>
              <p className="font-bold">
                <span className="text-red line-through decoration-2">{m.wrong}</span> → <span className="text-green-dark">{m.right}</span>
              </p>
              <p className="text-sm font-semibold text-muted">{m.why}</p>
            </div>
          ))}
        </section>
      )}

      {f.tip && <p className="rounded-2xl border-l-4 border-yellow bg-yellow-soft p-4 font-semibold">💡 {f.tip}</p>}
    </div>
  );
}

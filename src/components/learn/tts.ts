// Ücretsiz tarayıcı sesi (Web Speech API). İngilizce ses seçer, yoksa varsayılanı kullanır.
export function englishVoice() {
  const voices = typeof window !== "undefined" ? window.speechSynthesis.getVoices() : [];
  return (
    voices.find((v) => v.lang === "en-US" && /Google|Natural|Samantha/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

// Sesler bazı tarayıcılarda geç yüklenir; boş liste = bu tarayıcıda konuşma sesi yok (ör. Linux'ta snap Chromium)
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", done);
    setTimeout(done, timeoutMs);
  });
}

// Chrome konuşma nesnesini erken çöpe atarsa onend hiç gelmez; konuşurken referansı tutulur
const alive = new Set<SpeechSynthesisUtterance>();
// stopSpeaking sonrası gecikmeli bekleyen konuşmaları iptal etmek için
let generation = 0;

export function speak(
  text: string,
  opts: { rate?: number; voice?: SpeechSynthesisVoice; onEnd?: () => void; onError?: () => void } = {},
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return opts.onError?.();
  const synth = window.speechSynthesis;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = opts.rate ?? 0.95;
  const voice = opts.voice ?? englishVoice();
  if (voice) u.voice = voice;
  u.onend = () => {
    alive.delete(u);
    opts.onEnd?.();
  };
  u.onerror = (e) => {
    alive.delete(u);
    // Kendi durdurmamız hata sayılmaz
    if (e.error !== "interrupted" && e.error !== "canceled") opts.onError?.();
  };
  alive.add(u);
  const gen = generation;
  // Chrome, cancel()'dan hemen sonra gelen speak()'i bazen yutar; kısa bir bekleme bunu önler
  setTimeout(() => {
    if (gen !== generation) return alive.delete(u);
    synth.resume();
    synth.speak(u);
  }, 60);
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  generation++;
  alive.clear();
  window.speechSynthesis?.cancel();
}

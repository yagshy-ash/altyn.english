// Ücretsiz tarayıcı sesi (Web Speech API). İngilizce ses seçer, yoksa varsayılanı kullanır.
export function englishVoice() {
  const voices = typeof window !== "undefined" ? window.speechSynthesis.getVoices() : [];
  return (
    voices.find((v) => v.lang === "en-US" && /Google|Natural|Samantha/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

export function speak(text: string, opts: { rate?: number; voice?: SpeechSynthesisVoice; onEnd?: () => void } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = opts.rate ?? 0.95;
  const voice = opts.voice ?? englishVoice();
  if (voice) u.voice = voice;
  if (opts.onEnd) u.onend = opts.onEnd;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Tarayıcının ücretsiz konuşma tanıması (Chrome/Edge). Desteklenmezse supported=false.
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type Ctor = new () => Recognition;
function getCtor(): Ctor | undefined {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
const noop = () => () => {};

export function useSpeech() {
  const rec = useRef<Recognition | null>(null);
  // Sunucuda "destekleniyor" varsayılır, tarayıcıda gerçek değer okunur
  const supported = useSyncExternalStore(noop, () => !!getCtor(), () => true);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const wantOn = useRef(false);

  useEffect(() => {
    const C = getCtor();
    if (!C) return;
    const r = new C();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let fin = "";
      let int = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) fin += res[0].transcript + " ";
        else int += res[0].transcript;
      }
      if (fin) setFinalText((t) => (t + " " + fin).replace(/\s+/g, " ").trimStart());
      setInterim(int);
    };
    // Chrome sessizlikte durur; kullanıcı durdurmadıysa yeniden başlat
    r.onend = () => {
      if (wantOn.current) r.start();
      else setListening(false);
    };
    r.onerror = () => {
      wantOn.current = false;
      setListening(false);
    };
    rec.current = r;
    return () => {
      wantOn.current = false;
      r.stop();
    };
  }, []);

  return {
    supported,
    listening,
    text: (finalText + " " + interim).trim(),
    finalText,
    setFinalText,
    start() {
      if (!rec.current) return;
      wantOn.current = true;
      setInterim("");
      rec.current.start();
      setListening(true);
    },
    stop() {
      wantOn.current = false;
      rec.current?.stop();
      setListening(false);
    },
  };
}

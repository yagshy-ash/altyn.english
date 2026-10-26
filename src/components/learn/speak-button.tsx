"use client";

import { Volume2 } from "lucide-react";
import { speak, stopSpeaking } from "./tts";

export function SpeakButton({ text, label, rate }: { text: string; label: string; rate?: number }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        stopSpeaking();
        speak(text, { rate });
      }}
      className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-b-4 border-blue border-b-blue-dark bg-blue text-white active:translate-y-px active:border-b-2"
    >
      <Volume2 size={18} strokeWidth={2.6} />
    </button>
  );
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Sekme görünür ve öğrenci son 2 dakikada etkileşimdeyse 30 sn'de bir süre bildirir
export function Heartbeat() {
  const path = usePathname();
  const area = path.split("/")[2] || "home";

  useEffect(() => {
    let lastInput = Date.now();
    const mark = () => (lastInput = Date.now());
    const events = ["pointerdown", "keydown", "scroll", "mousemove", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const beat = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastInput > 120_000) return;
      fetch("/api/heartbeat", { method: "POST", body: JSON.stringify({ area }), keepalive: true }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, 30_000);
    return () => {
      clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, mark));
    };
  }, [area]);

  return null;
}

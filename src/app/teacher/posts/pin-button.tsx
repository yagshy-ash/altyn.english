"use client";

import { useTransition } from "react";
import { Pin } from "lucide-react";

export function PinButton({ action, label, pinned }: { action: () => Promise<void>; label: string; pinned: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pinned}
      title={label}
      disabled={pending}
      onClick={() => start(() => action())}
      className="grid size-7 place-items-center rounded-lg text-muted hover:bg-yellow-soft aria-pressed:text-yellow-dark"
    >
      <Pin size={15} fill={pinned ? "currentColor" : "none"} />
    </button>
  );
}

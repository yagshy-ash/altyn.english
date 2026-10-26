"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({ action, confirm, label, light }: { action: () => Promise<void>; confirm: string; label: string; light?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() => window.confirm(confirm) && start(() => action())}
      className={`grid size-7 place-items-center rounded-lg ${light ? "text-white/80 hover:bg-white/20" : "text-muted hover:bg-red-soft hover:text-red-dark"}`}
    >
      <Trash2 size={15} />
    </button>
  );
}

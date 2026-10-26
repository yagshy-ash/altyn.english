import { BookOpen, Headphones, Layers, Mic, PenLine, Puzzle, type LucideIcon } from "lucide-react";
import type { Skill } from "@/generated/prisma/enums";

export const SKILL_ICON: Record<Skill, LucideIcon> = {
  VOCABULARY: Layers,
  READING: BookOpen,
  LISTENING: Headphones,
  GRAMMAR: Puzzle,
  WRITING: PenLine,
  SPEAKING: Mic,
};

// Tailwind sınıfları sabit yazılmalı (dinamik `bg-${x}` derlenmez)
export const SKILL_STYLE: Record<Skill, { solid: string; soft: string; text: string; bar: string; border: string }> = {
  VOCABULARY: { solid: "bg-purple border-b-purple-dark", soft: "bg-purple-soft", text: "text-purple-dark", bar: "bg-purple", border: "border-purple" },
  READING: { solid: "bg-blue border-b-blue-dark", soft: "bg-blue-soft", text: "text-blue-dark", bar: "bg-blue", border: "border-blue" },
  LISTENING: { solid: "bg-orange border-b-orange-dark", soft: "bg-orange-soft", text: "text-orange-dark", bar: "bg-orange", border: "border-orange" },
  GRAMMAR: { solid: "bg-green border-b-green-dark", soft: "bg-green-soft", text: "text-green-dark", bar: "bg-green", border: "border-green" },
  WRITING: { solid: "bg-pink border-b-pink-dark", soft: "bg-pink-soft", text: "text-pink-dark", bar: "bg-pink", border: "border-pink" },
  SPEAKING: { solid: "bg-teal border-b-teal-dark", soft: "bg-teal-soft", text: "text-teal-dark", bar: "bg-teal", border: "border-teal" },
};

export const SKILL_HEX: Record<Skill, string> = {
  VOCABULARY: "#ce82ff",
  READING: "#1cb0f6",
  LISTENING: "#ff9600",
  GRAMMAR: "#58cc02",
  WRITING: "#ff86d0",
  SPEAKING: "#00c2a8",
};

export function SkillIcon({ skill, size = "md" }: { skill: Skill; size?: "sm" | "md" | "lg" }) {
  const Icon = SKILL_ICON[skill];
  const box = { sm: "size-8 rounded-xl border-b-2", md: "size-12 rounded-2xl border-b-4", lg: "size-16 rounded-3xl border-b-4" }[size];
  const icon = { sm: 16, md: 24, lg: 32 }[size];
  return (
    <span className={`grid shrink-0 place-items-center text-white ${box} ${SKILL_STYLE[skill].solid}`}>
      <Icon size={icon} strokeWidth={2.6} />
    </span>
  );
}

export function ProgressBar({ value, className = "bg-green" }: { value: number; className?: string }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-line">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

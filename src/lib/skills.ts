import type { Skill } from "@/generated/prisma/enums";

// URL parçası ↔ beceri. /student/reading, /student/reading/[id] …
export const SKILL_SLUGS = {
  vocabulary: "VOCABULARY",
  reading: "READING",
  listening: "LISTENING",
  grammar: "GRAMMAR",
  writing: "WRITING",
  speaking: "SPEAKING",
} as const satisfies Record<string, Skill>;

export type SkillSlug = keyof typeof SKILL_SLUGS;
export const SKILLS: Skill[] = Object.values(SKILL_SLUGS);

export function slugOf(skill: Skill): SkillSlug {
  return (Object.keys(SKILL_SLUGS) as SkillSlug[]).find((k) => SKILL_SLUGS[k] === skill)!;
}

export function isSkillSlug(v: string): v is SkillSlug {
  return v in SKILL_SLUGS;
}

// Her becerinin rengi (Tailwind token adı)
export const SKILL_COLOR: Record<Skill, "purple" | "blue" | "orange" | "green" | "pink" | "teal"> = {
  VOCABULARY: "purple",
  READING: "blue",
  LISTENING: "orange",
  GRAMMAR: "green",
  WRITING: "pink",
  SPEAKING: "teal",
};

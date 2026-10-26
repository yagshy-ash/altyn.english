import type { Level } from "@/generated/prisma/enums";

// Seviye bazlı müfredat. Gramer sırası Oxford Guide to English Grammar bölümlerini,
// kelime temaları Oxford Picture Dictionary temalarını izler; seviyelere CEFR'e göre dağıtıldı.

export const GRAMMAR: Record<Level, string[]> = {
  A1: [
    "to be: am / is / are",
    "Present simple: I work, she works",
    "Questions and negatives with do / does",
    "Articles: a / an / the",
    "Plural nouns",
    "this / that / these / those",
    "Possessive adjectives and 's",
    "There is / there are",
    "can / can't for ability",
    "Prepositions of place: in, on, under, next to",
  ],
  A2: [
    "Past simple: regular and irregular verbs",
    "Present continuous vs present simple",
    "Countable and uncountable nouns: some / any / much / many",
    "Comparatives and superlatives",
    "going to for plans",
    "will for predictions and offers",
    "Adverbs of frequency",
    "Object pronouns",
    "Prepositions of time: at, on, in",
    "have to / don't have to",
  ],
  B1: [
    "Present perfect: experience, ever / never",
    "Present perfect vs past simple",
    "Past continuous and past simple",
    "First conditional",
    "Second conditional",
    "Modal verbs: should, must, might",
    "Passive voice: present and past",
    "Relative clauses: who, which, that",
    "Gerund or infinitive",
    "used to",
  ],
  B2: [
    "Present perfect continuous",
    "Past perfect",
    "Third conditional",
    "Reported speech",
    "Passive voice: all tenses",
    "Modals of deduction: must have, can't have",
    "Future continuous and future perfect",
    "Defining and non-defining relative clauses",
    "wish / if only",
    "Linking words: although, despite, however",
  ],
  C1: [
    "Mixed conditionals",
    "Inversion for emphasis",
    "Cleft sentences",
    "Advanced passive structures",
    "Participle clauses",
    "Ellipsis and substitution",
    "Hedging and softening language",
    "Advanced modal meanings",
  ],
  C2: [
    "Subjunctive forms",
    "Nominalisation in formal writing",
    "Fronting and information focus",
    "Subtle differences in tense and aspect",
    "Discourse markers in academic English",
    "Idiomatic and fixed expressions",
  ],
  TOEFL: [
    "Complex sentence structures in academic texts",
    "Passive voice in academic writing",
    "Relative clauses and reduced relative clauses",
    "Conditionals in academic argument",
    "Transitions and cohesion devices",
    "Subject-verb agreement in long sentences",
  ],
};

export const VOCAB_THEMES: Record<Level, string[]> = {
  A1: ["Family", "Numbers and time", "Food and drinks", "The house", "Clothes", "Colors and shapes", "Daily routine", "Body", "Classroom", "Weather"],
  A2: ["Shopping", "Health and the doctor", "Transportation", "Jobs", "Hobbies and sports", "City places", "Feelings", "Travel and holidays", "Kitchen and cooking", "Animals"],
  B1: ["Work and the office", "Education", "Technology", "Environment", "Media and news", "Relationships", "Money and banking", "Personality", "Housing problems", "Free time and culture"],
  B2: ["Business and economy", "Science and research", "Crime and law", "Health and lifestyle", "Global issues", "Arts and entertainment", "Phrasal verbs for work", "Collocations with make / do / take"],
  C1: ["Academic vocabulary", "Politics and society", "Idioms for discussion", "Psychology", "Advanced collocations", "Formal and informal register"],
  C2: ["Nuanced adjectives", "Advanced idioms", "Literary vocabulary", "Specialised academic terms"],
  TOEFL: ["Biology", "Geology and earth science", "Astronomy", "History and archaeology", "Psychology", "Economics", "Art history", "Campus life"],
};

export const TOPICS: Record<Level, string[]> = {
  A1: ["My family", "A day in my life", "My home", "At the café", "My best friend", "The weekend"],
  A2: ["A trip to the city", "Healthy habits", "A new job", "Shopping online", "A famous person", "Festivals"],
  B1: ["Working from home", "Learning languages", "Social media", "Climate change", "Travel experiences", "City vs countryside"],
  B2: ["The future of work", "Artificial intelligence", "Fast fashion", "Sleep and health", "Tourism and its effects", "Remote education"],
  C1: ["The ethics of technology", "Urban design", "Behavioural economics", "Memory and the brain", "Globalisation"],
  C2: ["Philosophy of science", "Language and identity", "Economic inequality", "The attention economy"],
  TOEFL: ["Plate tectonics", "Animal migration", "The Industrial Revolution", "Photosynthesis", "Ancient civilisations", "Urbanisation", "Campus conversation: course registration"],
};

export function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

# altyn.english

A learning platform for an English teacher and their students. The teacher creates student accounts, assigns each student a level (A1–C2 or TOEFL) and tracks their progress. Students practise with reading, listening, writing, speaking, vocabulary and grammar content generated for their level.

Interface languages: Turkish, Turkmen, Russian.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL (Supabase) + Prisma 7 · jose (sessions) · Claude API · Recharts

## Setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, DIRECT_URL (Supabase → Connect), SESSION_SECRET, ANTHROPIC_API_KEY, TEACHER_*
npm run db:migrate          # creates the tables (uses DIRECT_URL)
npm run db:seed             # creates the teacher account from .env
npm run dev                 # http://localhost:3000
```

Generate a `SESSION_SECRET` with: `openssl rand -base64 32`

## Deployment

The build is committed to the repo in `deploy/` (a self-contained Node server, `output: "standalone"`). The server never builds — it only pulls. It needs Node.js 20.9+ on Linux x64, no `npm install`.

Locally, after changes:

```bash
npm run release             # builds into deploy/ (no secrets inside)
git add -A && git commit -m "..." && git push
```

On the server, first time:

```bash
git clone git@github.com:yagshy-ash/altyn.english.git && cd altyn.english
cp .env.example deploy/.env # fill in the real values (ignored by git)
cd deploy && PORT=3000 pm2 start server.js --name altyn-english --watch --ignore-watch="node_modules .env"
```

Updating: `git pull` — pm2 (`--watch`) restarts the server automatically.

Put a reverse proxy with HTTPS (nginx/Caddy) in front of it — session cookies are `secure` in production.

## Features

**Teacher**
- Create student accounts (students cannot sign up themselves), set levels, reset passwords, deactivate accounts
- Analytics per student: time on platform, online sessions, activity, scores, mistake map, level history
- Calendar of lessons, posts for all students / a level / one student
- Content library: browse, publish, generate with AI, assign to students

**Student**
- Daily set, streak and weekly goal
- Reading and listening with quizzes, vocabulary sets with spaced-repetition review
- Grammar explanations with exercises
- Writing and 60-second speaking tasks with AI feedback
- Roleplay chat and "I didn't understand this" explanations

AI features (writing/speaking feedback, chat, explanations, content generation) need `ANTHROPIC_API_KEY` with available credit.

## Project structure

| Path | Purpose |
|---|---|
| `prisma/schema.prisma` | Database schema |
| `prisma/data/` | Source materials and generated content (JSON) |
| `scripts/` | Content import, generation (Batch API) and manual import scripts |
| `src/proxy.ts` | Fast role-based redirects |
| `src/lib/dal.ts` | Authorization (`requireTeacher`, `requireStudent`) |
| `src/lib/content.ts` | Which content a student sees: content tagged with their level |
| `src/lib/ai.ts` | Claude API calls: content generation, feedback, chat |
| `src/i18n/` | Dictionaries (`tr.ts` is the source; `tk.ts`, `ru.ts` share its shape) |
| `src/app/teacher/` | Teacher panel |
| `src/app/student/` | Student panel |
| `src/app/actions/` | Server actions |

## Content scripts

```bash
npm run content:manual -- pending 50   # list topics that have no content yet
npm run content:manual -- import       # validate and import prisma/data/manual/*.json
npm run content:batch -- submit 100    # generate content with the Batch API
npm run content:batch -- collect <id>  # save batch results
```

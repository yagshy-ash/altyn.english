# altyn.english

İngilizce öğretmeni ve öğrencileri için çalışma platformu. Öğretmen öğrenci ekler, seviyesini (A1–C2 veya TOEFL) belirler ve ilerlemesini takip eder. Öğrenci, seviyesine göre üretilmiş okuma, dinleme, yazma, konuşma, kelime ve gramer içerikleriyle çalışır.

Arayüz dilleri: Türkçe, Türkmence, Rusça.

## Teknoloji

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma 7 · jose (oturum) · Claude API · Recharts

## Kurulum

```bash
npm install
cp .env.example .env        # DATABASE_URL, DIRECT_URL (Supabase → Connect), SESSION_SECRET, ANTHROPIC_API_KEY, TEACHER_* doldur
npm run db:migrate          # tabloları oluşturur (DIRECT_URL üzerinden)
npm run db:seed             # .env'deki bilgilerle öğretmen hesabını oluşturur
npm run dev                 # http://localhost:3000
```

`SESSION_SECRET` üretmek için: `openssl rand -base64 32`

## Yapı

| Yol | Ne |
|---|---|
| `prisma/schema.prisma` | Veritabanı şeması |
| `src/proxy.ts` | Rol bazlı hızlı yönlendirme |
| `src/lib/dal.ts` | Yetki kontrolü (`requireTeacher`, `requireStudent`) |
| `src/lib/content.ts` | Öğrencinin hangi içeriği göreceği: seviyesine etiketli içerik |
| `src/i18n/` | Sözlükler (`tr.ts` ana sözlük; `tk.ts`, `ru.ts` aynı yapıda) |
| `src/app/teacher/` | Öğretmen paneli |
| `src/app/student/` | Öğrenci paneli |
| `src/app/actions/` | Server action'lar |

## Yol haritası

1. ✅ Kurulum, giriş, roller, 3 dil, öğrenci ekleme ve seviye atama
2. Kelime (aralıklı tekrar) ve okuma
3. Yapay zekalı yazma değerlendirmesi
4. Dinleme (tarayıcı sesi) ve konuşma
5. Ödev sistemi
6. Öğretmen analizleri: grafikler, hata haritası, süre
7. İçerik hattı: Oxford materyallerinden müfredat ve yapay zekayla içerik üretimi

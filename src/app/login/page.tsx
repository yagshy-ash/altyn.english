import { getT } from "@/i18n/server";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SkillIcon } from "@/components/skill-icon";
import { SKILLS } from "@/lib/skills";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { closed } = await searchParams;
  const { locale, t } = await getT();
  return (
    <main className="grid flex-1 lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-green p-12 text-white lg:flex">
        <span className="text-2xl font-black">altyn.english</span>
        <div className="flex flex-col gap-8">
          <div className="grid w-fit grid-cols-3 gap-4">
            {SKILLS.map((s, i) => (
              <div key={s} className="animate-pop rounded-3xl bg-white/15 p-3" style={{ animationDelay: `${i * 70}ms` }}>
                <SkillIcon skill={s} size="lg" />
              </div>
            ))}
          </div>
          <p className="max-w-md text-4xl leading-tight font-black">{t.login.tagline}</p>
        </div>
        <div className="flex gap-2 text-3xl" aria-hidden>🔥 ⭐ 🏆 🎯</div>
      </section>

      <section className="flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between gap-3">
            <Logo />
            <LanguageSwitcher current={locale} label={t.common.language} />
          </div>
          <h1 className="h1">{t.login.title}</h1>
          <p className="mt-2 mb-6 font-semibold text-muted">{t.login.subtitle}</p>
          <LoginForm t={t.login} closed={closed === "1"} />
        </div>
      </section>
    </main>
  );
}

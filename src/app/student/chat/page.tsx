import { requireStudent } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { SCENARIOS } from "@/lib/scenarios";
import { ChatRoom } from "@/components/learn/chat-room";

export default async function ChatPage() {
  const student = await requireStudent();
  const { locale, t } = await getT();
  // TOEFL kampüs senaryosu sadece TOEFL öğrencilerine
  const scenarios = SCENARIOS.filter((s) => s.id !== "campus" || student.level === "TOEFL" || student.level === "C1");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="h1">💬 {t.chat.title}</h1>
      <ChatRoom scenarios={scenarios} locale={locale} t={t} />
    </div>
  );
}

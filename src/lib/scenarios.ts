import type { L3 } from "./content-schemas";

// Sohbet senaryoları: öğrencinin dilinde başlık/hedef, yapay zekaya İngilizce talimat
export type Scenario = { id: string; emoji: string; title: L3; goal: L3; prompt: string };

export const SCENARIOS: Scenario[] = [
  {
    id: "cafe",
    emoji: "☕",
    title: { tr: "Kafede sipariş", tk: "Kafede sargyt", ru: "Заказ в кафе" },
    goal: { tr: "İçecek ve yiyecek sipariş et, fiyatı sor, öde.", tk: "Içgi we nahar sargyt et, bahasyny sora, tölegi et.", ru: "Закажи напиток и еду, спроси цену, оплати." },
    prompt: "You are a friendly barista at a busy café. The student is a customer ordering.",
  },
  {
    id: "friend",
    emoji: "👋",
    title: { tr: "Yeni arkadaş", tk: "Täze dost", ru: "Новый друг" },
    goal: { tr: "Kendini tanıt, hobilerini anlat, karşı tarafa soru sor.", tk: "Özüňi tanyşdyr, gyzyklanmalaryňy aýt, sorag ber.", ru: "Представься, расскажи о хобби, задай вопросы." },
    prompt: "You are a friendly student from another country meeting the learner for the first time at a language club.",
  },
  {
    id: "doctor",
    emoji: "🩺",
    title: { tr: "Doktorda", tk: "Lukmanda", ru: "У врача" },
    goal: { tr: "Şikayetini anlat, ne zamandır sürdüğünü söyle, tavsiye iste.", tk: "Näme agyrýandygyny, haçandan bäri dowam edýändigini aýt, maslahat sora.", ru: "Опиши симптомы, скажи, как давно, попроси совет." },
    prompt: "You are a calm, kind doctor at a clinic. The student is a patient describing a problem.",
  },
  {
    id: "hotel",
    emoji: "🏨",
    title: { tr: "Otelde", tk: "Myhmanhanada", ru: "В отеле" },
    goal: { tr: "Giriş yap, odadaki bir sorunu bildir, kahvaltı saatini sor.", tk: "Bellige dur, otagdaky meseläni aýt, ertirlik wagtyny sora.", ru: "Заселись, сообщи о проблеме в номере, спроси о завтраке." },
    prompt: "You are a hotel receptionist. The student is a guest checking in.",
  },
  {
    id: "shop",
    emoji: "🛍️",
    title: { tr: "Mağazada", tk: "Dükanda", ru: "В магазине" },
    goal: { tr: "Beden ve renk sor, dene, indirim iste.", tk: "Ölçeg we reňk sora, geýip gör, arzanladyş sora.", ru: "Спроси размер и цвет, примерь, попроси скидку." },
    prompt: "You are a shop assistant in a clothes store. The student is a customer.",
  },
  {
    id: "directions",
    emoji: "🗺️",
    title: { tr: "Yol tarifi", tk: "Ýol sorap bilmek", ru: "Как пройти" },
    goal: { tr: "Bir yere nasıl gidileceğini sor ve tarifi tekrar ederek doğrula.", tk: "Bir ýere nädip gitmelidigini sora we gaýtalap barla.", ru: "Спроси дорогу и повтори маршрут, чтобы проверить." },
    prompt: "You are a local person on the street in London. The student is a tourist asking for directions.",
  },
  {
    id: "interview",
    emoji: "💼",
    title: { tr: "İş görüşmesi", tk: "Işe ýerleşmek söhbeti", ru: "Собеседование" },
    goal: { tr: "Kendini, deneyimini ve güçlü yanlarını anlat.", tk: "Özüňi, tejribäňi we güýçli taraplaryňy aýt.", ru: "Расскажи о себе, опыте и сильных сторонах." },
    prompt: "You are an HR manager interviewing the student for a job. Ask one interview question at a time.",
  },
  {
    id: "campus",
    emoji: "🎓",
    title: { tr: "Kampüs ofisi (TOEFL)", tk: "Uniwersitet edarasy (TOEFL)", ru: "Офис университета (TOEFL)" },
    goal: { tr: "Ders kaydı sorununu anlat ve çözüm iste.", tk: "Sapaga ýazylmak meselesini düşündir we çözgüt sora.", ru: "Объясни проблему с записью на курс и попроси решение." },
    prompt: "You are a university registrar office employee. The student has a problem registering for a course, like a TOEFL campus conversation.",
  },
];

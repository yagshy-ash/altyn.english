import type { Metadata } from "next";
import { Nunito, Lora } from "next/font/google";
import { getLocale } from "@/i18n/server";
import "./globals.css";

// Türkmence (ň, ý, ž…) ve Rusça için latin-ext + cyrillic şart
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin", "latin-ext", "cyrillic"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin", "latin-ext", "cyrillic"] });

export const metadata: Metadata = {
  title: "altyn.english",
  description: "İngilizce öğretmeni ve öğrencileri için çalışma platformu",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${nunito.variable} ${lora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}

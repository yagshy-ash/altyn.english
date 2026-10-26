import "server-only";
import { cookies } from "next/headers";
import { getDict, isLocale, LOCALE_COOKIE, type AppLocale } from "./index";

export async function getLocale(): Promise<AppLocale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "tr";
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}

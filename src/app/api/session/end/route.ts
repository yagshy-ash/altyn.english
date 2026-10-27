import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

// Hesabı kapatılmış ya da silinmiş kullanıcının çerezi sayfa render'ında silinemez;
// dal.ts buraya yönlendirir, çerez silinir ve giriş sayfasında bilgi gösterilir.
export async function GET(req: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login?closed=1", req.url));
}

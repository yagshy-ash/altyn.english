import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/session";

// Hızlı ve iyimser yönlendirme. Asıl yetki kontrolü src/lib/dal.ts içinde.
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);

  const area = path.startsWith("/teacher") ? "TEACHER" : path.startsWith("/student") ? "STUDENT" : null;

  if (area && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (area && session && session.role !== area) {
    return NextResponse.redirect(new URL(session.role === "TEACHER" ? "/teacher" : "/student", req.nextUrl));
  }
  if ((path === "/login" || path === "/") && session) {
    return NextResponse.redirect(new URL(session.role === "TEACHER" ? "/teacher" : "/student", req.nextUrl));
  }
  if (path === "/" && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
};

import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/dal";

export default async function Root() {
  const user = await getCurrentUser();
  redirect(user ? homeFor(user.role) : "/login");
}

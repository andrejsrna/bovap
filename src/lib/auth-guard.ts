import "server-only";
import { getSessionUser } from "@/lib/session";

/** Overí prihláseného admina priamo na hranici server action / route. */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

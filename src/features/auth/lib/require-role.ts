import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/lib/options";
import { jsonError } from "@/shared/http/json-error";

type Role = "admin" | "superadmin" | "driver" | "partner";

type AuthedUser = {
  id: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function requireRole(...roles: Role[]) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) {
    return { ok: false as const, response: jsonError("unauthorized", 401) };
  }
  if (!roles.includes(user.role as Role)) {
    return { ok: false as const, response: jsonError("forbidden", 403) };
  }
  return { ok: true as const, session: { user: user as AuthedUser } };
}

export function requireAdmin() {
  return requireRole("admin", "superadmin");
}

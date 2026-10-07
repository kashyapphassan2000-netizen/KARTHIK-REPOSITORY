import { cookies } from "next/headers";
import { passwordMatches, SESSION_COOKIE, sessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "ADMIN_PASSWORD is not set on the server." }, { status: 503 });
  }
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !passwordMatches(password)) {
    // Small delay to slow down guessing.
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }
  (await cookies()).set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return Response.json({ ok: true });
}

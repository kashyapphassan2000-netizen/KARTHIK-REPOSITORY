import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "admin_session";

function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("portfolio-admin-v1").digest("hex");
}

export function passwordMatches(candidate: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sessionToken(): string {
  const token = expectedToken();
  if (!token) throw new Error("ADMIN_PASSWORD is not set");
  return token;
}

export async function isAuthed(): Promise<boolean> {
  const token = expectedToken();
  if (!token) return false;
  const value = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  const a = Buffer.from(value);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unauthorized() {
  return Response.json({ error: "Not logged in" }, { status: 401 });
}

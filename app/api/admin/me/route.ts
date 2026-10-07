import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Lets the public pages show the owner-only "+" button. Reveals nothing else. */
export async function GET() {
  return Response.json({ owner: await isAuthed() }, { headers: { "Cache-Control": "no-store" } });
}

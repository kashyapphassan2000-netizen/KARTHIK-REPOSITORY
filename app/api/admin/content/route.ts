import { isAuthed, unauthorized } from "@/lib/auth";
import { llmProvider } from "@/lib/llm";
import { loadContent, storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) return unauthorized();
  try {
    const content = await loadContent();
    return Response.json({ ...content, storage: storageMode(), ai: llmProvider() });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

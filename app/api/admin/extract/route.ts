import { isAuthed, unauthorized } from "@/lib/auth";
import { documentText, MAX_UPLOAD_BYTES } from "@/lib/extract";
import { draftProject, llmProvider, type ProjectDraft } from "@/lib/llm";
import { detectSkills } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ~400k characters ≈ 100k tokens; above this, split the upload.
const MAX_TEXT_CHARS = 400_000;

/** Reads uploaded documents, detects skills, and (if an AI key is set) drafts the project fields. */
export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const notes = String(form.get("notes") || "");
  const useAi = form.get("ai") !== "false";
  if (!files.length) return Response.json({ error: "Attach at least one document." }, { status: 400 });

  const documents: { name: string; text: string }[] = [];
  const errors: string[] = [];
  for (const f of files) {
    if (f.size > MAX_UPLOAD_BYTES) {
      errors.push(`${f.name}: over 4 MB — compress images in the document or export it as PDF.`);
      continue;
    }
    try {
      documents.push({ name: f.name, text: await documentText(f.name, Buffer.from(await f.arrayBuffer())) });
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  if (!documents.length) return Response.json({ error: errors.join("\n") || "No readable documents." }, { status: 400 });

  const allText = documents.map((d) => d.text).join("\n");
  const keywordSkills = detectSkills(allText);
  const totalChars = allText.length;

  let draft: ProjectDraft | null = null;
  let aiError: string | null = null;
  const provider = llmProvider();
  if (useAi && provider) {
    if (totalChars > MAX_TEXT_CHARS) {
      aiError = `Documents total ${totalChars.toLocaleString()} characters — too long for one AI draft. Upload fewer at a time.`;
    } else {
      try {
        draft = await draftProject(documents, notes);
      } catch (e) {
        aiError = (e as Error).message;
      }
    }
  }

  return Response.json({
    documents: documents.map((d) => ({ name: d.name, chars: d.text.length })),
    // Fallback title when there is no AI draft: first non-empty line of the first document.
    firstLine: documents[0]!.text.split("\n").map((l) => l.trim()).find(Boolean)?.slice(0, 140) ?? "",
    errors,
    keywordSkills,
    draft,
    provider,
    aiError,
  });
}

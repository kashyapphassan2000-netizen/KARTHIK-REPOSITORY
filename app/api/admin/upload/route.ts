import { isAuthed, unauthorized } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, safeFileName, slugify } from "@/lib/extract";
import { writeFiles } from "@/lib/store";

export const dynamic = "force-dynamic";

const ALLOWED = /\.(png|jpe?g|webp|gif|pdf|docx|pptx|xlsx|txt|md)$/i;

/** Stores one file under public/uploads/<folder>/ and returns its public URL. */
export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const form = await req.formData();
  const file = form.get("file");
  const folder = slugify(String(form.get("folder") || "misc")) || "misc";
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: `${file.name} is over 4 MB.` }, { status: 413 });
  if (!ALLOWED.test(file.name)) return Response.json({ error: `${file.name}: file type not allowed.` }, { status: 400 });

  const name = `${Date.now().toString(36)}-${safeFileName(file.name)}`;
  const repoPath = `public/uploads/${folder}/${name}`;
  try {
    const result = await writeFiles(
      [{ path: repoPath, content: Buffer.from(await file.arrayBuffer()) }],
      `Upload ${folder}/${file.name}`,
    );
    return Response.json({ ok: true, url: `/uploads/${folder}/${name}`, name: file.name, ...result });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel functions accept ~4.5 MB request bodies.

/** Plain text from a .docx, .pdf, .txt or .md file. */
export async function documentText(name: string, data: Buffer): Promise<string> {
  const ext = name.toLowerCase().split(".").pop();
  switch (ext) {
    case "docx":
      return (await mammoth.extractRawText({ buffer: data })).value;
    case "pdf": {
      const pdf = await getDocumentProxy(new Uint8Array(data));
      const { text } = await extractText(pdf, { mergePages: true });
      return text;
    }
    case "txt":
    case "md":
      return data.toString("utf8");
    case "doc":
      throw new Error(`${name}: old .doc format is not supported — open it in Word and "Save as" .docx.`);
    default:
      throw new Error(`${name}: unsupported file type (use .docx, .pdf, .txt or .md).`);
  }
}

export function safeFileName(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_");
  return cleaned.slice(-120) || "file";
}

export { slugify } from "./slug";

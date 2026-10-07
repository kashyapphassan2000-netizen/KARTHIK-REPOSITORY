/**
 * Optional: drafts project fields from uploaded documents with an LLM.
 *   GEMINI_API_KEY    → Google Gemini (has a free tier; default model gemini-3.8-flash)
 *   ANTHROPIC_API_KEY → Claude (paid; used when no Gemini key is set)
 * Keyword skill detection works without either.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ALL_SKILL_NAMES } from "./taxonomy";

export type ProjectDraft = {
  title: string;
  tagline: string;
  context: string;
  role: string;
  status: string;
  problem: string;
  solution: string;
  highlights: string[];
  impact: string[];
  skills: string[];
};

const DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "tagline", "context", "role", "status", "problem", "solution", "highlights", "impact", "skills"],
  properties: {
    title: { type: "string", description: "Project name, optionally 'Client — System name'." },
    tagline: { type: "string", description: "One sentence: what the system does and for whom." },
    context: { type: "string", description: "Where this work happened (company, program, freelance, personal)." },
    role: { type: "string", description: "The portfolio owner's role, e.g. 'Forward Deployed Engineer — solution design'." },
    status: { type: "string", description: "Stage of the work evidenced by the documents (e.g. 'Design complete', 'In production', 'Requirements analysis')." },
    problem: { type: "string", description: "The customer's problem in 2-4 sentences, with the numbers the documents give." },
    solution: { type: "string", description: "What was designed or built and how, in 3-6 sentences." },
    highlights: { type: "array", items: { type: "string" }, description: "5-9 concrete things done, one sentence each, starting with a verb." },
    impact: { type: "array", items: { type: "string" }, description: "2-5 outcomes, targets or estimates with numbers, labelled as targets/estimates when not measured results." },
    skills: { type: "array", items: { type: "string" }, description: "Skills evidenced by the documents." },
  },
};

const SYSTEM = `You write portfolio entries for a Forward Deployed Engineer (AI/ML) from their project documents.

Rules:
- Use only facts present in the documents. Never invent metrics, clients, results or technologies.
- Be precise about what kind of evidence the documents are. A requirement document describes what a client asked for, not what was built; a design document describes a design, not a production system. Reflect this in "status" and phrase highlights and impact accordingly (e.g. "Designed…", "Target: …", "Estimated …").
- Write for a hiring manager hiring FDEs: lead with the customer problem, the constraints, and the engineering decisions.
- For "skills", prefer these canonical names when they apply, and add others only if clearly evidenced: ${ALL_SKILL_NAMES.join("; ")}.`;

export type Provider = "gemini" | "anthropic";

export function llmProvider(): Provider | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

function userPrompt(documents: { name: string; text: string }[], notes: string): string {
  const docs = documents.map((d) => `<document name="${d.name}">\n${d.text}\n</document>`).join("\n\n");
  return `${docs}\n\nNotes from the portfolio owner about their role (may be empty):\n${notes || "(none)"}\n\nDraft the portfolio entry.`;
}

export async function draftProject(documents: { name: string; text: string }[], notes: string): Promise<ProjectDraft> {
  const provider = llmProvider();
  if (provider === "gemini") return draftWithGemini(userPrompt(documents, notes));
  if (provider === "anthropic") return draftWithClaude(userPrompt(documents, notes));
  throw new Error("No AI key configured (set GEMINI_API_KEY for the free tier).");
}

async function draftWithGemini(prompt: string): Promise<ProjectDraft> {
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const call = async (withSchema: boolean) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: withSchema ? prompt : `${prompt}\n\nReturn only JSON matching this schema:\n${JSON.stringify(DRAFT_SCHEMA)}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          ...(withSchema ? { responseJsonSchema: DRAFT_SCHEMA } : {}),
        },
      }),
    });
  let res = await call(true);
  // Older model versions reject responseJsonSchema; fall back to plain JSON mode.
  if (res.status === 400) res = await call(false);
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Gemini free-tier rate limit reached — wait a minute and try again.");
    throw new Error(`Gemini request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") throw new Error("The draft was cut off; try fewer documents at once.");
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error(`Gemini returned no draft (finish reason: ${candidate?.finishReason ?? "unknown"}).`);
  return JSON.parse(text) as ProjectDraft;
}

async function draftWithClaude(prompt: string): Promise<ProjectDraft> {
  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: DRAFT_SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("The model declined to draft this project.");
  if (response.stop_reason === "max_tokens") throw new Error("The draft was cut off; try fewer documents at once.");
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return JSON.parse(text) as ProjectDraft;
}

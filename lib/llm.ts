/**
 * Optional: drafts project fields from uploaded documents with an LLM.
 *   GEMINI_API_KEY    → Google Gemini (has a free tier; tries several Flash models in turn)
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

// Free-tier Gemini models are often overloaded (503) or slow, so try several in turn.
const GEMINI_FALLBACKS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"];
const GEMINI_ATTEMPT_MS = 30_000;
const GEMINI_TOTAL_MS = 100_000;

async function draftWithGemini(prompt: string): Promise<ProjectDraft> {
  const models = [...new Set([process.env.GEMINI_MODEL, ...GEMINI_FALLBACKS].filter((m): m is string => Boolean(m)))];
  const deadline = Date.now() + GEMINI_TOTAL_MS;
  const failures: string[] = [];

  const call = (model: string, strict: boolean) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      signal: AbortSignal.timeout(Math.max(1_000, Math.min(GEMINI_ATTEMPT_MS, deadline - Date.now()))),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: strict ? prompt : `${prompt}\n\nReturn only JSON matching this schema:\n${JSON.stringify(DRAFT_SCHEMA)}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          ...(strict ? { responseJsonSchema: DRAFT_SCHEMA, thinkingConfig: { thinkingLevel: "low" } } : {}),
        },
      }),
    });

  for (const model of models) {
    if (Date.now() > deadline - 2_000) break;
    try {
      let res = await call(model, true);
      // A model that rejects responseJsonSchema / thinkingConfig still supports plain JSON mode.
      if (res.status === 400) res = await call(model, false);
      if (res.status === 401 || res.status === 403) {
        throw Object.assign(new Error("Gemini rejected the API key — check GEMINI_API_KEY in Vercel."), { fatal: true });
      }
      if (!res.ok) {
        failures.push(`${model}: HTTP ${res.status}`);
        continue; // 404 retired model, 429 rate limit, 503 overloaded → next model
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
      };
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
      if (candidate?.finishReason === "MAX_TOKENS" || !text) {
        failures.push(`${model}: ${candidate?.finishReason ?? "empty response"}`);
        continue;
      }
      return JSON.parse(text) as ProjectDraft;
    } catch (e) {
      if ((e as { fatal?: boolean }).fatal) throw e;
      failures.push(`${model}: ${(e as Error).name === "TimeoutError" ? "timed out" : (e as Error).message}`);
    }
  }
  throw new Error(`Gemini free tier is busy right now (${failures.join("; ")}). Try again in a few minutes — your skill keywords were still detected.`);
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

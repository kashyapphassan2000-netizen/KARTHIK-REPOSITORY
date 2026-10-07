import { isAuthed, unauthorized } from "@/lib/auth";
import { slugify } from "@/lib/extract";
import { jsonFile, writeFiles } from "@/lib/store";
import type { Profile, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

function clean(p: Project): Project {
  const lines = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);
  return {
    ...p,
    slug: slugify(p.slug || p.title),
    title: p.title.trim(),
    highlights: lines(p.highlights),
    impact: lines(p.impact),
    skills: [...new Set(lines(p.skills))],
    links: p.links.filter((l) => l.url.trim()),
  };
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const body = (await req.json()) as { profile: Profile; projects: Project[]; message?: string };
  if (!body.profile || !Array.isArray(body.projects)) {
    return Response.json({ error: "profile and projects are required" }, { status: 400 });
  }
  const projects = body.projects.map(clean);
  const missing = projects.find((p) => !p.title || !p.slug);
  if (missing) return Response.json({ error: "Every project needs a title." }, { status: 400 });
  const slugs = projects.map((p) => p.slug);
  const dup = slugs.find((s, i) => slugs.indexOf(s) !== i);
  if (dup) return Response.json({ error: `Two projects share the URL "${dup}". Rename one.` }, { status: 400 });

  try {
    const result = await writeFiles(
      [jsonFile("content/profile.json", body.profile), jsonFile("content/projects.json", projects)],
      body.message || "Update portfolio content",
    );
    return Response.json({ ok: true, ...result, projects });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

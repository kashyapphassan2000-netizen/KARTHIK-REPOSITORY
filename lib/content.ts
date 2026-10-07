import { readFileSync } from "node:fs";
import path from "node:path";
import type { Profile, Project, SiteContent } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

/** Reads the content committed with this deployment (used by the public pages at build time). */
export function getContent(): SiteContent {
  const profile = JSON.parse(readFileSync(path.join(CONTENT_DIR, "profile.json"), "utf8")) as Profile;
  const projects = JSON.parse(readFileSync(path.join(CONTENT_DIR, "projects.json"), "utf8")) as Project[];
  return { profile, projects: sortProjects(projects) };
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt),
  );
}

/** Every skill on the site with the projects that evidence it. */
export function skillIndex({ profile, projects }: SiteContent): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const p of projects) {
    for (const s of p.skills) index.set(s, [...(index.get(s) ?? []), p.slug]);
  }
  for (const s of profile.skills) if (!index.has(s)) index.set(s, []);
  return index;
}

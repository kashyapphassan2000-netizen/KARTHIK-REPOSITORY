/**
 * Where admin edits are written.
 *  - With GITHUB_TOKEN: files are committed to the repo; Vercel sees the push and redeploys.
 *  - Without it (local `npm run dev`): files are written straight to disk.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sortProjects } from "./content";
import type { Profile, Project, SiteContent } from "./types";

export type FileWrite = { path: string; content: Buffer };

export type WriteResult = { mode: "github" | "local"; commitUrl?: string };

function githubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo =
    process.env.GITHUB_REPO ||
    (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : "");
  const branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
  return token && repo ? { token, repo, branch } : null;
}

export function storageMode(): "github" | "local" | "unconfigured" {
  if (githubConfig()) return "github";
  return process.env.VERCEL ? "unconfigured" : "local";
}

async function gh<T>(method: string, url: string, body?: unknown, accept = "application/vnd.github+json"): Promise<T> {
  const cfg = githubConfig()!;
  const res = await fetch(`https://api.github.com/repos/${cfg.repo}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${method} ${url} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return (accept.includes("raw") ? await res.text() : await res.json()) as T;
}

async function readRepoFile(file: string): Promise<string> {
  const cfg = githubConfig();
  if (cfg) {
    return gh<string>("GET", `/contents/${file}?ref=${encodeURIComponent(cfg.branch)}`, undefined, "application/vnd.github.raw+json");
  }
  return readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), file), "utf8");
}

/** Latest content — from GitHub when configured, so the admin never edits a stale copy. */
export async function loadContent(): Promise<SiteContent> {
  const [profile, projects] = await Promise.all([
    readRepoFile("content/profile.json"),
    readRepoFile("content/projects.json"),
  ]);
  return { profile: JSON.parse(profile) as Profile, projects: sortProjects(JSON.parse(projects) as Project[]) };
}

/** Writes all files in one commit (GitHub) or straight to disk (local dev). */
export async function writeFiles(files: FileWrite[], message: string): Promise<WriteResult> {
  const cfg = githubConfig();
  if (!cfg) {
    if (process.env.VERCEL) {
      throw new Error("GITHUB_TOKEN is not set in Vercel. Add it under Project → Settings → Environment Variables, then redeploy.");
    }
    for (const f of files) {
      const abs = path.join(/*turbopackIgnore: true*/ process.cwd(), f.path);
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, f.content);
    }
    return { mode: "local" };
  }

  const ref = await gh<{ object: { sha: string } }>("GET", `/git/ref/heads/${cfg.branch}`);
  const parent = await gh<{ tree: { sha: string } }>("GET", `/git/commits/${ref.object.sha}`);
  const tree = await Promise.all(
    files.map(async (f) => {
      const blob = await gh<{ sha: string }>("POST", "/git/blobs", { content: f.content.toString("base64"), encoding: "base64" });
      return { path: f.path, mode: "100644", type: "blob", sha: blob.sha };
    }),
  );
  const newTree = await gh<{ sha: string }>("POST", "/git/trees", { base_tree: parent.tree.sha, tree });
  const commit = await gh<{ sha: string; html_url: string }>("POST", "/git/commits", {
    message,
    tree: newTree.sha,
    parents: [ref.object.sha],
  });
  await gh("PATCH", `/git/refs/heads/${cfg.branch}`, { sha: commit.sha });
  return { mode: "github", commitUrl: commit.html_url };
}

export function jsonFile(file: string, data: unknown): FileWrite {
  return { path: file, content: Buffer.from(JSON.stringify(data, null, 2) + "\n") };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { slugify } from "@/lib/slug";
import { ALL_SKILL_NAMES, categoryOf, groupSkills, TAXONOMY } from "@/lib/taxonomy";
import type { FocusArea, Link as LinkT, Profile, Project, SiteContent } from "@/lib/types";

type Storage = "github" | "local" | "unconfigured";
type Loaded = SiteContent & { storage: Storage; ai: "gemini" | "anthropic" | null };
type Tab = "projects" | "profile" | "skills" | "market";
type Flash = { kind: "ok" | "err" | "warn"; text: string; link?: string } | null;

const emptyProject = (): Project => ({
  slug: "",
  title: "",
  tagline: "",
  context: "",
  role: "Forward Deployed Engineer",
  period: "",
  status: "",
  featured: false,
  problem: "",
  solution: "",
  highlights: [],
  impact: [],
  skills: [],
  links: [],
  documents: [],
  createdAt: new Date().toISOString().slice(0, 10),
});

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function uploadFile(file: Blob, name: string, folder: string): Promise<{ url: string; name: string }> {
  const form = new FormData();
  form.append("file", file, name);
  form.append("folder", folder);
  return api("/api/admin/upload", { method: "POST", body: form });
}

const publishedNote = (storage: Storage) =>
  storage === "github"
    ? "Published. Vercel is rebuilding your site — it will be live in about a minute."
    : "Saved to disk (local mode). Commit and push to publish.";

/* ------------------------------------------------------------------ */

export default function AdminApp() {
  const [state, setState] = useState<"checking" | "login" | "ready">("checking");
  const [data, setData] = useState<Loaded | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>("projects");
  const [flash, setFlash] = useState<Flash>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ index: number; project: Project } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    if (res.status === 401) return setState("login");
    const body = await res.json();
    if (!res.ok) {
      setFlash({ kind: "err", text: body.error });
      return setState("login");
    }
    setData(body as Loaded);
    setState("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const publish = async (next: SiteContent, message: string) => {
    if (!data) return false;
    setSaving(true);
    setFlash(null);
    try {
      const res = await api<{ projects: Project[]; commitUrl?: string }>("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...next, message }),
      });
      setData({ ...data, ...next, projects: res.projects });
      setDirty(false);
      setFlash({ kind: "ok", text: publishedNote(data.storage), link: res.commitUrl });
      return true;
    } catch (e) {
      setFlash({ kind: "err", text: (e as Error).message });
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (state === "checking") return <Centered><span className="spinner" /> Loading…</Centered>;
  if (state === "login") return <Login flash={flash} onDone={load} />;
  if (!data) return null;

  const setProfile = (profile: Profile) => {
    setData({ ...data, profile });
    setDirty(true);
  };

  return (
    <div className="admin">
      <div className="bg-decor" aria-hidden>
        <div className="blob one" />
      </div>
      <div className="admin-top">
        <div className="container">
          <div className="brand">
            <span className="brand-mark">⚙</span> Portfolio admin
          </div>
          <div className="right">
            <a className="btn small" href="/" target="_blank" rel="noreferrer">View site ↗</a>
            <button
              className="btn small"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                setState("login");
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="status-row">
          {data.storage === "unconfigured" && (
            <div className="notice warn">
              GITHUB_TOKEN is not set in Vercel, so changes can’t be published. Add it under Vercel → Project → Settings →
              Environment Variables, then redeploy.
            </div>
          )}
          {!data.ai && (
            <div className="notice">
              AI auto-fill is off. Add a free <b>GEMINI_API_KEY</b> (aistudio.google.com/apikey) in Vercel to let uploaded
              documents fill in the project for you. Skill detection works without it.
            </div>
          )}
        </div>
        {flash && (
          <div className={`notice ${flash.kind}`} style={{ marginTop: 14 }}>
            {flash.text}{" "}
            {flash.link && (
              <a href={flash.link} target="_blank" rel="noreferrer">View commit</a>
            )}
          </div>
        )}

        {editing ? (
          <ProjectEditor
            initial={editing.project}
            isNew={editing.index < 0}
            aiProvider={data.ai}
            existingSlugs={data.projects.filter((_, i) => i !== editing.index).map((p) => p.slug)}
            saving={saving}
            onCancel={() => setEditing(null)}
            onFlash={setFlash}
            onSave={async (project) => {
              const projects = [...data.projects];
              if (editing.index < 0) projects.unshift(project);
              else projects[editing.index] = project;
              const ok = await publish(
                { profile: data.profile, projects },
                `${editing.index < 0 ? "Add" : "Update"} project: ${project.title}`,
              );
              if (ok) setEditing(null);
            }}
          />
        ) : (
          <>
            <div className="tabs" role="tablist">
              {(
                [
                  ["projects", `Projects (${data.projects.length})`],
                  ["profile", "Profile & photo"],
                  ["skills", "Skills"],
                  ["market", "Market gap"],
                ] as [Tab, string][]
              ).map(([id, label]) => (
                <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "projects" && (
              <ProjectsTab
                projects={data.projects}
                onAdd={() => setEditing({ index: -1, project: emptyProject() })}
                onEdit={(i) => setEditing({ index: i, project: structuredClone(data.projects[i]!) })}
                onDelete={async (i) => {
                  const p = data.projects[i]!;
                  if (!confirm(`Delete "${p.title}" from the portfolio?`)) return;
                  await publish(
                    { profile: data.profile, projects: data.projects.filter((_, j) => j !== i) },
                    `Remove project: ${p.title}`,
                  );
                }}
              />
            )}
            {tab === "profile" && <ProfileTab profile={data.profile} onChange={setProfile} onFlash={setFlash} />}
            {tab === "skills" && <SkillsTab content={data} onChange={setProfile} />}
            {tab === "market" && <MarketTab content={data} onChange={setProfile} />}
          </>
        )}
      </div>

      {dirty && !editing && (
        <div className="savebar">
          <span>
            <span className="dot" />
            Unsaved changes
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn small" disabled={saving} onClick={() => { setDirty(false); load(); }}>
              Discard
            </button>
            <button
              className="btn small primary"
              disabled={saving}
              onClick={() => publish({ profile: data.profile, projects: data.projects }, "Update profile")}
            >
              {saving ? <span className="spinner" /> : null} Publish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{children}</div>
    </div>
  );
}

function Login({ flash, onDone }: { flash: Flash; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(flash?.text ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <div className="container">
      <form
        className="login card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api("/api/admin/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            });
            onDone();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>Portfolio admin</h1>
        <p>Add projects, upload documents and update your profile. Changes go live automatically.</p>
        <label className="field">
          <span>Password</span>
          <input className="input" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="notice err" style={{ marginBottom: 14 }}>{error}</div>}
        <button className="btn primary" style={{ width: "100%" }} disabled={busy || !password}>
          {busy && <span className="spinner" />} Log in
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ProjectsTab({
  projects,
  onAdd,
  onEdit,
  onDelete,
}: {
  projects: Project[];
  onAdd: () => void;
  onEdit: (i: number) => void;
  onDelete: (i: number) => void;
}) {
  return (
    <div className="proj-list">
      <button className="add-card" onClick={onAdd}>
        <span className="plus">+</span>
        Add a new project
        <small style={{ fontWeight: 400, color: "var(--faint)" }}>Upload documents → auto-fill → publish</small>
      </button>
      {projects.map((p, i) => (
        <div key={p.slug} className="card proj-item">
          <div className="badges">
            {p.featured && <span className="badge">Featured</span>}
            {p.status && <span className="badge teal">{p.status.split("(")[0]!.trim()}</span>}
          </div>
          <h3>{p.title}</h3>
          <p>{p.tagline}</p>
          <small style={{ color: "var(--faint)" }}>{p.skills.length} skills · /projects/{p.slug}</small>
          <div className="actions">
            <button className="btn small" onClick={() => onEdit(i)}>Edit</button>
            <a className="btn small" href={`/projects/${p.slug}`} target="_blank" rel="noreferrer">View</a>
            <button className="btn small" style={{ marginLeft: "auto" }} onClick={() => onDelete(i)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type ExtractResult = {
  documents: { name: string; chars: number }[];
  firstLine: string;
  errors: string[];
  keywordSkills: string[];
  draft: Partial<Project> | null;
  provider: string | null;
  aiError: string | null;
};

function ProjectEditor({
  initial,
  isNew,
  aiProvider,
  existingSlugs,
  saving,
  onCancel,
  onSave,
  onFlash,
}: {
  initial: Project;
  isNew: boolean;
  aiProvider: Loaded["ai"];
  existingSlugs: string[];
  saving: boolean;
  onCancel: () => void;
  onSave: (p: Project) => void;
  onFlash: (f: Flash) => void;
}) {
  const [p, setP] = useState<Project>(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [attach, setAttach] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Project>(k: K, v: Project[K]) => setP((cur) => ({ ...cur, [k]: v }));
  const slug = p.slug || slugify(p.title);
  const slugTaken = existingSlugs.includes(slug);

  const analyze = async () => {
    setBusy(true);
    onFlash(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("notes", notes);
      const res = await api<ExtractResult>("/api/admin/extract", { method: "POST", body: form });
      const d = res.draft;
      const merged: Project = { ...p };
      if (d) {
        // Fill only empty fields so nothing you typed is overwritten.
        for (const k of ["title", "tagline", "context", "role", "status", "problem", "solution"] as const) {
          const v = d[k];
          if (typeof v === "string" && v && (!merged[k] || (k === "role" && merged.role === "Forward Deployed Engineer"))) merged[k] = v;
        }
        if (!merged.highlights.length && d.highlights) merged.highlights = d.highlights;
        if (!merged.impact.length && d.impact) merged.impact = d.impact;
        merged.skills = [...new Set([...merged.skills, ...(d.skills ?? [])])];
      }
      if (!merged.title && res.firstLine) merged.title = res.firstLine;
      // Keyword hits can be false positives (e.g. a tool listed as out of scope), so they are suggestions, not auto-added.
      setSuggested(res.keywordSkills.filter((s) => !merged.skills.includes(s)));

      if (attach) {
        const folder = slugify(merged.title || "project") || "project";
        for (const f of files) {
          const up = await uploadFile(f, f.name, folder);
          merged.documents = [...merged.documents, { name: up.name, url: up.url }];
        }
      }
      setP(merged);
      const msgs = [
        `Read ${res.documents.length} document(s) and found ${res.keywordSkills.length} skill keywords — pick the ones you used in section 5.`,
        d ? `AI draft filled the empty fields (${res.provider}). Review every line before publishing.` : "",
        res.aiError ? `AI draft failed: ${res.aiError}` : "",
        ...res.errors,
      ].filter(Boolean);
      onFlash({ kind: res.aiError || res.errors.length ? "warn" : "ok", text: msgs.join("\n") });
      setFiles([]);
    } catch (e) {
      onFlash({ kind: "err", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="editor" style={{ marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 28 }}>{isNew ? "Add a project" : `Edit: ${initial.title}`}</h1>
        <button className="btn small" onClick={onCancel}>← Back</button>
      </div>

      <div className="panel ai-panel">
        <h2>1 · Auto-fill from documents</h2>
        <p className="sub">
          Drop requirement docs, HLD/LLD, reports or notes (.docx, .pdf, .txt, .md — max 4 MB each). Skills are detected
          automatically{aiProvider ? `, and ${aiProvider === "gemini" ? "Gemini" : "Claude"} drafts the write-up` : ""}. Empty
          fields get filled; anything you typed stays.
        </p>
        <div
          className={`drop ${over ? "over" : ""}`}
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            setFiles((cur) => [...cur, ...Array.from(e.dataTransfer.files)]);
          }}
        >
          <b>Click to choose files</b> or drag them here
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".docx,.pdf,.txt,.md"
            hidden
            onChange={(e) => { setFiles((cur) => [...cur, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }}
          />
        </div>
        {files.length > 0 && (
          <div className="file-list">
            {files.map((f, i) => (
              <span key={i} className="skill-chip">
                {f.name} <small style={{ color: "var(--faint)" }}>{(f.size / 1024 / 1024).toFixed(1)} MB</small>
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove">×</button>
              </span>
            ))}
          </div>
        )}
        <label className="field" style={{ marginTop: 16 }}>
          <span>What was YOUR part? (helps the AI write it truthfully)</span>
          <textarea
            className="textarea"
            style={{ minHeight: 70 }}
            placeholder="e.g. I wrote the HLD and the cost model, built the RAG prototype in FastAPI, presented to the client…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn primary" disabled={!files.length || busy} onClick={analyze}>
            {busy ? <span className="spinner" /> : "✨"} {busy ? "Reading documents…" : "Analyze & auto-fill"}
          </button>
          <label className="toggle">
            <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
            Also publish these files for download on the project page
          </label>
        </div>
        {attach && (
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>
            ⚠ Published files are public. Don’t attach anything marked confidential by a client.
          </p>
        )}
      </div>

      <div className="panel">
        <h2>2 · The story</h2>
        <p className="sub">Write for a hiring manager: client problem → your decisions → numbers.</p>
        <label className="field">
          <span>Title *</span>
          <input className="input" value={p.title} onChange={(e) => set("title", e.target.value)} placeholder="Client — System name" />
          <small>
            URL: /projects/{slug || "…"} {slugTaken && <b style={{ color: "var(--danger)" }}>— already used, change the title or URL</b>}
          </small>
        </label>
        <label className="field">
          <span>One-line tagline</span>
          <input className="input" value={p.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </label>
        <div className="row2">
          <label className="field">
            <span>Your role</span>
            <input className="input" value={p.role} onChange={(e) => set("role", e.target.value)} />
          </label>
          <label className="field">
            <span>Context (company / program / client)</span>
            <input className="input" value={p.context} onChange={(e) => set("context", e.target.value)} />
          </label>
          <label className="field">
            <span>Period</span>
            <input className="input" value={p.period} onChange={(e) => set("period", e.target.value)} placeholder="Sep 2026 – Oct 2026" />
          </label>
          <label className="field">
            <span>Status</span>
            <input className="input" value={p.status} onChange={(e) => set("status", e.target.value)} placeholder="Design complete / In production / In progress" />
          </label>
        </div>
        <label className="field">
          <span>The problem</span>
          <textarea className="textarea" value={p.problem} onChange={(e) => set("problem", e.target.value)} />
        </label>
        <label className="field">
          <span>The solution</span>
          <textarea className="textarea" style={{ minHeight: 150 }} value={p.solution} onChange={(e) => set("solution", e.target.value)} />
        </label>
        <div className="row2">
          <label className="field">
            <span>Custom URL (optional)</span>
            <input className="input" value={p.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(p.title)} />
          </label>
          <label className="toggle" style={{ alignSelf: "center" }}>
            <input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} />
            Featured (shown first)
          </label>
        </div>
      </div>

      <div className="panel">
        <h2>3 · What I did</h2>
        <p className="sub">One concrete action per line, starting with a verb.</p>
        <ListEditor items={p.highlights} onChange={(v) => set("highlights", v)} addLabel="+ Add highlight" />
      </div>

      <div className="panel">
        <h2>4 · Numbers that matter</h2>
        <p className="sub">Results, targets or estimates — say which. Only numbers you can defend in an interview.</p>
        <ListEditor items={p.impact} onChange={(v) => set("impact", v)} addLabel="+ Add metric" />
      </div>

      <div className="panel">
        <h2>5 · Skills</h2>
        <p className="sub">Click + to add. Grouped automatically on the site.</p>
        <SkillEditor skills={p.skills} onChange={(v) => set("skills", v)} suggestions={suggested} />
      </div>

      <div className="panel">
        <h2>6 · Links, documents & cover image</h2>
        <LinksEditor links={p.links} onChange={(v) => set("links", v)} />
        <div style={{ marginTop: 18 }}>
          <div className="field"><span>Documents for download</span></div>
          {p.documents.map((d, i) => (
            <div key={d.url} className="list-row" style={{ marginBottom: 8 }}>
              <a className="input" href={d.url} target="_blank" rel="noreferrer">{d.name}</a>
              <button className="icon-btn" onClick={() => set("documents", p.documents.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <UploadButton
            label="+ Upload document"
            accept=".pdf,.docx,.pptx,.xlsx,.md,.txt"
            folder={slug || "project"}
            onUploaded={(u) => set("documents", [...p.documents, u])}
            onFlash={onFlash}
          />
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="field"><span>Cover image (architecture diagram, screenshot)</span></div>
          {p.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.cover} alt="" style={{ maxHeight: 160, borderRadius: 12, marginBottom: 10 }} />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <UploadButton
              label={p.cover ? "Replace cover" : "+ Upload cover"}
              accept="image/*"
              folder={slug || "project"}
              onUploaded={(u) => set("cover", u.url)}
              onFlash={onFlash}
            />
            {p.cover && <button className="btn small" onClick={() => set("cover", undefined)}>Remove</button>}
          </div>
        </div>
      </div>

      <div className="savebar">
        <span>{isNew ? "New project" : "Editing project"}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn small" onClick={onCancel} disabled={saving}>Cancel</button>
          <button
            className="btn small primary"
            disabled={saving || !p.title.trim() || slugTaken}
            onClick={() => onSave({ ...p, slug })}
          >
            {saving && <span className="spinner" />} Save & publish
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ListEditor({ items, onChange, addLabel }: { items: string[]; onChange: (v: string[]) => void; addLabel: string }) {
  return (
    <div className="list-edit">
      {items.map((it, i) => (
        <div key={i} className="list-row">
          <textarea
            className="textarea"
            value={it}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button className="icon-btn" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button className="btn small add-row" onClick={() => onChange([...items, ""])}>{addLabel}</button>
    </div>
  );
}

function LinksEditor({ links, onChange }: { links: LinkT[]; onChange: (v: LinkT[]) => void }) {
  return (
    <div className="list-edit">
      <div className="field" style={{ marginBottom: 0 }}><span>Links (GitHub repo, demo, video, blog post)</span></div>
      {links.map((l, i) => (
        <div key={i} className="list-row" style={{ gridTemplateColumns: "1fr 2fr auto" }}>
          <input className="input" placeholder="Label" value={l.label} onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          <input className="input" placeholder="https://…" value={l.url} onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
          <button className="icon-btn" onClick={() => onChange(links.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button className="btn small add-row" onClick={() => onChange([...links, { label: "", url: "" }])}>+ Add link</button>
    </div>
  );
}

function SkillEditor({ skills, onChange, suggestions = [] }: { skills: string[]; onChange: (v: string[]) => void; suggestions?: string[] }) {
  const [input, setInput] = useState("");
  const add = (s: string) => {
    const v = s.trim();
    if (!v) return;
    const canonical = ALL_SKILL_NAMES.find((n) => n.toLowerCase() === v.toLowerCase()) ?? v;
    if (!skills.some((x) => x.toLowerCase() === canonical.toLowerCase())) onChange([...skills, canonical]);
    setInput("");
  };
  const pending = suggestions.filter((s) => !skills.includes(s));
  return (
    <div>
      <div className="skill-chips">
        {skills.map((s) => (
          <span key={s} className="skill-chip" title={categoryOf(s)}>
            {s}
            <button aria-label={`Remove ${s}`} onClick={() => onChange(skills.filter((x) => x !== s))}>×</button>
          </span>
        ))}
        {!skills.length && <span style={{ color: "var(--faint)", fontSize: 14 }}>No skills yet.</span>}
      </div>
      {pending.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="field" style={{ marginBottom: 8 }}>
            <span>
              Detected in your documents — click the ones you actually used{" "}
              <button className="suggest" style={{ marginLeft: 8 }} onClick={() => onChange([...skills, ...pending])}>+ Add all {pending.length}</button>
            </span>
          </div>
          <div className="skill-chips">
            {pending.map((s) => (
              <button key={s} className="suggest" onClick={() => add(s)}>+ {s}</button>
            ))}
          </div>
        </div>
      )}
      <div className="skill-add">
        <input
          className="input"
          list="skill-options"
          placeholder="Type a skill (e.g. LangGraph, RAG, Terraform)…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(input);
            }
          }}
        />
        <button className="btn" onClick={() => add(input)} aria-label="Add skill">+</button>
        <datalist id="skill-options">
          {ALL_SKILL_NAMES.map((n) => <option key={n} value={n} />)}
        </datalist>
      </div>
    </div>
  );
}

function UploadButton({
  label,
  accept,
  folder,
  onUploaded,
  onFlash,
}: {
  label: string;
  accept: string;
  folder: string;
  onUploaded: (u: { name: string; url: string }) => void;
  onFlash: (f: Flash) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button className="btn small" disabled={busy} onClick={() => ref.current?.click()}>
        {busy && <span className="spinner" />} {label}
      </button>
      <input
        ref={ref}
        type="file"
        hidden
        accept={accept}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            onUploaded(await uploadFile(f, f.name, folder));
          } catch (err) {
            onFlash({ kind: "err", text: (err as Error).message });
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function ProfileTab({ profile, onChange, onFlash }: { profile: Profile; onChange: (p: Profile) => void; onFlash: (f: Flash) => void }) {
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => onChange({ ...profile, [k]: v });
  return (
    <div className="editor">
      <div className="panel">
        <h2>Photo</h2>
        <p className="sub">Auto-cropped to a square and brightened. Best results: face a window, plain background, eye-level camera.</p>
        <PhotoEditor current={profile.photo} onUploaded={(url) => set("photo", url)} onFlash={onFlash} />
      </div>

      <div className="panel">
        <h2>Basics</h2>
        <div className="row2">
          <label className="field"><span>Full name</span><input className="input" value={profile.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label className="field"><span>Location</span><input className="input" value={profile.location} onChange={(e) => set("location", e.target.value)} /></label>
        </div>
        <label className="field"><span>Headline</span><input className="input" value={profile.headline} onChange={(e) => set("headline", e.target.value)} /></label>
        <label className="field"><span>Summary</span><textarea className="textarea" style={{ minHeight: 140 }} value={profile.summary} onChange={(e) => set("summary", e.target.value)} /></label>
        <div className="field"><span>Open to roles</span></div>
        <SkillEditorPlain items={profile.openTo} onChange={(v) => set("openTo", v)} placeholder="e.g. Forward Deployed Engineer" />
      </div>

      <div className="panel">
        <h2>Contact & links</h2>
        <div className="row2">
          <label className="field"><span>Email (public)</span><input className="input" type="email" value={profile.email} onChange={(e) => set("email", e.target.value)} /></label>
          <label className="field"><span>Phone (public, optional)</span><input className="input" value={profile.phone} onChange={(e) => set("phone", e.target.value)} /></label>
          <label className="field"><span>LinkedIn URL</span><input className="input" value={profile.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…" /></label>
          <label className="field"><span>GitHub URL</span><input className="input" value={profile.github} onChange={(e) => set("github", e.target.value)} placeholder="https://github.com/…" /></label>
          <label className="field"><span>Website / blog</span><input className="input" value={profile.website} onChange={(e) => set("website", e.target.value)} /></label>
          <div className="field">
            <span>Résumé (PDF)</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {profile.resume && <a className="btn small" href={profile.resume} target="_blank" rel="noreferrer">Current résumé ↗</a>}
              <UploadButton label={profile.resume ? "Replace" : "+ Upload résumé"} accept=".pdf" folder="profile" onUploaded={(u) => set("resume", u.url)} onFlash={onFlash} />
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>What I do (focus areas)</h2>
        <FocusEditor items={profile.focusAreas} onChange={(v) => set("focusAreas", v)} />
      </div>
    </div>
  );
}

function SkillEditorPlain({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    if (input.trim() && !items.includes(input.trim())) onChange([...items, input.trim()]);
    setInput("");
  };
  return (
    <div>
      <div className="skill-chips">
        {items.map((s) => (
          <span key={s} className="skill-chip">{s}<button onClick={() => onChange(items.filter((x) => x !== s))}>×</button></span>
        ))}
      </div>
      <div className="skill-add">
        <input className="input" value={input} placeholder={placeholder} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button className="btn" onClick={add}>+</button>
      </div>
    </div>
  );
}

function FocusEditor({ items, onChange }: { items: FocusArea[]; onChange: (v: FocusArea[]) => void }) {
  return (
    <div className="list-edit">
      {items.map((f, i) => (
        <div key={i} className="list-row">
          <div style={{ display: "grid", gap: 8 }}>
            <input className="input" value={f.title} placeholder="Title" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <textarea className="textarea" style={{ minHeight: 70 }} value={f.text} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
          </div>
          <button className="icon-btn" onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button className="btn small add-row" onClick={() => onChange([...items, { title: "", text: "" }])}>+ Add focus area</button>
    </div>
  );
}

/** Square-crops and brightens a photo in the browser, then uploads a 720×720 JPEG. */
function PhotoEditor({ current, onUploaded, onFlash }: { current: string; onUploaded: (url: string) => void; onFlash: (f: Flash) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fx, setFx] = useState(50);
  const [fy, setFy] = useState(30);
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const draw = useCallback(() => {
    const c = canvas.current;
    if (!c || !img) return;
    const size = 720;
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    const side = Math.min(img.naturalWidth, img.naturalHeight) / zoom;
    const sx = (img.naturalWidth - side) * (fx / 100);
    const sy = (img.naturalHeight - side) * (fy / 100);
    ctx.filter = `brightness(${brightness}) contrast(1.08) saturate(1.06)`;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  }, [img, brightness, zoom, fx, fy]);

  useEffect(draw, [draw]);

  const load = (file: File) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      // Auto-brightness: aim for a mid-tone average.
      const t = document.createElement("canvas");
      t.width = 64;
      t.height = 64;
      const tc = t.getContext("2d")!;
      tc.drawImage(im, 0, 0, 64, 64);
      const px = tc.getImageData(0, 0, 64, 64).data;
      let sum = 0;
      for (let i = 0; i < px.length; i += 4) sum += 0.2126 * px[i]! + 0.7152 * px[i + 1]! + 0.0722 * px[i + 2]!;
      const mean = sum / (px.length / 4) / 255;
      setBrightness(Math.min(1.9, Math.max(1, +(0.5 / Math.max(mean, 0.05)).toFixed(2))));
      setZoom(im.naturalWidth > im.naturalHeight * 1.2 ? 1.4 : 1);
      setFx(50);
      setFy(25);
      setImg(im);
    };
    im.src = url;
  };

  const save = async () => {
    if (!canvas.current) return;
    setBusy(true);
    try {
      const blob = await new Promise<Blob>((res, rej) => canvas.current!.toBlob((b) => (b ? res(b) : rej(new Error("Could not encode image"))), "image/jpeg", 0.9));
      const up = await uploadFile(blob, "profile.jpg", "profile");
      onUploaded(up.url);
      setImg(null);
      onFlash({ kind: "warn", text: "Photo uploaded. Click Publish at the bottom to put it on the site." });
    } catch (e) {
      onFlash({ kind: "err", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="photo-editor">
      <div className="photo-preview">
        {img ? (
          <canvas ref={canvas} />
        ) : current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="Current" />
        ) : (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--faint)" }}>No photo</div>
        )}
      </div>
      <div>
        <button className="btn small" onClick={() => fileRef.current?.click()}>{current || img ? "Choose another photo" : "+ Choose photo"}</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ""; }} />
        {img && (
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <label className="field" style={{ marginBottom: 0 }}><span>Brightness ({brightness.toFixed(2)}×)</span><input className="range" type="range" min={0.8} max={2} step={0.05} value={brightness} onChange={(e) => setBrightness(+e.target.value)} /></label>
            <label className="field" style={{ marginBottom: 0 }}><span>Zoom</span><input className="range" type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(+e.target.value)} /></label>
            <label className="field" style={{ marginBottom: 0 }}><span>Left ↔ right</span><input className="range" type="range" min={0} max={100} value={fx} onChange={(e) => setFx(+e.target.value)} /></label>
            <label className="field" style={{ marginBottom: 0 }}><span>Up ↕ down</span><input className="range" type="range" min={0} max={100} value={fy} onChange={(e) => setFy(+e.target.value)} /></label>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn primary small" disabled={busy} onClick={save}>{busy && <span className="spinner" />} Use this photo</button>
              <button className="btn small" onClick={() => setImg(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SkillsTab({ content, onChange }: { content: SiteContent; onChange: (p: Profile) => void }) {
  const fromProjects = useMemo(() => [...new Set(content.projects.flatMap((p) => p.skills))], [content.projects]);
  return (
    <div className="editor">
      <div className="panel">
        <h2>Extra skills</h2>
        <p className="sub">Skills you have that aren’t tied to a project above (e.g. from courses or past work). Click + to add.</p>
        <SkillEditor skills={content.profile.skills} onChange={(skills) => onChange({ ...content.profile, skills })} />
      </div>
      <div className="panel">
        <h2>From your projects ({fromProjects.length})</h2>
        <p className="sub">These come from each project’s skill list — edit a project to change them.</p>
        {groupSkills(fromProjects).map((g) => (
          <div key={g.category} className="gap-cat">
            <h3>{g.category} <small>{g.skills.length}</small></h3>
            <div className="skill-chips">{g.skills.map((s) => <span key={s} className="gap-chip have">{s}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketTab({ content, onChange }: { content: SiteContent; onChange: (p: Profile) => void }) {
  const have = new Set([...content.profile.skills, ...content.projects.flatMap((p) => p.skills)]);
  const coreMissing = TAXONOMY.flatMap((c) => c.skills).filter((s) => s.demand === "core" && !have.has(s.name));
  return (
    <div className="editor">
      <div className="panel">
        <h2>Market gap (private — not shown on your site)</h2>
        <p className="sub">
          Skills that FDE / AI-engineer job posts ask for, against what your portfolio proves. {coreMissing.length} core skills are
          not evidenced yet. The fix is a project that uses them — not adding them to a list. Only click “I have this” if you can
          defend it in an interview.
        </p>
        <div className="legend">
          <span className="gap-chip have">Evidenced</span>
          <span className="gap-chip core">Core, missing</span>
          <span className="gap-chip">Other, missing</span>
        </div>
        {TAXONOMY.map((c) => {
          const n = c.skills.filter((s) => have.has(s.name)).length;
          return (
            <div key={c.name} className="gap-cat">
              <h3>{c.name} <small>{n}/{c.skills.length}</small></h3>
              <div className="skill-chips">
                {c.skills.map((s) =>
                  have.has(s.name) ? (
                    <span key={s.name} className="gap-chip have">✓ {s.name}</span>
                  ) : (
                    <button
                      key={s.name}
                      className={`gap-chip suggest ${s.demand === "core" ? "core" : ""}`}
                      title="I have this skill — add to Extra skills"
                      onClick={() => onChange({ ...content.profile, skills: [...content.profile.skills, s.name] })}
                    >
                      {s.name}
                    </button>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

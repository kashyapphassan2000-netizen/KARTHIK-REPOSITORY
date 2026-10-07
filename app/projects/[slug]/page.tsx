import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "@/components/icons";
import { getContent } from "@/lib/content";
import { groupSkills } from "@/lib/taxonomy";

export const dynamicParams = false;

export function generateStaticParams() {
  return getContent().projects.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { profile, projects } = getContent();
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return { title: `${p.title} — ${profile.name}`, description: p.tagline };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const { profile, projects } = getContent();
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();
  const meta = [
    ["Role", p.role],
    ["Context", p.context],
    ["Period", p.period],
    ["Status", p.status],
  ].filter(([, v]) => v);

  return (
    <>
      <div className="bg-decor" aria-hidden>
        <div className="blob one" />
        <div className="blob two" />
      </div>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">{profile.name.slice(0, 1).toUpperCase()}</span>
            <span>{profile.name}</span>
          </Link>
          <div className="nav-links">
            <Link href="/#work">Work</Link>
            <Link href="/#contact" className="btn small primary">Contact</Link>
          </div>
        </div>
      </nav>

      <main>
        <header className="detail-hero">
          <div className="container">
            <Link href="/#work" className="back"><ArrowLeft /> All case studies</Link>
            <div className="badges reveal">
              {p.status && <span className={`badge ${/progress/i.test(p.status) ? "amber" : "teal"}`}>{p.status.split("(")[0]!.trim()}</span>}
              {p.featured && <span className="badge">Featured</span>}
            </div>
            <h1 className="reveal d1">{p.title}</h1>
            <p className="tagline reveal d2">{p.tagline}</p>
            {p.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover} alt="" className="card reveal d2" style={{ marginTop: 32, padding: 0, width: "100%", borderRadius: 20 }} />
            )}
            <dl className="meta-grid reveal d3">
              {meta.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
        </header>

        <div className="container detail-body">
          <article className="prose">
            {p.problem && (<><h2>The problem</h2><p>{p.problem}</p></>)}
            {p.solution && (<><h2>The solution</h2><p>{p.solution}</p></>)}
            {p.highlights.length > 0 && (
              <>
                <h2>What I did</h2>
                <ol className="steps">
                  {p.highlights.map((h, i) => (
                    <li key={i}><b>{String(i + 1).padStart(2, "0")}</b><span>{h}</span></li>
                  ))}
                </ol>
              </>
            )}
            {p.impact.length > 0 && (
              <>
                <h2>Numbers that matter</h2>
                <div className="impact-grid">
                  {p.impact.map((x, i) => <div key={i} className="impact-item">{x}</div>)}
                </div>
              </>
            )}
          </article>

          <aside className="aside">
            {p.skills.length > 0 && (
              <div className="card">
                <h4>Stack & skills</h4>
                {groupSkills(p.skills).map((g) => (
                  <div key={g.category} className="group">
                    <div className="group-name">{g.category}</div>
                    <div className="chips">{g.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                  </div>
                ))}
              </div>
            )}
            {(p.links.length > 0 || p.documents.length > 0) && (
              <div className="card">
                <h4>Links & documents</h4>
                {p.links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="doc-link"><ExternalLink /> {l.label || l.url}</a>
                ))}
                {p.documents.map((d) => (
                  <a key={d.url} href={d.url} target="_blank" rel="noreferrer" className="doc-link"><FileText /> {d.name}</a>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer>
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <Link href="/">← Back to portfolio</Link>
        </div>
      </footer>
    </>
  );
}

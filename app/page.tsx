import Link from "next/link";
import { ArrowRight, FileText, FOCUS_ICONS, Github, Globe, Linkedin, Mail, Pin, Sparkle } from "@/components/icons";
import { getContent, skillIndex } from "@/lib/content";
import { groupSkills, TAXONOMY } from "@/lib/taxonomy";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

export default function Home() {
  const content = getContent();
  const { profile, projects } = content;
  const index = skillIndex(content);
  const groups = groupSkills([...index.keys()]).map((g) => ({
    ...g,
    // Skills proven in more projects first.
    skills: [...g.skills].sort((a, b) => (index.get(b)?.length ?? 0) - (index.get(a)?.length ?? 0) || a.localeCompare(b)),
  }));
  const firstName = profile.name.split(" ")[0];
  const core = TAXONOMY.flatMap((c) => c.skills).filter((s) => s.demand === "core");
  const coreCovered = core.filter((s) => index.has(s.name)).length;

  return (
    <>
      <div className="bg-decor" aria-hidden>
        <div className="blob one" />
        <div className="blob two" />
        <div className="blob three" />
      </div>

      <nav className="nav">
        <div className="container nav-inner">
          <a href="#top" className="brand">
            <span className="brand-mark">{initials(profile.name)}</span>
            <span>{profile.name}</span>
          </a>
          <div className="nav-links">
            <a href="#work">Work</a>
            <a href="#skills" className="hide-sm">Skills</a>
            <a href="#about" className="hide-sm">About</a>
            {profile.resume && <a href={profile.resume} target="_blank" rel="noreferrer" className="hide-sm">Résumé</a>}
            <a href="#contact" className="btn small primary">Contact</a>
          </div>
        </div>
      </nav>

      <main id="top">
        <header className="hero">
          <div className="container hero-grid">
            <div>
              {profile.openTo.length > 0 && (
                <span className="pill reveal">
                  <span className="pulse" /> Open to {profile.openTo.slice(0, 3).join(" · ")}
                </span>
              )}
              <h1 className="reveal d1">
                Hi, I&apos;m <span className="grad-text">{firstName}</span>.
              </h1>
              <p className="headline reveal d1">{profile.headline}</p>
              <p className="summary reveal d2">{profile.summary}</p>
              <div className="hero-actions reveal d3">
                <a href="#work" className="btn primary">
                  View case studies <ArrowRight />
                </a>
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn"><Linkedin /> LinkedIn</a>
                )}
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noreferrer" className="btn"><Github /> GitHub</a>
                )}
                {profile.resume && (
                  <a href={profile.resume} target="_blank" rel="noreferrer" className="btn"><FileText /> Résumé</a>
                )}
              </div>
              <div className="hero-meta reveal d3">
                {profile.location && <span><Pin /> {profile.location}</span>}
                {profile.email && <span><Mail /> {profile.email}</span>}
                {profile.website && <span><Globe /> {profile.website.replace(/^https?:\/\//, "")}</span>}
              </div>
            </div>

            <div className="hero-photo-wrap reveal d2">
              <div className="hero-photo-ring" />
              <div className="hero-photo">
                {profile.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photo} alt={profile.name} />
                ) : (
                  <div className="initials grad-text">{initials(profile.name)}</div>
                )}
              </div>
              <div className="photo-badge"><Sparkle className="grad-icon" /> Forward Deployed · AI / ML</div>
            </div>
          </div>
        </header>

        <div className="container">
          <div className="stats reveal d3">
            <div className="stat"><b className="grad-text">{projects.length}</b><span>Client case studies</span></div>
            <div className="stat"><b className="grad-text">{index.size}</b><span>Skills evidenced</span></div>
            <div className="stat"><b className="grad-text">{groups.length}</b><span>Skill domains</span></div>
            <div className="stat"><b className="grad-text">{coreCovered}/{core.length}</b><span>Core FDE / AI-engineer skills</span></div>
          </div>
        </div>

        <section id="about">
          <div className="container">
            <p className="eyebrow">What I do</p>
            <h2 className="section-title">From a client&apos;s problem to a system that ships</h2>
            <p className="section-sub">
              Forward deployed engineering is sitting with the customer, understanding the real constraint, and building the thing
              that works inside their stack, budget and compliance rules.
            </p>
            <div className="focus-grid">
              {profile.focusAreas.map((f, i) => {
                const Icon = FOCUS_ICONS[i % FOCUS_ICONS.length]!;
                return (
                  <div key={f.title} className="card focus-card">
                    <div className="icon-chip"><Icon /></div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="work">
          <div className="container">
            <p className="eyebrow">Selected work</p>
            <h2 className="section-title">Case studies</h2>
            <p className="section-sub">Each one starts from a real client brief: the constraint, the architecture, and the numbers behind the decisions.</p>
            {projects.length === 0 ? (
              <div className="empty">Case studies are being added.</div>
            ) : (
              <div className="projects">
                {projects.map((p) => (
                  <Link key={p.slug} href={`/projects/${p.slug}`} className="project-card">
                    <div>
                      <div className="badges">
                        {p.status && <span className={`badge ${/progress/i.test(p.status) ? "amber" : "teal"}`}>{p.status.split("(")[0]!.trim()}</span>}
                        {p.role && <span className="badge">{p.role.split("—")[0]!.trim()}</span>}
                      </div>
                      <h3>{p.title}</h3>
                      <p className="tagline">{p.tagline}</p>
                      {p.context && <p className="context">{p.context}</p>}
                      <div className="chips">
                        {p.skills.slice(0, 9).map((s) => <span key={s} className="chip">{s}</span>)}
                        {p.skills.length > 9 && <span className="chip more">+{p.skills.length - 9} more</span>}
                      </div>
                    </div>
                    <span className="project-arrow"><ArrowRight /></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="skills">
          <div className="container">
            <p className="eyebrow">Skills</p>
            <h2 className="section-title">What I bring to an engagement</h2>
            <p className="section-sub">Grouped by domain. Skills marked ×2 are used in more than one case study.</p>
            <div className="skills-grid">
              {groups.map((g) => (
                <div key={g.category} className="card skill-group">
                  <h3>{g.category} <small>{g.skills.length}</small></h3>
                  <div className="chips">
                    {g.skills.map((s) => {
                      const n = index.get(s)?.length ?? 0;
                      return (
                        <span key={s} className="chip">
                          {s}
                          {n > 1 && <span className="count">×{n}</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact">
          <div className="container">
            <div className="contact-card">
              <p className="eyebrow">Contact</p>
              <h2>Have a hard problem to deploy?</h2>
              <p>I&apos;m looking for {profile.openTo.length ? profile.openTo.join(", ") : "forward deployed and AI engineering"} roles. Happy to walk through any of these designs in detail.</p>
              <div className="contact-actions">
                {profile.email && <a href={`mailto:${profile.email}`} className="btn primary"><Mail /> {profile.email}</a>}
                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn"><Linkedin /> LinkedIn</a>}
                {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="btn"><Github /> GitHub</a>}
                {profile.phone && <a href={`tel:${profile.phone.replace(/\s+/g, "")}`} className="btn">{profile.phone}</a>}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <span>Forward Deployed Engineer · AI / ML</span>
        </div>
      </footer>
    </>
  );
}

export type Link = { label: string; url: string };

export type ProjectDocument = { name: string; url: string };

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  /** e.g. "Euron FDE program — client case study" or "Freelance client" */
  context: string;
  role: string;
  period: string;
  status: string;
  featured: boolean;
  /** The customer problem, in their language. */
  problem: string;
  /** What you designed / built and how. */
  solution: string;
  /** Concrete things you did (one line each). */
  highlights: string[];
  /** Outcomes, numbers, targets — only what you can defend in an interview. */
  impact: string[];
  skills: string[];
  links: Link[];
  documents: ProjectDocument[];
  cover?: string;
  createdAt: string;
};

export type FocusArea = { title: string; text: string };

export type Profile = {
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  photo: string;
  resume: string;
  summary: string;
  openTo: string[];
  focusAreas: FocusArea[];
  /** Skills you have that are not tied to a listed project. */
  skills: string[];
};

export type SiteContent = { profile: Profile; projects: Project[] };

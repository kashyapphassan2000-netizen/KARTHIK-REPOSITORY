# FDE Portfolio

A personal portfolio for a Forward Deployed Engineer (AI / ML), built with Next.js and hosted on Vercel.

- **Public site** (`/`): hero with photo, focus areas, case studies, skills grouped by domain, and contact details.
- **Project pages** (`/projects/<slug>`): the problem, the solution, what I did, numbers, stack, links and documents.
- **Admin** (`/admin`, password-protected):
  - **+ Add a new project**: upload `.docx` / `.pdf` / `.txt` / `.md` documents. The app reads them, detects skills, and (with a free Gemini key) drafts the write-up. You review it, then click **Save & publish**.
  - **Profile & photo**: upload a photo. It is auto-cropped to a square and auto-brightened in the browser. You can also edit your bio and links and upload your résumé.
  - **Skills**: add skills with the **+** button.
  - **Market gap**: a private view that compares your evidenced skills with what FDE / AI-engineer job posts ask for.

## How auto-update works

```
/admin form ──► API route ──► GitHub commit (content/*.json, public/uploads/*)
                                   │
                                   ▼
                     Vercel sees the push and rebuilds
                                   │
                                   ▼
                  public site updated (~1 minute)
```

All content lives in `content/profile.json` and `content/projects.json`, and you can also edit those files by hand.

---

## Deploy to Vercel (step by step)

You do **not** need a Vercel API key for any of this. Vercel deploys straight from GitHub. The keys you need are below.

### 1. Create the three secrets

| Variable | What it is | Where to get it |
|---|---|---|
| `ADMIN_PASSWORD` | Password for `/admin` | Make one up: 16+ characters, not reused anywhere |
| `GITHUB_TOKEN` | Lets the admin form commit to this repo | See step 1a |
| `GEMINI_API_KEY` | Free AI that drafts projects from your documents (optional) | See step 1b |

**1a. GitHub token (fine-grained, this repo only)**
1. Go to GitHub → your avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Name: `portfolio-admin`. Expiration: 1 year.
3. **Repository access** → *Only select repositories* → pick this repository.
4. **Permissions** → **Repository permissions** → **Contents** → *Read and write*. Leave everything else as is.
5. Click **Generate token** and copy it (it starts with `github_pat_`). You will only see it once.

**1b. Free Gemini API key (optional, for AI auto-fill)**
1. Go to <https://aistudio.google.com/apikey> and sign in with a Google account.
2. Click **Create API key** and copy it.
3. The free tier has rate limits, which is enough for adding projects. On the free tier, Google may use your inputs to improve its products. **Do not upload client documents marked confidential.** Write a sanitised summary and upload that instead, or leave the key unset and use keyword detection only.

(Paid alternative: set `ANTHROPIC_API_KEY` instead to use Claude.)

### 2. Import the repo into Vercel
1. Go to <https://vercel.com/signup> and choose **Continue with GitHub** (the free Hobby plan is enough).
2. **Add New… → Project** → find this repository → **Import**.
   If it is not listed, click **Adjust GitHub App Permissions** and give Vercel access to the repo.
3. Framework preset: **Next.js**, detected automatically. Leave the build settings as they are.
4. Open **Environment Variables** and add `ADMIN_PASSWORD`, `GITHUB_TOKEN` and (optionally) `GEMINI_API_KEY`.
5. Click **Deploy**. After about a minute you get a public URL such as `https://your-project.vercel.app`.

### 3. Use it
1. Open `https://your-project.vercel.app/admin` and log in with `ADMIN_PASSWORD`.
2. **Profile & photo** → upload your photo, fill in your email, LinkedIn and GitHub, then click **Publish**.
3. **Projects** → **+ Add a new project** → drop in your documents → **Analyze & auto-fill**. Review every field, click the detected skills you actually used, then **Save & publish**.
4. Wait about a minute, then refresh the public site.

### Optional
- **Custom domain:** Vercel → Project → **Settings → Domains**.
- **Changed an environment variable?** Vercel → **Deployments** → ⋯ on the latest → **Redeploy**. Environment variables only apply to new deployments.
- **Branch:** the admin commits to the branch Vercel deployed from (`VERCEL_GIT_COMMIT_REF`). Override it with `GITHUB_BRANCH` and `GITHUB_REPO` if needed.
- **Vercel API token:** you only need one for the Vercel CLI or for CI. Get it at <https://vercel.com/account/tokens> → **Create Token**. You don't need it for this setup.

## Run locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD; leave GITHUB_TOKEN empty to write to disk
npm run dev                  # http://localhost:3000 and http://localhost:3000/admin
```

When `GITHUB_TOKEN` is empty, admin edits are written straight to `content/` and `public/uploads/` on disk. Commit and push them yourself.

## Limits
- Uploads are limited to 4 MB per file (Vercel's request limit). Compress images inside large `.docx` files, or export them to PDF.
- Old `.doc` files are not supported. Save them as `.docx` first.
- Each publish or upload is one commit, and each commit triggers one Vercel build. The Hobby plan allows plenty of builds for this.

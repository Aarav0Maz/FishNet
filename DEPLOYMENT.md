# Deployment

## 1. Supabase (free tier)
1. Create a project at supabase.com.
2. SQL editor → paste and run `supabase/migrations/0001_fishnet.sql`.
3. Authentication → Providers → Email. For quick testing turn **Confirm email** off (otherwise users must click the emailed link).
4. Authentication → URL configuration → add your Render URL to Site URL / Redirect URLs.
5. Project settings → API: copy the **Project URL** and the **anon public** key. Never use the `service_role` key in the frontend or in Render env vars.

## 2. Render static site
1. Push this repo to GitHub.
2. Render → New → Blueprint → select the repo (reads `render.yaml`), or New → Static Site with build `npm ci && npm run build`, publish dir `dist`.
3. Add a rewrite rule `/*` → `/index.html` (already in `render.yaml`) so deep links like `/app/network` work.
4. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. They are public by design; security comes from RLS and the RPC checks.
5. Deploy, then run the two-user test below on the live URL.

## 3. Two-user test (manual)
Use two browsers/profiles. A and B each sign up, finish onboarding, and set discoverable on. A likes B, B likes A → both see the match in Matches and Network. In Network, pick a target and request an introduction; the intermediary and then the target accept in Intros. In Matches, A requests a reveal, B approves; both now see the other's real profile. Refresh and confirm persistence.

Status: none of this has been run against a real Supabase project or Render yet.

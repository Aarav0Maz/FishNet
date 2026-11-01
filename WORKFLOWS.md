# Render Workflows in FishNet

The static site serves the app. A **Render Workflow** (`workflows/`) runs background jobs off the request path, which is how FishNet scales discovery and housekeeping without slowing swipes:

| Task | What it does |
|---|---|
| `refreshSuggestions` | Fans out one `suggestForUser` subtask per discoverable user (25 in parallel), each writing a "N people match your interests" alert via `jobs_suggest_for()` |
| `expireStaleIntros(days=7)` | Expires introduction requests nobody answered and notifies the requester via `jobs_expire_stale_intros()` |
| `runNightlyJobs` | Runs both; use this for demos or a daily cron trigger |

All tasks retry automatically (3 tries, exponential backoff). The database functions are executable only by `service_role`, so the signed-in browser can't call them.

## Setup
1. Supabase SQL editor: run `supabase/migrations/0002_jobs.sql`.
2. Render → **New → Workflow** → repo `Aarav0Maz/FishNet`, language **Node**, same region as the site.
   - Build command: `npm --prefix workflows ci`
   - Start command: `npm --prefix workflows start`
3. Environment (workflow service only): `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project settings → API keys → secret/service_role). Never put this key in the static site or in git.
4. Deploy, open the workflow's **Tasks** page → `runNightlyJobs` → **Start Task** with `[]`.
5. Optional: a Render Cron Job that triggers `runNightlyJobs` daily (Workflows don't schedule themselves yet).

Billing is per task run by the second on the `flex` plan by default; these jobs run for seconds.

## Status
Deployed on Render as `fishnet-jobs` (Node, root `workflows/`, build `npm ci`, start `npm run start`). First run of `runNightlyJobs` on 2026-11-01 succeeded: 6.1s, suggestions for 5 users with 1 alert written.

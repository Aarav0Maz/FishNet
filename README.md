# FishNet

*Come for the fake status. Leave with real connections.*

Invent a fictional professional persona, swipe to discover people, match for real, map your network, ask for introductions along real routes, and optionally reveal your real identity once **both** sides consent.

Stack: React + Vite + TypeScript (strict) · Tailwind · React Router · Motion · React Flow · Supabase (Auth, Postgres, RLS, Realtime) · Render static site.

## Run locally
```bash
npm install
cp .env.example .env     # add your Supabase URL + anon key (optional for demo mode)
npm run dev
npm test                 # unit tests + migration tests (runs the real SQL in an in-process Postgres)
npm run build
```
Demo mode (`/demo`) works with no credentials. Real accounts need the Supabase setup in [DEPLOYMENT.md](DEPLOYMENT.md).

## Architecture
- `src/types.ts` — `DataSource` interface; the UI is identical for demo and live.
- `src/data/demo.ts` — in-memory demo world (24 fictional users); every "other side" action is simulated and labelled.
- `src/data/supabase.ts` — live source; all cross-user reads/writes go through `SECURITY DEFINER` RPCs that check `auth.uid()`.
- `src/lib/graph.ts` — BFS shortest path and deterministic match score (shared by demo and live; score mirrored in SQL).
- `supabase/migrations/0001_fishnet.sql` — tables, RLS, indexes, RPCs. Real identity lives in `private_identity`, readable only by its owner; the other party receives it only from `get_connections()` after both consent rows exist.

## Feature status
Legend: ✅ built and verified · 🟡 built, verified only in part · ⛔ not yet done

| Feature | Status | Verified how |
|---|---|---|
| Demo mode (one-click start, simulated match, graph, route, intro, reveal) | ✅ | Walked in browser; first like always matches |
| Swipe deck (drag, keys, buttons, pending lock, pagination, empty/error states) | 🟡 | Keyboard + match flow seen in browser; touch drag not tested on a device |
| Mutual match, atomic, exactly one connection | ✅ | SQL tests (idempotent repeat swipes, advisory lock). Parallel-transaction race not load-tested |
| RLS / privacy of real identity | ✅ | SQL tests as `authenticated`/`anon` roles |
| Introductions (intermediary then target approval) | ✅ | SQL tests incl. forbidden shortcuts |
| Reality reveal (both consent, withdraw revokes) | ✅ | SQL tests; fold animation seen only structurally |
| Graph, BFS route highlight, detail panel | ✅ demo | Browser. Live graph uses `get_graph()` (SQL-tested) |
| Notifications + Realtime | 🟡 | Rows created in SQL tests; Realtime subscription not exercised |
| Supabase Auth login, session restore after reload | ✅ | Live on Render: signed in, reloaded, stayed signed in |
| Live two-user flow on Render (match → graph → intro → reveal) | ✅ | Run by hand 2026-11-01: real match, 2-hop route from confirmed edges, intro completed after both approvals, one-button mutual reveal released real name/role/bio/LinkedIn only after both pressed |
| Render deployment | ✅ | https://fishnet-0crx.onrender.com, SPA rewrite fixed, auto-deploys from `main` |
| Take-this-path walkthrough (message each stop, ask the previous stop to introduce the next; completed intro creates a connection) | ✅ | Live on Render 2026-11-01: A → intermediary → target intro completed, new A–target connection created, reveal then worked on it. Panel auto-switching to Message not watched live |
| Party codes + Settings page | 🟡 | SQL-tested (filtering, validation); demo walked in browser; live needs `0006_party.sql` applied and an A/B check |
| Masked chat + conversation starters | ✅ | Live on Render 2026-11-01: A and B exchanged messages, both persisted, alert delivered; SQL-tested for RLS, outsiders, rate limit |
| Mascot | 🟡 | Vector placeholder; swap in your art if you have it |

## Background jobs
See [WORKFLOWS.md](WORKFLOWS.md): a Render Workflow service runs fan-out jobs (digest alerts, stale-intro expiry) with retries.

## Scaling notes (post-hackathon)
- Discovery scores candidates in SQL per request (`discover_page`). Fine for thousands of users; next step is a precomputed `match_candidates` table or a GIN-indexed tag search, refreshed on profile change.
- Graph reads are bounded (3 hops, 60 nodes per ring) and server-filtered by privacy settings.
- Swipe/match is one transaction guarded by an advisory lock per pair; connections are unique on an ordered pair.
- Add rate limiting (Supabase Edge or pg) before opening signups publicly, plus report/block and moderation for personas.

Known limits: free-tier Supabase/Render only, no capacity claims; graph shows up to 3 hops, capped at 60 nodes per ring.

import { task, type TaskContext } from "@renderinc/sdk/workflows";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Runs on Render Workflows. SUPABASE_SERVICE_ROLE_KEY lives only in this service's environment, never in the browser build.
function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the workflow service");
  return createClient(url, key, { auth: { persistSession: false } });
}
const retry = { maxRetries: 3, waitDurationMs: 1000, backoffScaling: 2 };

/** Subtask: write one user's "people match your interests" alert. Retried automatically on transient failures. */
const suggestForUser = task(
  { name: "suggestForUser", retry },
  async function suggestForUser(_ctx: TaskContext, userId: string): Promise<number> {
    const { data, error } = await db().rpc("jobs_suggest_for", { p_user: userId });
    if (error) throw new Error(error.message);
    return data as number;
  },
);

/** Fans out one subtask per discoverable user, in parallel batches. */
const refreshSuggestionsRef = task(
  { name: "refreshSuggestions", retry },
  async function refreshSuggestions(ctx: TaskContext): Promise<{ users: number; withSuggestions: number }> {
    const { data, error } = await db().from("profiles").select("id").eq("discoverable", true);
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((r: { id: string }) => r.id);
    let withSuggestions = 0;
    for (let i = 0; i < ids.length; i += 25) {
      const counts = await Promise.all(ids.slice(i, i + 25).map((id) => ctx.run(suggestForUser, id)));
      withSuggestions += counts.filter((n) => n > 0).length;
    }
    return { users: ids.length, withSuggestions };
  },
);

/** Expires introduction requests nobody answered within `days` (default 7) and tells the requesters. */
const expireStaleIntrosRef = task(
  { name: "expireStaleIntros", retry },
  async function expireStaleIntros(_ctx: TaskContext, days: number = 7): Promise<{ expired: number }> {
    const { data, error } = await db().rpc("jobs_expire_stale_intros", { p_days: days });
    if (error) throw new Error(error.message);
    return { expired: Array.isArray(data) ? data.length : 0 };
  },
);

/** One-click "run everything" for demos and for a cron trigger. */
task(
  { name: "runNightlyJobs", retry },
  async function runNightlyJobs(ctx: TaskContext): Promise<unknown> {
    const [sug, exp] = await Promise.all([ctx.run(refreshSuggestionsRef), ctx.run(expireStaleIntrosRef, 7)]);
    return { suggestions: sug, intros: exp };
  },
);

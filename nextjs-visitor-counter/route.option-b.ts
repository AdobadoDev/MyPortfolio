// ─────────────────────────────────────────────────────────────
// OPTION B — Vercel KV (Redis-backed, Vercel-native)
// File: app/api/counter/route.ts
//
// Setup: vercel env pull, then install @vercel/kv
//   npm install @vercel/kv
// ─────────────────────────────────────────────────────────────

import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

const VISIT_KEY      = "lance:portfolio:visits";
const LAST_VISIT_KEY = "lance:portfolio:lastVisit";

export async function GET() {
  try {
    // Read the PREVIOUS visit timestamp BEFORE incrementing
    const lastVisit = await kv.get<string>(LAST_VISIT_KEY);

    // Atomically increment the visit counter
    const count = await kv.incr(VISIT_KEY);

    // Store current visit time as the new "last visit" for next visitor
    await kv.set(LAST_VISIT_KEY, new Date().toISOString());

    return Response.json({ count, lastVisit: lastVisit ?? null });
  } catch (err) {
    console.error("[counter] KV error:", err);
    return Response.json({ count: 0, lastVisit: null }, { status: 500 });
  }
}

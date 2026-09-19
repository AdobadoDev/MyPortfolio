// ─────────────────────────────────────────────────────────────
// OPTION A — Free CounterAPI (counterapi.dev)
// File: app/api/counter/route.ts
//
// No setup needed. Just replace YOUR_NAMESPACE with any unique
// string (e.g. your-name-portfolio-2026).
// ─────────────────────────────────────────────────────────────

const NAMESPACE = "lance-portfolio-2026";   // <-- change this
const KEY       = "visits";
const BASE_URL  = "https://api.counterapi.dev/v1";

export const dynamic = "force-dynamic";     // never cache this route

export async function GET() {
  try {
    // Hit = increment the counter by 1 and return new value
    const hitRes = await fetch(`${BASE_URL}/${NAMESPACE}/${KEY}/up`, {
      cache: "no-store",
    });

    if (!hitRes.ok) throw new Error("CounterAPI error");

    const { count } = await hitRes.json() as { count: number };

    // We use count - 1 as the "previous" visit timestamp approximation.
    // CounterAPI doesn't store timestamps, so we derive "last visit"
    // from sessionStorage on the client. The API only returns count.
    // To show a real timestamp, use Option B (Vercel KV).

    return Response.json({
      count,
      lastVisit: null,   // CounterAPI has no timestamp support
    });
  } catch {
    return Response.json({ count: 0, lastVisit: null }, { status: 500 });
  }
}

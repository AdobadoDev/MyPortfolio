"use client";

import { useEffect, useState } from "react";

interface CounterData {
  count: number;
  lastVisit: string | null;
}

function formatCount(n: number): string {
  const padded = String(Math.max(0, n)).padStart(6, "0");
  return padded.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatLastVisit(iso: string | null): string {
  if (!iso) return "JUST NOW";
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60)    return "JUST NOW";
  if (diffSec < 3600)  return `${Math.floor(diffSec / 60)}M AGO`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}H AGO`;
  return `${Math.floor(diffSec / 86400)}D AGO`;
}

export default function VisitorCounter() {
  const [data, setData]       = useState<CounterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch("/api/counter", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d: CounterData) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const count     = !loading && !error ? (data?.count ?? 0) : null;
  const lastVisit = !loading && !error ? (data?.lastVisit ?? null) : null;

  return (
    <div
      className="w-full font-mono text-[10px] tracking-widest border border-white/[0.07] rounded-sm bg-white/[0.03] divide-y divide-white/[0.06] overflow-hidden"
      aria-label="Site visit counter"
    >
      <div className="flex items-center justify-between px-3 py-[7px]">
        <span className="text-white/30 uppercase text-[9px]">VISITS</span>
        <span className={`tabular-nums text-white/70 transition-opacity duration-500 ${loading ? "animate-pulse text-white/20" : ""}`}>
          {count !== null ? `${formatCount(count)}` : "———,———"}
        </span>
      </div>
      <div className="flex items-center justify-between px-3 py-[7px]">
        <span className="text-white/30 uppercase text-[9px]">LAST VISIT</span>
        <span className={`text-white/50 text-[9px] transition-opacity duration-500 ${loading ? "animate-pulse text-white/20" : ""}`}>
          {lastVisit !== null ? formatLastVisit(lastVisit) : (loading ? "———" : "JUST NOW")}
        </span>
      </div>
    </div>
  );
}

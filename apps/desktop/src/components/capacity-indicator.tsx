import { useState, useEffect } from "react";

export interface RateLimitInfo {
  status: string;
  resetsAt: number;
  rateLimitType: string;
  overageStatus: string;
}

interface CapacityIndicatorProps {
  rateLimitInfo?: RateLimitInfo | null;
  compact?: boolean;
}

/** Promotion end: March 27, 2026 at midnight ET */
const PROMO_END = new Date("2026-03-27T00:00:00-04:00").getTime();

/**
 * Check if 2x capacity window is currently active.
 * Window: 8 AM - 2 PM ET daily (EDT in March = UTC-4).
 * 8 AM ET = 12:00 UTC, 2 PM ET = 18:00 UTC.
 */
function is2xWindowActive(): boolean {
  const now = Date.now();
  if (now >= PROMO_END) return false;
  const d = new Date(now);
  const utcHour = d.getUTCHours();
  const utcMin = d.getUTCMinutes();
  const utcTotalMin = utcHour * 60 + utcMin;
  // 8 AM ET (EDT) = 12:00 UTC = 720 min, 2 PM ET = 18:00 UTC = 1080 min
  return utcTotalMin >= 720 && utcTotalMin < 1080;
}

function formatTimeUntil(targetMs: number): string {
  const diff = targetMs - Date.now();
  if (diff <= 0) return "now";
  const totalMin = Math.floor(diff / 60000);
  if (totalMin < 1) return "<1m";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function CapacityIndicator({
  rateLimitInfo,
  compact = false,
}: CapacityIndicatorProps) {
  const [is2x, setIs2x] = useState(is2xWindowActive);
  const [, setTick] = useState(0);

  // Re-check every 60 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setIs2x(is2xWindowActive());
      setTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ─── Compact mode (sidebar, workspace toolbar) ─────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {is2x ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {"\u26A1"} 2x
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600" />
            Standard
          </span>
        )}
      </div>
    );
  }

  // ─── Full mode (chat input footer) ─────────────────────────────────────
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        {is2x ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {"\u26A1"} 2x Capacity
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600" />
            Standard
          </span>
        )}
      </div>
      {rateLimitInfo && rateLimitInfo.resetsAt > 0 ? (
        <span className="text-[9px] text-slate-600 pl-0.5">
          Resets in {formatTimeUntil(rateLimitInfo.resetsAt * 1000)}
        </span>
      ) : null}
    </div>
  );
}

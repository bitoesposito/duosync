import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/useI18n";
import type { TimelineSegment, TimelineSegmentCategory } from "@shared";

const COLOR: Record<TimelineSegmentCategory, string> = {
  sleep: "bg-sleep",
  other: "bg-other",
  available: "bg-available",
  match: "bg-match",
};

const HOURS = [0, 6, 12, 18, 24];

export function Timeline({ title, segments }: { title: string; segments: TimelineSegment[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="relative h-8 w-full overflow-hidden rounded-md border border-border bg-muted">
        {segments.map((s) => (
          <div
            key={s.id}
            className={cn("absolute top-0 h-full", COLOR[s.category])}
            style={{ left: `${s.left}%`, width: `${s.width}%` }}
            title={`${s.startTime}–${s.endTime}`}
          />
        ))}
      </div>
      <div className="relative h-3">
        {HOURS.map((h) => (
          <span
            key={h}
            className="absolute -translate-x-1/2 text-[10px] tabular-nums text-muted-foreground first:translate-x-0 last:-translate-x-full"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {String(h).padStart(2, "0")}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Legend() {
  const { t } = useI18n();
  const items: TimelineSegmentCategory[] = ["match", "available", "other", "sleep"];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5">
          <span className={cn("size-3 rounded-sm", COLOR[c])} />
          {t(`timeline.legend.${c}`)}
        </span>
      ))}
    </div>
  );
}

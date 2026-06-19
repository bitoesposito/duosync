import type { TimelineSegmentCategory } from "@shared";

type AvailabilityGridHeaderProps = {
  title: string;
  legendItems: { category: TimelineSegmentCategory; label: string }[];
  colorMap: Record<TimelineSegmentCategory, string>;
};

type LegendProps = {
  items: { category: TimelineSegmentCategory; label: string }[];
  colorMap: Record<TimelineSegmentCategory, string>;
};

function AvailabilityLegend({ items, colorMap }: LegendProps) {
  return (
    <ul className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
      {items.map((item) => (
        <li key={item.category} className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-sm border ${colorMap[item.category]}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function AvailabilityGridHeader({
  title,
  legendItems,
  colorMap,
}: AvailabilityGridHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between gap-4 select-none">
      <h3 className="text-lg font-medium tracking-tight">{title}</h3>
      <AvailabilityLegend items={legendItems} colorMap={colorMap} />
    </header>
  );
}

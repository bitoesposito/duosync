import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimelineSegment, TimelineSegmentCategory } from "@/types";

type TimelineBarProps = {
  segments: TimelineSegment[];
  colorMap: Record<TimelineSegmentCategory, string>;
  height?: string;
  borderStyle?: string;
  backgroundColor?: string;
  getCategoryLabel: (category: TimelineSegmentCategory) => string;
  showIcon?: boolean;
  icon?: React.ReactNode;
  emptyMessage?: string;
};

/**
 * Reusable timeline bar component that renders segments with popovers.
 */
export function TimelineBar({
  segments,
  colorMap,
  height = "h-14",
  borderStyle = "border-2",
  backgroundColor = "bg-muted/5",
  getCategoryLabel,
  showIcon = false,
  icon,
  emptyMessage,
}: TimelineBarProps) {
  const renderSegment = (segment: TimelineSegment) => {
    return (
      <Popover key={segment.id}>
        <PopoverTrigger asChild>
          <div
            className={`absolute h-full ${colorMap[segment.category]} transition-all hover:opacity-80 hover:scale-y-105 active:opacity-70 cursor-pointer`}
            style={{
              left: `${segment.left}%`,
              width: `${segment.width}%`,
              minWidth: "2px",
            }}
          />
        </PopoverTrigger>
        <PopoverContent className="rounded-none border-border w-auto p-3">
          <div className="space-y-1">
            {showIcon && icon && <div className="flex items-center gap-1.5">{icon}</div>}
            <p className="font-semibold text-sm">
              {segment.startTime} - {segment.endTime}
            </p>
            <p className="text-xs text-muted-foreground">
              {getCategoryLabel(segment.category)}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className={`relative w-full ${height} ${borderStyle} border-border rounded-sm ${backgroundColor} overflow-hidden`}>
      {segments.length > 0 ? (
        segments.map(renderSegment)
      ) : emptyMessage ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted-foreground/70">{emptyMessage}</p>
        </div>
      ) : null}
    </div>
  );
}


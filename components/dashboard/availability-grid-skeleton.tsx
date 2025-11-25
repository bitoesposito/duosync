import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for the availability grid.
 * Shows a placeholder timeline that matches the structure of AvailabilityGrid.
 */
export default function AvailabilityGridSkeleton() {
  return (
    <div className="relative w-full h-12 border border-border bg-muted/10">
      <div className="absolute inset-0 flex items-center gap-0">
        {/* Multiple segments to simulate a timeline */}
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            className="h-full flex-1 border-r border-background last:border-r-0"
          />
        ))}
      </div>
    </div>
  );
}



import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for the appointments list.
 * Shows placeholder items that match the structure of AppointmentsListItem.
 */
export default function AppointmentsListSkeleton() {
  return (
    <div className="grid gap-px bg-border border border-border">
      {[1, 2, 3].map((i) => (
        <article
          key={i}
          className="flex items-center justify-between gap-4 py-3 px-4 bg-background border-l-2 border-transparent"
        >
          <div className="flex items-baseline gap-4 min-w-0 flex-1">
            {/* Time skeleton */}
            <Skeleton className="h-4 w-20 shrink-0" />
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              {/* Category and description skeleton */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          {/* Remove button skeleton */}
          <Skeleton className="h-6 w-6 shrink-0 rounded-none" />
        </article>
      ))}
    </div>
  );
}



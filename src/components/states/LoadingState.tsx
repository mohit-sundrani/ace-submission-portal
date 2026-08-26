import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton list rows matching real content geometry (design.md §8). */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="w-full" role="status" aria-label="Loading">
            <div className="border-border bg-secondary border-b px-5 py-3">
                <Skeleton className="h-3 w-32" />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "border-border flex items-center gap-6 border-b px-5 py-4",
                        i === rows - 1 && "border-b-0"
                    )}
                >
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="ml-auto h-4 w-20" />
                </div>
            ))}
            <span className="sr-only">Loading content...</span>
        </div>
    );
}

export function PanelSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("panel p-6", className)} role="status" aria-label="Loading">
            <Skeleton className="h-5 w-48" />
            <div className="mt-6 space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-2/3" />
            </div>
            <span className="sr-only">Loading...</span>
        </div>
    );
}

export function StatSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div
            className="panel divide-border grid grid-cols-1 divide-y md:grid-cols-4 md:divide-x md:divide-y-0"
            role="status"
            aria-label="Loading stats"
        >
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="p-6">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-3 h-8 w-24" />
                </div>
            ))}
            <span className="sr-only">Loading...</span>
        </div>
    );
}

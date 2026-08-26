import { Skeleton } from "@/components/ui/skeleton";

/** Session-resolution loader - never flashes protected content before auth resolves. */
export function FullPageLoader() {
    return (
        <div className="flex min-h-dvh flex-col" role="status" aria-label="Loading application">
            <div className="border-border bg-card flex h-14 items-center border-b px-4">
                <Skeleton className="h-4 w-40" />
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 p-6 md:grid-cols-[240px_1fr]">
                <div className="hidden space-y-2 md:block">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-3/4" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
            <span className="sr-only">Loading...</span>
        </div>
    );
}

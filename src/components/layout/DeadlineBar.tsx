import { CalendarClock } from "lucide-react";
import { usePortalDeadline, type DeadlineStatus } from "@/hooks/usePortalDeadline";
import { cn } from "@/lib/utils";

function formatRemaining(remainingMs: number): string {
    const totalMinutes = Math.max(0, Math.floor(remainingMs / 60_000));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatDeadline(date: Date): string {
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

const barClasses: Record<DeadlineStatus, string> = {
    green: "bg-success/10 text-success border-success/30",
    yellow: "bg-warning/10 text-warning border-warning/30",
    red: "bg-error/10 text-error border-error/30",
};

const dotClasses: Record<DeadlineStatus, string> = {
    green: "bg-success",
    yellow: "bg-warning",
    red: "bg-error",
};

export function DeadlineBar() {
    const { deadline, remainingMs, status } = usePortalDeadline();

    if (!deadline || !status) return null;

    return (
        <div
            role="status"
            className={cn(
                "border-border flex items-center gap-2 border-b px-3 py-4 font-mono text-[0.6875rem] font-medium tracking-[0.05em] uppercase sm:px-4",
                barClasses[status]
            )}
        >
            <span className={cn("size-1.5 shrink-0 rounded-full", dotClasses[status])} aria-hidden="true" />
            <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
                Submissions close in <span className="font-bold">{formatRemaining(remainingMs ?? 0)}</span>
            </span>
            <span className="ml-auto hidden shrink-0 sm:inline" aria-label="Deadline date">
                {formatDeadline(deadline)}
            </span>
        </div>
    );
}

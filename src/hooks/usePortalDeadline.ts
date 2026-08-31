import * as React from "react";
import { submissionDeadline } from "@/lib/config";

export type DeadlineStatus = "green" | "yellow" | "red";

export interface PortalDeadline {
    /** ISO deadline parsed to a Date, or null when unset/invalid. */
    deadline: Date | null;
    /** Remaining time in milliseconds, or null when no deadline. */
    remainingMs: number | null;
    /** Status colors: >5 days = green, <=5 days = yellow, last day = red. */
    status: DeadlineStatus | null;
    /** True once the deadline has passed (portal closed). */
    closed: boolean;
}

function parseDeadline(): Date | null {
    if (!submissionDeadline) return null;
    const parsed = new Date(submissionDeadline);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** 1 day left */
const RED_THRESHOLD_MS = 1 * DAY_MS;
/** 5 days left */
const YELLOW_THRESHOLD_MS = 5 * DAY_MS;

function statusFor(remainingMs: number): DeadlineStatus {
    if (remainingMs <= RED_THRESHOLD_MS) return "red";
    if (remainingMs <= YELLOW_THRESHOLD_MS) return "yellow";
    return "green";
}

/**
 * Reads the portal submission deadline from VITE_SUBMISSION_DEADLINE and
 * recomputes remaining time every 30s so the bar stays current without a reload.
 */
export function usePortalDeadline(): PortalDeadline {
    const deadline = React.useMemo(parseDeadline, []);
    const [now, setNow] = React.useState<number>(() => Date.now());

    React.useEffect(() => {
        if (!deadline) return;
        const id = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(id);
    }, [deadline]);

    if (!deadline) return { deadline: null, remainingMs: null, status: null, closed: false };

    const remainingMs = deadline.getTime() - now;
    return {
        deadline,
        remainingMs,
        status: remainingMs > 0 ? statusFor(remainingMs) : null,
        closed: remainingMs <= 0,
    };
}

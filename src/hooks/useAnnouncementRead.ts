import * as React from "react";
import { useAuth } from "@/context/AuthContext";

export const ANNOUNCEMENT_READ_EVENT = "ace:announcements-read";

const STORAGE_PREFIX = "ace-read-announcements";

function storageKey(userId?: string): string {
    return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

export function loadReadAnnouncementIds(userId?: string): Set<string> {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed.map(String));
    } catch {
        // ignore malformed storage
    }
    return new Set();
}

function saveReadAnnouncementIds(ids: Set<string>, userId?: string): void {
    try {
        localStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
    } catch {
        // ignore storage failures (private mode / quota)
    }
}

function announceChange(): void {
    window.dispatchEvent(new Event(ANNOUNCEMENT_READ_EVENT));
}

export function useAnnouncementRead() {
    const { session } = useAuth();
    const userId = session?.user?.id;
    const [readIds, setReadIds] = React.useState<Set<string>>(() => loadReadAnnouncementIds(userId));

    React.useEffect(() => {
        setReadIds(loadReadAnnouncementIds(userId));
    }, [userId]);

    const markRead = React.useCallback(
        (id: string) => {
            setReadIds((prev) => {
                if (prev.has(id)) return prev;
                const next = new Set(prev);
                next.add(id);
                saveReadAnnouncementIds(next, userId);
                announceChange();
                return next;
            });
        },
        [userId]
    );

    const pruneRead = React.useCallback(
        (validIds: Set<string>) => {
            setReadIds((prev) => {
                let next: Set<string> | null = null;
                for (const id of prev) {
                    if (!validIds.has(id)) {
                        next = next ?? new Set(prev);
                        next.delete(id);
                    }
                }
                if (next) {
                    saveReadAnnouncementIds(next, userId);
                    announceChange();
                    return next;
                }
                return prev;
            });
        },
        [userId]
    );

    return { readIds, markRead, pruneRead };
}

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { loadReadAnnouncementIds, ANNOUNCEMENT_READ_EVENT } from "@/hooks/useAnnouncementRead";

export interface Counts {
    announcements: number;
}

export function useCounts(): Counts {
    const { session } = useAuth();
    const userId = session?.user?.id;
    const [counts, setCounts] = React.useState<Counts>({ announcements: 0 });

    React.useEffect(() => {
        let cancelled = false;

        async function fetchCounts() {
            const annRes = await supabase
                .from("announcements")
                .select("id", { count: "exact", head: true })
                .eq("is_visible", true);
            if (cancelled) return;
            const total = annRes.count ?? 0;
            const unread = Math.max(0, total - loadReadAnnouncementIds(userId).size);
            setCounts({ announcements: unread });
        }

        fetchCounts();
        window.addEventListener(ANNOUNCEMENT_READ_EVENT, fetchCounts);
        return () => {
            cancelled = true;
            window.removeEventListener(ANNOUNCEMENT_READ_EVENT, fetchCounts);
        };
    }, [userId]);

    return counts;
}

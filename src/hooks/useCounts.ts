import * as React from "react";
import { supabase } from "@/lib/supabase";

interface Counts {
    announcements: number;
    faqs: number;
}

export function useCounts(): Counts {
    const [counts, setCounts] = React.useState<Counts>({ announcements: 0, faqs: 0 });

    React.useEffect(() => {
        let cancelled = false;

        async function fetch() {
            const [annRes, faqRes] = await Promise.all([
                supabase.from("announcements").select("id", { count: "exact", head: true }).eq("is_visible", true),
                supabase.from("faqs").select("id", { count: "exact", head: true }).eq("is_visible", true),
            ]);
            if (!cancelled) {
                setCounts({
                    announcements: annRes.count ?? 0,
                    faqs: faqRes.count ?? 0,
                });
            }
        }

        fetch();
        return () => { cancelled = true; };
    }, []);

    return counts;
}

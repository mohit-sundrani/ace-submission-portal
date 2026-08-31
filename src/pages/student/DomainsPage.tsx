import { Layers } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Domain } from "@/lib/types";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/shared/PageHeader";
import { DomainCard } from "@/components/domains/DomainCard";
import { DeadlineBar } from "@/components/layout/DeadlineBar";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { PanelSkeleton } from "@/components/states/LoadingState";

interface DomainsData {
    domains: Domain[];
    counts: Record<string, number>;
}

async function fetchDomains(): Promise<DomainsData> {
    const [{ data: domains, error: dErr }, { data: tasks, error: tErr }] = await Promise.all([
        supabase
            .from("domains")
            .select("id, name, description, display_order, created_at, updated_at")
            .eq("is_visible", true)
            .order("display_order"),
        supabase.from("tasks").select("id, domain_id").eq("is_visible", true),
    ]);
    if (dErr) throw dErr;
    if (tErr) throw tErr;
    const counts: Record<string, number> = {};
    for (const t of tasks ?? []) counts[t.domain_id] = (counts[t.domain_id] ?? 0) + 1;
    return { domains: (domains as Domain[]) ?? [], counts };
}

export function DomainsPage() {
    const { data, loading, error, refetch } = useFetch(fetchDomains, []);

    return (
        <div>
            <DeadlineBar />
            <div className="page py-8">
                <PageHeader
                    title="Choose your domain"
                    description="Each domain holds a set of tasks of increasing difficulty. Pick one to see what’s waiting."
                />

                {loading && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <PanelSkeleton key={i} className="h-52" />
                        ))}
                    </div>
                )}

                {error && !loading && <ErrorState message={error} onRetry={refetch} />}

                {!loading && !error && data && data.domains.length === 0 && (
                    <div className="panel">
                        <EmptyState
                            icon={Layers}
                            eyebrow="Nothing here yet"
                            title="No domains available"
                            description="Domains will appear here as soon as your coordinators publish them. Check back shortly."
                        />
                    </div>
                )}

                {!loading && !error && data && data.domains.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.domains.map((domain) => (
                            <DomainCard key={domain.id} domain={domain} taskCount={data.counts[domain.id] ?? 0} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

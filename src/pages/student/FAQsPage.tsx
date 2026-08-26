import { HelpCircle, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { FAQ } from "@/lib/types";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/shared/PageHeader";
import { Markdown } from "@/components/shared/Markdown";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { PanelSkeleton } from "@/components/states/LoadingState";
import { cn } from "@/lib/utils";
import * as React from "react";

async function fetchFAQs(): Promise<FAQ[]> {
    const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, display_order")
        .eq("is_visible", true)
        .order("display_order");
    if (error) throw error;
    return (data as FAQ[]) ?? [];
}

export function FAQsPage() {
    const { data, loading, error, refetch } = useFetch(fetchFAQs, []);
    const [openId, setOpenId] = React.useState<string | null>(null);

    const faqs = data ?? [];

    return (
        <div className="page py-8">
            <PageHeader title="FAQs" description="Quick answers to the most common questions." />

            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <PanelSkeleton key={i} className="h-16" />
                    ))}
                </div>
            )}

            {error && !loading && <ErrorState message={error} onRetry={refetch} />}

            {!loading && !error && faqs.length === 0 && (
                <div className="panel">
                    <EmptyState
                        icon={HelpCircle}
                        eyebrow="Nothing here yet"
                        title="No FAQs available"
                        description="Frequently asked questions will appear here once they're published."
                    />
                </div>
            )}

            {!loading && !error && faqs.length > 0 && (
                <div className="divide-border panel divide-y overflow-hidden">
                    {faqs.map((faq) => {
                        const isOpen = openId === faq.id;
                        return (
                            <div key={faq.id}>
                                <button
                                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                                    className="hover:bg-secondary/60 flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors"
                                >
                                    <span className="text-foreground text-sm font-medium">{faq.question}</span>
                                    <ChevronDown
                                        className={cn(
                                            "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
                                            isOpen && "rotate-180"
                                        )}
                                        aria-hidden="true"
                                    />
                                </button>
                                {isOpen && (
                                    <div className="border-border border-t px-5 py-4">
                                        <Markdown content={faq.answer} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

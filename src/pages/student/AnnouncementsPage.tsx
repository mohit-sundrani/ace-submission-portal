import { Megaphone, Pin, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/lib/types";
import { useFetch } from "@/hooks/useFetch";
import { useAnnouncementRead } from "@/hooks/useAnnouncementRead";
import { PageHeader } from "@/components/shared/PageHeader";
import { Markdown } from "@/components/shared/Markdown";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { PanelSkeleton } from "@/components/states/LoadingState";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import * as React from "react";

async function fetchAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, is_pinned, created_at")
        .eq("is_visible", true)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Announcement[]) ?? [];
}

export function AnnouncementsPage() {
    const { data, loading, error, refetch } = useFetch(fetchAnnouncements, []);
    const [expanded, setExpanded] = React.useState<string | null>(null);
    const { markRead, pruneRead } = useAnnouncementRead();

    const announcements = data ?? [];

    React.useEffect(() => {
        pruneRead(new Set(announcements.map((a) => a.id)));
    }, [announcements, pruneRead]);

    return (
        <div className="page py-8">
            <PageHeader
                title="Announcements"
                description="Stay updated with the latest news and important information."
            />

            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <PanelSkeleton key={i} className="h-24" />
                    ))}
                </div>
            )}

            {error && !loading && <ErrorState message={error} onRetry={refetch} />}

            {!loading && !error && announcements.length === 0 && (
                <div className="panel">
                    <EmptyState
                        icon={Megaphone}
                        eyebrow="All quiet"
                        title="No announcements yet"
                        description="When there's something important to share, you'll find it here."
                    />
                </div>
            )}

            {!loading && !error && announcements.length > 0 && (
                <div className="space-y-3">
                    {announcements.map((a) => (
                        <div key={a.id} className="panel overflow-hidden">
                            <button
                                type="button"
                                onClick={() => {
                                    const isExpanded = expanded === a.id;
                                    setExpanded(isExpanded ? null : a.id);
                                    if (!isExpanded) markRead(a.id);
                                }}
                                aria-expanded={expanded === a.id}
                                aria-controls={`announcement-${a.id}`}
                                className="hover:bg-secondary/60 flex w-full items-center gap-3 px-5 py-4 text-left transition-colors"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        {a.is_pinned && (
                                            <Pin className="text-electric size-3.5 shrink-0" aria-label="Pinned" />
                                        )}
                                        <span className="text-foreground text-sm font-medium">{a.title}</span>
                                        {a.is_pinned && (
                                            <Badge variant="primary" className="text-[0.625rem]">
                                                Pinned
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-muted-foreground mt-1 block font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                                        {formatRelativeTime(a.created_at)}
                                    </span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
                                        expanded === a.id && "rotate-180"
                                    )}
                                    aria-hidden="true"
                                />
                            </button>
                            {expanded === a.id && (
                                <div id={`announcement-${a.id}`} className="border-border border-t px-5 py-4">
                                    <Markdown content={a.content} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

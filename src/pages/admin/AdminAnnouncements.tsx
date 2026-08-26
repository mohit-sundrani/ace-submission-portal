import * as React from "react";
import { toast } from "sonner";
import { Megaphone, Pin, Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/lib/types";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/shared/PageHeader";
import { Markdown } from "@/components/shared/Markdown";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { TableSkeleton } from "@/components/states/LoadingState";
import { AnnouncementFormDialog } from "@/components/admin/AnnouncementFormDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatRelativeTime } from "@/lib/utils";

async function fetchAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Announcement[]) ?? [];
}

export function AdminAnnouncements() {
    const { data, loading, error, refetch } = useFetch(fetchAnnouncements, []);
    const [formOpen, setFormOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<Announcement | null>(null);
    const [deleting, setDeleting] = React.useState<Announcement | null>(null);
    const [deleteBusy, setDeleteBusy] = React.useState(false);
    const [expanded, setExpanded] = React.useState<string | null>(null);

    const announcements = data ?? [];

    const toggleVisibility = async (a: Announcement) => {
        const { error } = await supabase.from("announcements").update({ is_visible: !a.is_visible }).eq("id", a.id);
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success(a.is_visible ? "Announcement hidden" : "Announcement is now visible");
        refetch();
    };

    const togglePin = async (a: Announcement) => {
        const { error } = await supabase.from("announcements").update({ is_pinned: !a.is_pinned }).eq("id", a.id);
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success(a.is_pinned ? "Unpinned" : "Pinned to top");
        refetch();
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setDeleteBusy(true);
        try {
            const { error } = await supabase.from("announcements").delete().eq("id", deleting.id);
            if (error) throw error;
            toast.success("Announcement deleted");
            setDeleting(null);
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete the announcement.");
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <div className="page py-8">
            <PageHeader
                title="Announcements"
                description="Create and manage announcements visible to students."
                actions={
                    <Button
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        New announcement
                    </Button>
                }
            />

            {loading && <TableSkeleton rows={3} />}
            {error && !loading && <ErrorState message={error} onRetry={refetch} />}

            {!loading && !error && announcements.length === 0 && (
                <div className="panel">
                    <EmptyState
                        icon={Megaphone}
                        eyebrow="No announcements"
                        title="Create your first announcement"
                        description="Announcements let you broadcast important updates to all students."
                        action={
                            <Button
                                onClick={() => {
                                    setEditing(null);
                                    setFormOpen(true);
                                }}
                            >
                                Create announcement
                            </Button>
                        }
                    />
                </div>
            )}

            {!loading && !error && announcements.length > 0 && (
                <div className="space-y-3">
                    {announcements.map((a) => (
                        <div key={a.id} className="panel overflow-hidden">
                            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        {a.is_pinned && (
                                            <Pin className="text-electric size-3.5 shrink-0" aria-label="Pinned" />
                                        )}
                                        <button
                                            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                                            className="text-foreground hover:text-electric text-left text-sm font-medium"
                                        >
                                            {a.title}
                                        </button>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                                            {formatRelativeTime(a.created_at)}
                                        </span>
                                        <Badge variant={a.is_visible ? "success" : "neutral"}>
                                            {a.is_visible ? "Visible" : "Hidden"}
                                        </Badge>
                                        {a.is_pinned && <Badge variant="primary">Pinned</Badge>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => togglePin(a)}
                                        className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-electric rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                        aria-label={a.is_pinned ? `Unpin "${a.title}"` : `Pin "${a.title}"`}
                                    >
                                        <Pin className="size-4" aria-hidden="true" />
                                    </button>
                                    <Switch
                                        checked={a.is_visible}
                                        onCheckedChange={() => toggleVisibility(a)}
                                        aria-label={`Toggle visibility for "${a.title}"`}
                                    />
                                    <button
                                        onClick={() => {
                                            setEditing(a);
                                            setFormOpen(true);
                                        }}
                                        className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-electric rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                        aria-label={`Edit "${a.title}"`}
                                    >
                                        <Pencil className="size-4" aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={() => setDeleting(a)}
                                        className="text-muted-foreground hover:bg-error/10 hover:text-error focus-visible:ring-error rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                        aria-label={`Delete "${a.title}"`}
                                    >
                                        <Trash2 className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                            {expanded === a.id && (
                                <div className="border-border border-t px-5 py-4">
                                    <Markdown content={a.content} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <AnnouncementFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                announcement={editing}
                onSaved={refetch}
            />

            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(o) => !o && setDeleting(null)}
                title="Delete announcement?"
                description={`"${deleting?.title}" will be permanently removed.`}
                confirmLabel="Delete announcement"
                onConfirm={handleDelete}
                loading={deleteBusy}
            />
        </div>
    );
}

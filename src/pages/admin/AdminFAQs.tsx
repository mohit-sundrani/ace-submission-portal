import * as React from "react";
import { toast } from "sonner";
import { HelpCircle, GripVertical, ArrowUp, ArrowDown, Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { FAQ } from "@/lib/types";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/shared/PageHeader";
import { Markdown } from "@/components/shared/Markdown";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { TableSkeleton } from "@/components/states/LoadingState";
import { FAQFormDialog } from "@/components/admin/FAQFormDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatRelativeTime } from "@/lib/utils";

async function fetchFAQs(): Promise<FAQ[]> {
    const { data, error } = await supabase.from("faqs").select("*").order("display_order");
    if (error) throw error;
    return (data as FAQ[]) ?? [];
}

export function AdminFAQs() {
    const { data, loading, error, refetch } = useFetch(fetchFAQs, []);
    const [formOpen, setFormOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<FAQ | null>(null);
    const [deleting, setDeleting] = React.useState<FAQ | null>(null);
    const [deleteBusy, setDeleteBusy] = React.useState(false);
    const [reorderBusy, setReorderBusy] = React.useState(false);
    const [expanded, setExpanded] = React.useState<string | null>(null);

    const faqs = data ?? [];

    const toggleVisibility = async (faq: FAQ) => {
        const { error } = await supabase.from("faqs").update({ is_visible: !faq.is_visible }).eq("id", faq.id);
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success(faq.is_visible ? "FAQ hidden" : "FAQ is now visible");
        refetch();
    };

    const move = async (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= faqs.length || reorderBusy) return;
        setReorderBusy(true);
        const a = faqs[index];
        const b = faqs[target];
        try {
            await Promise.all([
                supabase.from("faqs").update({ display_order: b.display_order }).eq("id", a.id),
                supabase.from("faqs").update({ display_order: a.display_order }).eq("id", b.id),
            ]);
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Reordering failed.");
        } finally {
            setReorderBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setDeleteBusy(true);
        try {
            const { error } = await supabase.from("faqs").delete().eq("id", deleting.id);
            if (error) throw error;
            toast.success("FAQ deleted");
            setDeleting(null);
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete the FAQ.");
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <div className="page py-8">
            <PageHeader
                title="FAQs"
                description="Manage frequently asked questions shown to students."
                actions={
                    <Button
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        New FAQ
                    </Button>
                }
            />

            {loading && <TableSkeleton rows={4} />}
            {error && !loading && <ErrorState message={error} onRetry={refetch} />}

            {!loading && !error && faqs.length === 0 && (
                <div className="panel">
                    <EmptyState
                        icon={HelpCircle}
                        eyebrow="No FAQs"
                        title="Create your first FAQ"
                        description="FAQs help students find quick answers to common questions."
                        action={
                            <Button
                                onClick={() => {
                                    setEditing(null);
                                    setFormOpen(true);
                                }}
                            >
                                Create FAQ
                            </Button>
                        }
                    />
                </div>
            )}

            {!loading && !error && faqs.length > 0 && (
                <div className="panel overflow-hidden">
                    <div className="border-border bg-secondary hidden grid-cols-[1fr_80px_110px_140px_80px] gap-4 border-b px-5 py-3 md:grid">
                        <span className="eyebrow">Question</span>
                        <span className="eyebrow">Order</span>
                        <span className="eyebrow">Visibility</span>
                        <span className="eyebrow">Updated</span>
                        <span className="eyebrow text-right">Actions</span>
                    </div>
                    <ul className="divide-border divide-y">
                        {faqs.map((faq, i) => (
                            <li
                                key={faq.id}
                                className="group hover:bg-secondary/60 flex flex-col gap-3 px-5 py-4 transition-colors duration-150 md:flex-row md:items-center md:gap-4"
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <GripVertical
                                        className="text-muted-foreground/50 hidden size-4 shrink-0 md:block"
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0">
                                        <button
                                            onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
                                            className="text-foreground hover:text-electric text-left text-sm font-medium"
                                        >
                                            {faq.question}
                                        </button>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Badge variant={faq.is_visible ? "success" : "neutral"}>
                                                {faq.is_visible ? "Visible" : "Hidden"}
                                            </Badge>
                                            <span className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em]">
                                                {formatRelativeTime(faq.updated_at)}
                                            </span>
                                        </div>
                                        {expanded === faq.id && (
                                            <div className="mt-3 max-w-prose">
                                                <Markdown content={faq.answer} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden items-center gap-4 md:flex md:w-[80px]">
                                    <span className="text-muted-foreground font-mono text-sm">{faq.display_order}</span>
                                </div>

                                <div className="flex items-center gap-3 md:w-[110px]">
                                    <Switch
                                        checked={faq.is_visible}
                                        onCheckedChange={() => toggleVisibility(faq)}
                                        aria-label={`Toggle visibility for "${faq.question}"`}
                                    />
                                </div>

                                <div className="hidden md:block md:w-[140px]">
                                    <span className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                                        {formatRelativeTime(faq.updated_at)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 md:w-[80px] md:justify-end">
                                    <button
                                        onClick={() => move(i, -1)}
                                        disabled={i === 0 || reorderBusy}
                                        className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-electric rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
                                        aria-label={`Move "${faq.question}" up`}
                                    >
                                        <ArrowUp className="size-4" aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={() => move(i, 1)}
                                        disabled={i === faqs.length - 1 || reorderBusy}
                                        className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-electric rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
                                        aria-label={`Move "${faq.question}" down`}
                                    >
                                        <ArrowDown className="size-4" aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditing(faq);
                                            setFormOpen(true);
                                        }}
                                        className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-electric rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                        aria-label={`Edit "${faq.question}"`}
                                    >
                                        <Pencil className="size-4" aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={() => setDeleting(faq)}
                                        className="text-muted-foreground hover:bg-error/10 hover:text-error focus-visible:ring-error rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                        aria-label={`Delete "${faq.question}"`}
                                    >
                                        <Trash2 className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <FAQFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                faq={editing}
                defaultOrder={faqs.length > 0 ? faqs[faqs.length - 1].display_order + 1 : 1}
                onSaved={refetch}
            />

            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(o) => !o && setDeleting(null)}
                title="Delete FAQ?"
                description={`"${deleting?.question}" will be permanently removed.`}
                confirmLabel="Delete FAQ"
                onConfirm={handleDelete}
                loading={deleteBusy}
            />
        </div>
    );
}

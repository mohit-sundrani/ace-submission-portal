import * as React from "react";
import { ExternalLink, FileText, Save } from "lucide-react";
import type { ReviewSubmissionView } from "@/hooks/useAdminReviewData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTime } from "@/lib/utils";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";

interface SubmissionReviewCardProps {
    submission: ReviewSubmissionView;
    /** Reviews page: allow toggling "selected for interview" + editing notes. */
    editable?: boolean;
    pdfUrl?: string | null;
    onSelectedChange?: (selected: boolean) => Promise<void>;
    onNotesSave?: (notes: string) => Promise<void>;
}

/**
 * One submission rendered for admin review - the equivalent of the old
 * Dashboard/Report "User Submissions" cards, restyled in the portal's design
 * system (bordered mini-panel, mono metadata, semantic badges).
 */
export function SubmissionReviewCard({
    submission,
    editable = false,
    pdfUrl,
    onSelectedChange,
    onNotesSave,
}: SubmissionReviewCardProps) {
    const [notes, setNotes] = React.useState(submission.admin_notes ?? "");
    const [busy, setBusy] = React.useState(false);

    const saved = submission.admin_notes ?? "";
    const dirty = notes !== saved;

    const handleSelected = async (checked: boolean) => {
        if (!onSelectedChange) return;
        setBusy(true);
        try {
            await onSelectedChange(checked);
        } finally {
            setBusy(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!onNotesSave) return;
        setBusy(true);
        try {
            await onNotesSave(notes);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className={cn(
                "border-border rounded-sm border p-4",
                editable && "hover:border-muted-foreground/40 transition-colors duration-150"
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-foreground text-sm font-medium">{submission.task_name}</p>
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                        <Badge variant="neutral">{submission.domain_name}</Badge>
                        <DifficultyBadge difficulty={submission.difficulty} />
                        <span>{formatDateTime(submission.submitted_at)}</span>
                        {submission.status === "failed" && <Badge variant="error">Failed</Badge>}
                    </p>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm">
                            <FileText className="size-4" aria-hidden="true" />
                            View PDF
                        </Button>
                    </a>
                )}
                {submission.links.map((link, i) => (
                    <a key={link} href={link} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" className="max-w-[280px]">
                            <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                            <span className="truncate font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                                Link {i + 1}
                            </span>
                        </Button>
                    </a>
                ))}
                {!pdfUrl && submission.links.length === 0 && (
                    <span className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                        No attachment
                    </span>
                )}
            </div>

            {editable && (
                <div className="border-border mt-4 space-y-3 border-t pt-3">
                    <label className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                            checked={submission.selected_for_interview}
                            onCheckedChange={(v) => handleSelected(v === true)}
                            disabled={busy}
                        />
                        <span
                            className={cn(
                                "text-sm font-medium",
                                submission.selected_for_interview ? "text-success" : "text-foreground"
                            )}
                        >
                            {submission.selected_for_interview
                                ? "Selected for interview"
                                : "Not selected for interview"}
                        </span>
                    </label>

                    <div className="space-y-1.5">
                        <Textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={busy}
                            placeholder="Add notes for this submission..."
                        />
                        {dirty && (
                            <Button size="sm" onClick={handleSaveNotes} disabled={busy} loading={busy}>
                                <Save className="size-4" aria-hidden="true" />
                                Save note
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

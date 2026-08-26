import * as React from "react";
import { toast } from "sonner";
import { CloudUpload, CheckCircle2, FileText, Link2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Task, Submission } from "@/lib/types";
import { PdfUpload } from "./PdfUpload";
import { LinkInput } from "./LinkInput";
import { uploadPdfWithProgress } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type Phase = "idle" | "uploading" | "submitting" | "done" | "failed";

interface SubmissionPanelProps {
    task: Task;
    existing: Submission | null;
    onSuccess: (sub: Submission) => void;
}

export function SubmissionPanel({ task, existing, onSuccess }: SubmissionPanelProps) {
    const { profile } = useAuth();
    const [phase, setPhase] = React.useState<Phase>(existing ? "done" : "idle");
    const [lastSubmission, setLastSubmission] = React.useState<Submission | null>(existing);
    const [pdf, setPdf] = React.useState<File | null>(null);
    const [links, setLinks] = React.useState<string[]>(existing?.links ?? []);
    const [progress, setProgress] = React.useState<number | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const needsPdf = task.submission_type === "pdf" || task.submission_type === "pdf_link";
    const needsLinks = task.submission_type === "link" || task.submission_type === "pdf_link";
    const canSubmit =
        phase === "idle" &&
        (needsPdf && needsLinks
            ? pdf !== null || links.length > 0
            : (!needsPdf || pdf !== null) && (!needsLinks || links.length > 0));

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setError(null);
        setPhase("uploading");

        let pdfRef: string | null = null;
        try {
            if (needsPdf && pdf) {
                const result = await uploadPdfWithProgress(pdf, task.id, setProgress);
                pdfRef = result.path;
            }

            setPhase("submitting");
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("Your session expired. Please sign in again.");

            const { data, error } = await supabase
                .from("submissions")
                .insert({
                    student_id: user.id,
                    task_id: task.id,
                    domain_id: task.domain_id,
                    submission_type: task.submission_type,
                    pdf_reference: pdfRef,
                    links,
                })
                .select()
                .single();

            if (error) throw error;

            setPhase("done");
            setLastSubmission(data as Submission);
            toast.success("Submission received");
            onSuccess(data as Submission);
        } catch (err) {
            setPhase("failed");
            setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
            toast.error(err instanceof Error ? err.message : "Submission failed. Please try again.");
        }
    };

    // ── Done state ──────────────────────────────────────────────────────────────
    if (phase === "done" && lastSubmission) {
        return (
            <div className="border-success/30 bg-success/5 rounded-sm border p-6" role="status">
                <div className="flex flex-col items-center gap-2 text-center">
                    <CheckCircle2 className="text-success size-8" aria-hidden="true" />
                    <div className="flex flex-col items-center gap-2">
                        <h3 className="font-heading text-foreground text-base font-medium">Submission confirmed</h3>
                        <span className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                            {new Date(lastSubmission.submitted_at).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-muted-foreground max-w-md text-sm text-pretty">
                        Your work was recorded for <span className="text-foreground font-medium">{task.name}</span>. You
                        can resubmit if the task allows it - your latest submission is the one on record.
                    </p>
                    {lastSubmission.links.length > 0 && (
                        <ul className="mt-2 flex flex-wrap items-center justify-center gap-2">
                            {lastSubmission.links.slice(0, 3).map((l, i) => (
                                <li key={l}>
                                    <a
                                        href={l}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-border bg-card text-muted-foreground hover:text-electric inline-flex max-w-[220px] items-center gap-1 truncate rounded-sm border px-2 py-1 font-mono text-[0.625rem] tracking-[0.05em] uppercase"
                                    >
                                        <Link2 className="size-3 shrink-0" aria-hidden="true" />
                                        <span className="truncate">link {i + 1}</span>
                                    </a>
                                </li>
                            ))}
                            {lastSubmission.links.length > 3 && (
                                <li className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                                    +{lastSubmission.links.length - 3} more
                                </li>
                            )}
                        </ul>
                    )}
                    {task.allows_resubmission && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-4"
                            onClick={() => {
                                setPhase("idle");
                                setPdf(null);
                                setLinks([]);
                            }}
                        >
                            <RefreshCw className="size-4" aria-hidden="true" />
                            Resubmit
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    const busy = phase === "uploading" || phase === "submitting";

    return (
        <div className="space-y-5">
            {needsPdf && (
                <div>
                    <p className="eyebrow mb-2 flex items-center gap-1.5">
                        <FileText className="size-3.5" aria-hidden="true" />
                        PDF submission
                    </p>
                    <PdfUpload
                        value={pdf}
                        onChange={(f) => {
                            setPdf(f);
                            setError(null);
                            if (phase === "failed") setPhase("idle");
                        }}
                        progress={phase === "uploading" ? progress : null}
                        disabled={busy}
                        error={phase === "failed" && needsPdf && !pdf ? error : null}
                    />
                </div>
            )}

            {needsLinks && (
                <div>
                    <p className="eyebrow mb-2 flex items-center gap-1.5">
                        <Link2 className="size-3.5" aria-hidden="true" />
                        Links
                    </p>
                    <LinkInput
                        links={links}
                        onChange={(next) => {
                            setLinks(next);
                            setError(null);
                            if (phase === "failed") setPhase("idle");
                        }}
                        disabled={busy}
                    />
                </div>
            )}

            {phase === "failed" && error && (
                <div
                    className="border-error/30 bg-error/5 flex items-center gap-3 rounded-sm border px-4 py-3"
                    role="alert"
                >
                    <span className="text-error" aria-hidden="true">
                        ●
                    </span>
                    <p className="text-error flex-1 text-sm">{error}</p>
                    <Button variant="secondary" size="sm" onClick={() => setPhase("idle")}>
                        Retry
                    </Button>
                </div>
            )}

            <div className="border-border flex items-center justify-between gap-4 border-t pt-5">
                <p className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                    {profile?.full_name ? `Submitting as ${profile.full_name}` : "Ready to submit"}
                </p>
                <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || busy}
                    loading={busy}
                    className={cn(phase === "failed" && "bg-error")}
                >
                    <CloudUpload className="size-4" aria-hidden="true" />
                    {phase === "uploading"
                        ? "Uploading PDF..."
                        : phase === "submitting"
                          ? "Submitting..."
                          : phase === "failed"
                            ? "Try again"
                            : "Submit work"}
                </Button>
            </div>
        </div>
    );
}

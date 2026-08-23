import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Repeat2, FileText, Link2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Domain, Task, Submission } from "@/lib/types";
import { useFetch } from "@/hooks/useFetch";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";
import { SubmissionStatusBadge } from "@/components/shared/SubmissionStatusBadge";
import { SubmissionPanel } from "@/components/submission/SubmissionPanel";
import { ErrorState } from "@/components/states/ErrorState";
import { PanelSkeleton } from "@/components/states/LoadingState";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Markdown } from "@/components/shared/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBMISSION_TYPE_META } from "@/lib/difficulty";

interface TaskDetailData {
    domain: Domain;
    task: Task;
    submission: Submission | null;
}

async function fetchTaskDetail(domainId: string, taskId: string): Promise<TaskDetailData> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Your session expired. Please sign in again.");

    const [domainRes, taskRes, subRes] = await Promise.all([
        supabase.from("domains").select("*").eq("id", domainId).eq("is_visible", true).maybeSingle(),
        supabase.from("tasks").select("*").eq("id", taskId).eq("is_visible", true).maybeSingle(),
        supabase.from("submissions").select("*").eq("task_id", taskId).eq("student_id", user.id).maybeSingle(),
    ]);

    if (domainRes.error) throw domainRes.error;
    if (taskRes.error) throw taskRes.error;
    if (subRes.error) throw subRes.error;
    if (!domainRes.data) throw new Error("That domain is no longer available.");
    if (!taskRes.data || taskRes.data.domain_id !== domainId) throw new Error("That task is no longer available.");

    return {
        domain: domainRes.data as Domain,
        task: taskRes.data as Task,
        submission: (subRes.data as Submission | null) ?? null,
    };
}

export function TaskDetailPage() {
    const { domainId = "", taskId = "" } = useParams();
    const navigate = useNavigate();
    const { data, loading, error, refetch } = useFetch(() => fetchTaskDetail(domainId, taskId), [domainId, taskId]);

    if (loading || !data) {
        return (
            <div className="page py-8">
                <PanelSkeleton className="mb-6 h-20" />
                <PanelSkeleton className="h-72" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="page py-8">
                <ErrorState message={error} onRetry={refetch} />
            </div>
        );
    }

    const { domain, task, submission } = data;
    const meta = SUBMISSION_TYPE_META[task.submission_type];

    return (
        <div className="page py-8">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/app/domains/${domain.id}`)}
                className="mb-3 -ml-2"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {domain.name}
            </Button>
            <Breadcrumbs
                items={[
                    { label: "Student", to: "/app/domains" },
                    { label: "Domains", to: "/app/domains" },
                    { label: domain.name, to: `/app/domains/${domain.id}` },
                    { label: task.name },
                ]}
            />

            <div className="mt-3 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-heading text-foreground text-2xl leading-snug font-medium tracking-tight text-balance sm:text-3xl">
                        {task.name}
                    </h1>
                    <DifficultyBadge difficulty={task.difficulty} />
                </div>
                <SubmissionStatusBadge status={submission ? "submitted" : "not_submitted"} />
            </div>

            <div className="border-border mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b pb-4">
                <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-medium tracking-[0.05em] uppercase">
                    <FileText className="size-3.5" aria-hidden="true" />
                    {meta.label}
                </span>
                <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-medium tracking-[0.05em] uppercase">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {task.allows_resubmission ? "Resubmission allowed" : "Single submission"}
                </span>
                {task.allows_resubmission && (
                    <Badge variant="warning" className="gap-1.5">
                        <Repeat2 className="size-3" aria-hidden="true" />
                        Resubmission allowed
                    </Badge>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                {/* Instructions */}
                <div className="space-y-6">
                    {task.description && (
                        <section className="panel p-5 sm:p-6">
                            <h2 className="eyebrow mb-3">About this task</h2>
                            <Markdown content={task.description} />
                        </section>
                    )}

                    <section className="panel p-5 sm:p-6">
                        <h2 className="eyebrow mb-4">Instructions</h2>
                        {task.instructions ? (
                            <Markdown content={task.instructions} />
                        ) : (
                            <p className="text-muted-foreground text-sm">No additional instructions for this task.</p>
                        )}
                    </section>
                </div>

                {/* Submission */}
                <div className="space-y-6">
                    <section className="panel p-5 sm:p-6">
                        <h2 className="eyebrow mb-4">Submit your work</h2>
                        <SubmissionPanel task={task} existing={submission} onSuccess={() => refetch()} />
                    </section>

                    <section className="panel p-5 sm:p-6">
                        <h2 className="eyebrow mb-3">Requirements</h2>
                        <ul className="space-y-2.5">
                            {(task.submission_type === "pdf" || task.submission_type === "pdf_link") && (
                                <li className="text-muted-foreground flex items-start gap-2.5 text-sm">
                                    <FileText className="text-electric mt-0.5 size-4 shrink-0" aria-hidden="true" />A
                                    single PDF of your work, stored privately.
                                </li>
                            )}
                            {(task.submission_type === "link" || task.submission_type === "pdf_link") && (
                                <li className="text-muted-foreground flex items-start gap-2.5 text-sm">
                                    <Link2 className="text-electric mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    One or more links - repository, prototype, demo, or live site.
                                </li>
                            )}
                            <li className="text-muted-foreground flex items-start gap-2.5 text-sm">
                                <Clock className="text-electric mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                {task.allows_resubmission
                                    ? "You may resubmit - your latest submission counts."
                                    : "Each task accepts a single submission."}
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}

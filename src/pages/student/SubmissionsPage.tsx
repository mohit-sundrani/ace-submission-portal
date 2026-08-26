import { Link } from "react-router-dom";
import { Send, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Submission } from "@/lib/types";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/shared/PageHeader";
import { SubmissionStatusBadge } from "@/components/shared/SubmissionStatusBadge";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { PanelSkeleton } from "@/components/states/LoadingState";
import { SUBMISSION_TYPE_META } from "@/lib/difficulty";

interface SubmissionView {
    submission: Submission;
    task_name: string;
    domain_name: string;
    domain_id: string;
}

async function fetchSubmissions(): Promise<SubmissionView[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Your session expired. Please sign in again.");

    const [subsRes, tasksRes, domainsRes] = await Promise.all([
        supabase.from("submissions").select("*").eq("student_id", user.id).order("submitted_at", { ascending: false }),
        supabase.from("tasks").select("id, domain_id, name").order("display_order"),
        supabase.from("domains").select("id, name").order("display_order"),
    ]);

    if (subsRes.error) throw subsRes.error;
    if (tasksRes.error) throw tasksRes.error;
    if (domainsRes.error) throw domainsRes.error;

    const taskMap = new Map<string, { domain_id: string; name: string }>(
        ((tasksRes.data as { id: string; domain_id: string; name: string }[]) ?? []).map((t) => [t.id, t])
    );
    const domainMap = new Map<string, string>(
        ((domainsRes.data as { id: string; name: string }[]) ?? []).map((d) => [d.id, d.name])
    );

    return ((subsRes.data as Submission[]) ?? []).map((s) => {
        const task = taskMap.get(s.task_id);
        return {
            submission: s,
            task_name: task?.name ?? "Deleted task",
            domain_name: domainMap.get(task?.domain_id ?? s.domain_id) ?? "Deleted domain",
            domain_id: task?.domain_id ?? s.domain_id,
        };
    });
}

export function SubmissionsPage() {
    const { data, loading, error, refetch } = useFetch(fetchSubmissions, []);

    return (
        <div className="page py-8">
            <PageHeader title="My Submissions" description="A summary of all your submissions across every domain." />

            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <PanelSkeleton key={i} className="h-20" />
                    ))}
                </div>
            )}

            {error && !loading && <ErrorState message={error} onRetry={refetch} />}

            {!loading && !error && data && data.length === 0 && (
                <div className="panel">
                    <EmptyState
                        icon={Send}
                        eyebrow="Nothing here yet"
                        title="No submissions yet"
                        description="Your submissions will appear here once you start working on tasks."
                    />
                </div>
            )}

            {!loading && !error && data && data.length > 0 && (
                <div className="border-border panel overflow-hidden">
                    <div className="border-border flex items-center border-b px-5 py-3">
                        <p className="eyebrow">All Submissions</p>
                    </div>
                    {data.map(({ submission, task_name, domain_name, domain_id }) => {
                        const meta = SUBMISSION_TYPE_META[submission.submission_type];
                        return (
                            <Link
                                key={submission.id}
                                to={`/app/domains/${domain_id}/tasks/${submission.task_id}`}
                                className="border-border hover:bg-secondary/50 flex flex-col gap-3 border-b px-5 py-4 transition-colors last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground truncate text-sm font-medium">{task_name}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="text-muted-foreground font-mono text-[0.625rem] font-medium tracking-[0.05em] uppercase">
                                            {domain_name}
                                        </span>
                                        <span className="text-muted-foreground font-mono text-[0.625rem] font-medium tracking-[0.05em] uppercase">
                                            {meta.short}
                                        </span>
                                        {submission.links?.length > 0 && (
                                            <span className="text-muted-foreground inline-flex items-center gap-1 font-mono text-[0.625rem] font-medium tracking-[0.05em] uppercase">
                                                <ExternalLink className="size-3" aria-hidden="true" />
                                                {submission.links.length}{" "}
                                                {submission.links.length === 1 ? "link" : "links"}
                                            </span>
                                        )}
                                        <span className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.03em]">
                                            {new Date(submission.submitted_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <SubmissionStatusBadge status={submission.status} />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

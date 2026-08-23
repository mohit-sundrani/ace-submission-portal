import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Domain, Task } from "@/lib/types";
import { useFetch } from "@/hooks/useFetch";
import { TaskCard } from "@/components/tasks/TaskCard";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { PanelSkeleton } from "@/components/states/LoadingState";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Markdown } from "@/components/shared/Markdown";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SubmissionStatus } from "@/components/shared/SubmissionStatusBadge";

interface DomainTasksData {
    domain: Domain;
    tasks: Task[];
    submissions: Record<string, "submitted" | "failed">;
}

async function fetchDomainTasks(domainId: string): Promise<DomainTasksData> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Your session expired. Please sign in again.");

    const [domainRes, tasksRes, subsRes] = await Promise.all([
        supabase.from("domains").select("*").eq("id", domainId).eq("is_visible", true).maybeSingle(),
        supabase.from("tasks").select("*").eq("domain_id", domainId).eq("is_visible", true).order("display_order"),
        supabase.from("submissions").select("task_id, status").eq("student_id", user.id),
    ]);

    if (domainRes.error) throw domainRes.error;
    if (tasksRes.error) throw tasksRes.error;
    if (subsRes.error) throw subsRes.error;
    if (!domainRes.data) throw new Error("This domain is not available.");

    const submissions: Record<string, "submitted" | "failed"> = {};
    for (const s of subsRes.data ?? []) submissions[s.task_id] = s.status as "submitted" | "failed";

    return { domain: domainRes.data as Domain, tasks: (tasksRes.data as Task[]) ?? [], submissions };
}

export function DomainTasksPage() {
    const { domainId = "" } = useParams();
    const navigate = useNavigate();
    const { data, loading, error, refetch } = useFetch(() => fetchDomainTasks(domainId), [domainId]);

    if (loading || !data) {
        return (
            <div className="page py-8">
                <PanelSkeleton className="mb-6 h-24" />
                <PanelSkeleton className="h-64" />
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

    const { domain, tasks, submissions } = data;
    const submittedCount = tasks.filter((t) => submissions[t.id] === "submitted").length;

    return (
        <div className="page py-8">
            <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate("/app/domains")} className="mb-3 -ml-2">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    All domains
                </Button>
                <Breadcrumbs
                    items={[
                        { label: "Student", to: "/app/domains" },
                        { label: "Domains", to: "/app/domains" },
                        { label: domain.name },
                    ]}
                />

                <div className="mt-3 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-heading text-foreground text-2xl leading-snug font-medium tracking-tight text-balance uppercase sm:text-3xl">
                            {domain.name}
                        </h1>
                        <Badge variant="neutral" className="gap-2">
                            <span className="font-normal normal-case">
                                {submittedCount}/{tasks.length} submitted
                            </span>
                        </Badge>
                    </div>
                    {domain.description && <Markdown content={domain.description} className="max-w-2xl" />}
                    <div className="border-border flex flex-wrap items-center gap-4 border-t pt-4">
                        <span className="eyebrow">Difficulty</span>
                        <div className="flex flex-wrap items-center gap-2">
                            <DifficultyBadge difficulty="easy" />
                            <DifficultyBadge difficulty="medium" />
                            <DifficultyBadge difficulty="hard" />
                            <DifficultyBadge difficulty="extreme" />
                            <span className="text-muted-foreground hidden font-mono text-[0.625rem] tracking-[0.05em] uppercase sm:inline">
                                Work through them in order - each level builds on the last.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="panel">
                    <EmptyState
                        icon={ClipboardList}
                        eyebrow="No tasks yet"
                        title="No tasks available"
                        description="Tasks for this domain haven’t been published yet. Check back soon."
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {tasks.map((task, i) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            status={(submissions[task.id] ?? "not_submitted") as SubmissionStatus}
                            position={i + 1}
                            total={tasks.length}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

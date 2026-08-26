import { Link } from "react-router-dom";
import { FileText, FolderKanban, ChevronRight, ClipboardCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCell } from "@/components/shared/StatCell";
import { StatSkeleton } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";

interface OverviewData {
    domainCount: number;
    taskCount: number;
    studentCount: number;
    submissionCount: number;
}

async function fetchOverview(): Promise<OverviewData> {
    const [{ count: d }, { count: t }, { count: s }, { count: sub }] = await Promise.all([
        supabase.from("domains").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("submissions").select("id", { count: "exact", head: true }),
    ]);
    return {
        domainCount: d ?? 0,
        taskCount: t ?? 0,
        studentCount: s ?? 0,
        submissionCount: sub ?? 0,
    };
}

export function AdminOverview() {
    const { data, loading, error, refetch } = useFetch(fetchOverview, []);

    return (
        <div className="page py-8">
            <PageHeader
                title="Overview"
                description="Manage domains and tasks, review student submissions, and run the interview pipeline."
                actions={
                    <Link to="/admin/domains">
                        <Button>
                            <FolderKanban className="size-4" aria-hidden="true" />
                            Manage domains
                        </Button>
                    </Link>
                }
            />

            {error && !loading && <ErrorState message={error} onRetry={refetch} />}

            {loading && !error && <StatSkeleton />}

            {!loading && !error && data && (
                <>
                    <div className="panel divide-border grid grid-cols-1 divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
                        <StatCell label="Domains" value={data.domainCount} hint="Published + hidden" />
                        <StatCell label="Tasks" value={data.taskCount} hint="Across all domains" />
                        <StatCell label="Students" value={data.studentCount} hint="Registered profiles" />
                        <StatCell label="Submissions" value={data.submissionCount} hint="Total received" />
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <Link
                            to="/app/domains"
                            className="panel group hover:border-muted-foreground/40 flex items-center gap-4 p-5 transition-all duration-150"
                        >
                            <FileText
                                className="text-muted-foreground size-5 shrink-0"
                                strokeWidth={1.5}
                                aria-hidden="true"
                            />
                            <div className="flex-1">
                                <p className="text-foreground group-hover:text-electric text-sm font-medium">
                                    Student portal
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    Preview the student experience as an admin.
                                </p>
                            </div>
                            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
                        </Link>
                        <Link
                            to="/admin/submissions"
                            className="panel group hover:border-muted-foreground/40 flex items-center gap-4 p-5 transition-all duration-150"
                        >
                            <ClipboardCheck
                                className="text-muted-foreground size-5 shrink-0"
                                strokeWidth={1.5}
                                aria-hidden="true"
                            />
                            <div className="flex-1">
                                <p className="text-foreground group-hover:text-electric text-sm font-medium">
                                    Submissions &amp; interviews
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    Shortlist submissions, track interviews and selections, export the panel.
                                </p>
                            </div>
                            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}

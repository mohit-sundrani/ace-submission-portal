import * as React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ClipboardCheck, Eye, Search, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdminReviewData, type ReviewSubmissionView } from "@/hooks/useAdminReviewData";
import { buildPdfViewUrl, updateSubmissionReview } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCell } from "@/components/shared/StatCell";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { TableSkeleton } from "@/components/states/LoadingState";
import { SubmissionReviewCard } from "@/components/admin/SubmissionReviewCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Review pipeline (ported from admintable-old Dashboard):
 *   • every student with a completed profile and at least one submission
 *   • filters - search (name / email / phone / course), domain, submission
 *     year, selection status
 *   • per-submission: view/download links, "Selected for interview" checkbox,
 *     persistent private admin notes
 *   • stat cells - total students, total submissions, top submitted tasks
 */
export function AdminSubmissions() {
    const { data, loading, error, refetch } = useAdminReviewData();

    // Filters
    const [search, setSearch] = React.useState("");
    const [domainId, setDomainId] = React.useState("all");
    const [year, setYear] = React.useState("all");
    const [selectedStatus, setSelectedStatus] = React.useState<"all" | "selected" | "not-selected">("all");

    // Submission review dialog
    const [dialog, setDialog] = React.useState<{ student_id: string; title: string; email: string } | null>(null);
    const [token, setToken] = React.useState<string>("");

    const students = data?.students ?? [];
    const domains = data?.domains ?? [];
    const submissions = data?.submissions ?? [];
    const yearOptions = React.useMemo(() => {
        const years = new Set<number>();
        for (const s of submissions) {
            const y = new Date(s.submitted_at).getFullYear();
            if (!Number.isNaN(y)) years.add(y);
        }
        return [...years].sort((a, b) => b - a);
    }, [submissions]);

    React.useEffect(() => {
        let cancelled = false;
        if (dialog) {
            supabase.auth.getSession().then(({ data: s }) => {
                if (!cancelled) setToken(s.session?.access_token ?? "");
            });
        }
        return () => {
            cancelled = true;
        };
    }, [dialog]);

    const byStudent = React.useMemo(() => {
        const map = new Map<string, ReviewSubmissionView[]>();
        for (const s of submissions) {
            const list = map.get(s.student_id) ?? [];
            list.push(s);
            map.set(s.student_id, list);
        }
        return map;
    }, [submissions]);

    const matchingSubmissions = React.useCallback(
        (list: ReviewSubmissionView[]) => {
            const domain = domainId !== "all" ? domainId : null;
            const y = year !== "all" ? Number(year) : null;
            return list.filter((s) => {
                if (domain && s.domain_id !== domain) return false;
                if (y) {
                    try {
                        if (new Date(s.submitted_at).getFullYear() !== y) return false;
                    } catch {
                        return false;
                    }
                }
                if (selectedStatus === "selected") return s.selected_for_interview;
                if (selectedStatus === "not-selected") return !s.selected_for_interview;
                return true;
            });
        },
        [domainId, year, selectedStatus]
    );

    const filteredStudents = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        return students.filter((p) => {
            const subs = byStudent.get(p.id) ?? [];
            const matchesSubmissionFilters = matchingSubmissions(subs).length > 0;
            if (!matchesSubmissionFilters) return false;
            if (!q) return true;
            const haystack = `${p.full_name} ${p.email} ${p.phone} ${p.course}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [students, byStudent, search, matchingSubmissions]);

    const totalStudents = filteredStudents.length;
    const totalSubmissions = React.useMemo(
        () => filteredStudents.reduce((acc, p) => acc + matchingSubmissions(byStudent.get(p.id) ?? []).length, 0),
        [filteredStudents, byStudent, matchingSubmissions]
    );

    const topTasks = React.useMemo(() => {
        const counts = new Map<string, number>();
        for (const p of filteredStudents) {
            for (const s of matchingSubmissions(byStudent.get(p.id) ?? [])) {
                counts.set(s.task_name, (counts.get(s.task_name) ?? 0) + 1);
            }
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [filteredStudents, byStudent, matchingSubmissions]);

    const handleSelectedChange = async (submission: ReviewSubmissionView, selected: boolean) => {
        try {
            await updateSubmissionReview(submission.id, { selected_for_interview: selected });
            toast.success(selected ? "Selected for interview" : "Selection removed");
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update selection.");
        }
    };

    const handleNotesSave = async (submission: ReviewSubmissionView, notes: string) => {
        try {
            await updateSubmissionReview(submission.id, { admin_notes: notes });
            toast.success("Note saved");
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save the note.");
        }
    };

    const pdfView = (submission: ReviewSubmissionView) =>
        submission.pdf_reference && token ? buildPdfViewUrl(submission.pdf_reference, token) : null;

    return (
        <div className="page py-8">
            <PageHeader
                title="Submissions"
                description="All students with submissions - shortlist tasks for interview and leave private notes."
                actions={
                    <Link to="/admin/interviews">
                        <Button variant="secondary">
                            <ClipboardCheck className="size-4" aria-hidden="true" />
                            Interview panel
                        </Button>
                    </Link>
                }
            />

            {error && !loading && <ErrorState message={error} onRetry={refetch} />}
            {loading && !error && <TableSkeleton rows={6} />}

            {!loading && !error && data && (
                <>
                    <div className="panel divide-border grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
                        <StatCell label="Students" value={totalStudents} hint="With matching submissions" />
                        <StatCell label="Submissions" value={totalSubmissions} hint="Matching current filters" />
                        <div className="p-6">
                            <p className="text-muted-foreground font-mono text-[0.6875rem] font-medium tracking-[0.05em] uppercase">
                                Top tasks
                            </p>
                            {topTasks.length === 0 ? (
                                <p className="text-muted-foreground mt-2 text-sm">No submissions found.</p>
                            ) : (
                                <ul className="mt-2 space-y-1.5">
                                    {topTasks.map(([name, count]) => (
                                        <li key={name} className="flex items-center justify-between gap-3">
                                            <span className="text-foreground truncate text-sm uppercase">{name}</span>
                                            <span className="text-electric shrink-0 font-mono text-xs">{count}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <section className="panel panel-ticks relative mt-6">
                        <div className="border-border grid gap-4 border-b p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-5">
                            <div className="sm:col-span-2 lg:col-span-2">
                                <Label htmlFor="rv-search">Search</Label>
                                <div className="relative mt-1.5">
                                    <Search
                                        className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        id="rv-search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Name, email, phone, course..."
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Domain</Label>
                                <Select value={domainId} onValueChange={setDomainId}>
                                    <SelectTrigger className="mt-1.5" aria-label="Domain">
                                        <SelectValue placeholder="All domains" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All domains</SelectItem>
                                        {domains.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>
                                                {d.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Year</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="mt-1.5" aria-label="Submission year">
                                        <SelectValue placeholder="All years" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All years</SelectItem>
                                        {yearOptions.map((y) => (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Selection</Label>
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(v) => setSelectedStatus(v as typeof selectedStatus)}
                                >
                                    <SelectTrigger className="mt-1.5" aria-label="Selection status">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="selected">Selected for interview</SelectItem>
                                        <SelectItem value="not-selected">Not selected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {filteredStudents.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                eyebrow="No matches"
                                title="No students found"
                                description="Try clearing filters, or wait for students to submit tasks first."
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-secondary">
                                        <tr>
                                            {["Student", "Email", "Phone", "Course", "Submissions", ""].map((h, i) => (
                                                <th
                                                    key={h}
                                                    scope="col"
                                                    className={cn(
                                                        "text-muted-foreground px-5 py-3 text-left font-mono text-[0.6875rem] font-medium tracking-[0.05em] uppercase",
                                                        i === 0 && "pl-6"
                                                    )}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-border divide-y">
                                        {filteredStudents.map((p) => {
                                            const subs = matchingSubmissions(byStudent.get(p.id) ?? []);
                                            return (
                                                <tr
                                                    key={p.id}
                                                    className="hover:bg-secondary/60 transition-colors duration-150"
                                                >
                                                    <td className="px-5 py-4 pl-6 whitespace-nowrap">
                                                        <p className="text-foreground text-sm font-medium">
                                                            {p.full_name || "-"}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <span className="text-muted-foreground font-mono text-xs">
                                                            {p.email}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <span className="text-muted-foreground text-sm">
                                                            {p.phone || "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <Badge variant="neutral">{p.course || "-"}</Badge>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <span className="text-foreground font-mono text-sm">
                                                            {subs.length}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right whitespace-nowrap">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() =>
                                                                setDialog({
                                                                    student_id: p.id,
                                                                    title: p.full_name || "Student",
                                                                    email: p.email,
                                                                })
                                                            }
                                                        >
                                                            <Eye className="size-4" aria-hidden="true" />
                                                            Review submissions
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}

            <Dialog open={Boolean(dialog)} onOpenChange={(o) => !o && setDialog(null)}>
                <DialogContent className="max-w-3xl" aria-describedby="review-dialog-desc">
                    <DialogHeader>
                        <DialogTitle>{dialog?.title ?? ""}</DialogTitle>
                        <DialogDescription id="review-dialog-desc">
                            {dialog?.email} - mark tasks to shortlist this student for an interview.
                        </DialogDescription>
                    </DialogHeader>
                    {dialog && (
                        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                            {(byStudent.get(dialog.student_id) ?? []).length === 0 ? (
                                <p className="text-muted-foreground py-8 text-center text-sm">
                                    No submissions for this student.
                                </p>
                            ) : (
                                (byStudent.get(dialog.student_id) ?? []).map((sub) => (
                                    <SubmissionReviewCard
                                        key={sub.id}
                                        submission={sub}
                                        editable
                                        pdfUrl={pdfView(sub)}
                                        onSelectedChange={(sel) => handleSelectedChange(sub, sel)}
                                        onNotesSave={(notes) => handleNotesSave(sub, notes)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

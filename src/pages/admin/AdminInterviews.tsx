import * as React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ClipboardCheck, Download, PenLine, Search, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdminReviewData, type ReviewSubmissionView } from "@/hooks/useAdminReviewData";
import { buildPdfViewUrl, upsertInterviewRecord } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { TableSkeleton } from "@/components/states/LoadingState";
import { SubmissionReviewCard } from "@/components/admin/SubmissionReviewCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn, ordinal, studyYearFromEnrollment } from "@/lib/utils";

/**
 * Interview panel (ported from admintable-old Report):
 *   • lists every student shortlisted for at least one task, grouped by domain
 *     (a student appears once per selected domain)
 *   • per student × domain: interview done, selected for ACE, notes - persisted
 *     in `interview_records`
 *   • domain filter + search
 *   • "Export to Excel" - replaced by a server-side CSV export through the
 *     `export-interviews` edge function (same columns as before, plus state)
 */
interface InterviewRow {
    student_id: string;
    domain_id: string;
    full_name: string;
    email: string;
    phone: string;
    course: string;
    enrollment_no: string;
    domain_name: string;
    submissions: ReviewSubmissionView[];
    interview_done: boolean;
    selected_for_ace: boolean;
    notes: string;
}

export function AdminInterviews() {
    const { data, loading, error, refetch } = useAdminReviewData();
    const [domainId, setDomainId] = React.useState("all");
    const [search, setSearch] = React.useState("");
    const [exporting, setExporting] = React.useState(false);

    // Notes dialog
    const [notesTarget, setNotesTarget] = React.useState<InterviewRow | null>(null);
    const [notesDraft, setNotesDraft] = React.useState("");
    const [notesBusy, setNotesBusy] = React.useState(false);
    // Submissions dialog - share state via a discriminated union
    const [subsTarget, setSubsTarget] = React.useState<InterviewRow | null>(null);
    const [token, setToken] = React.useState("");

    React.useEffect(() => {
        let cancelled = false;
        if (subsTarget || notesTarget) {
            supabase.auth.getSession().then(({ data: s }) => {
                if (!cancelled) setToken(s.session?.access_token ?? "");
            });
        }
        return () => {
            cancelled = true;
        };
    }, [subsTarget, notesTarget]);

    const domains = data?.domains ?? [];
    const students = data?.students ?? [];
    const submissions = data?.submissions ?? [];
    const records = data?.records ?? [];

    const rows = React.useMemo<InterviewRow[]>(() => {
        const selected = submissions.filter((s) => s.selected_for_interview);
        const profileById = new Map(students.map((p) => [p.id, p]));
        const domainById = new Map(domains.map((d) => [d.id, d]));

        const map = new Map<string, InterviewRow>();
        for (const s of selected) {
            const key = `${s.student_id}|${s.domain_id}`;
            const existing = map.get(key);
            if (existing) {
                existing.submissions.push(s);
                continue;
            }
            const p = profileById.get(s.student_id) ?? {
                full_name: "",
                email: "",
                phone: "",
                course: "",
                enrollment_no: "",
            };
            const d = domainById.get(s.domain_id) ?? { name: "Deleted domain" };
            map.set(key, {
                student_id: s.student_id,
                domain_id: s.domain_id,
                full_name: p.full_name ?? "",
                email: p.email ?? "",
                phone: p.phone ?? "",
                course: p.course ?? "",
                enrollment_no: p.enrollment_no ?? "",
                domain_name: d.name ?? "",
                submissions: [s],
                interview_done: false,
                selected_for_ace: false,
                notes: "",
            });
        }
        // Merge interview records
        for (const r of records) {
            const row = map.get(`${r.student_id}|${r.domain_id}`);
            if (!row) continue;
            row.interview_done = Boolean(r.interview_done);
            row.selected_for_ace = Boolean(r.selected_for_ace);
            row.notes = r.notes ?? "";
        }
        return [...map.values()].sort(
            (a, b) => a.domain_name.localeCompare(b.domain_name) || a.full_name.localeCompare(b.full_name)
        );
    }, [submissions, students, domains, records]);

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (domainId !== "all" && r.domain_id !== domainId) return false;
            if (!q) return true;
            return `${r.full_name} ${r.email} ${r.phone} ${r.course}`.toLowerCase().includes(q);
        });
    }, [rows, domainId, search]);

    const handleInterviewDone = async (row: InterviewRow, value: boolean) => {
        try {
            await upsertInterviewRecord({
                student_id: row.student_id,
                domain_id: row.domain_id,
                interview_done: value,
                selected_for_ace: row.selected_for_ace,
                notes: row.notes,
            });
            toast.success(value ? "Interview marked done" : "Interview marked pending");
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update interview status.");
        }
    };

    const handleSelectedForAce = async (row: InterviewRow, value: boolean) => {
        try {
            await upsertInterviewRecord({
                student_id: row.student_id,
                domain_id: row.domain_id,
                interview_done: row.interview_done,
                selected_for_ace: value,
                notes: row.notes,
            });
            toast.success(value ? "Selected for ACE" : "ACE selection removed");
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update selection.");
        }
    };

    const openNotes = (row: InterviewRow) => {
        setNotesTarget(row);
        setNotesDraft(row.notes);
    };

    const handleSaveNotes = async () => {
        if (!notesTarget) return;
        setNotesBusy(true);
        try {
            await upsertInterviewRecord({
                student_id: notesTarget.student_id,
                domain_id: notesTarget.domain_id,
                interview_done: notesTarget.interview_done,
                selected_for_ace: notesTarget.selected_for_ace,
                notes: notesDraft,
            });
            toast.success("Notes saved");
            setNotesTarget(null);
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save notes.");
        } finally {
            setNotesBusy(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (!token) throw new Error("Your session expired. Please sign in again.");
            const res = await supabase.functions.invoke("export-interviews", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.error) throw new Error(res.error.message ?? "Export failed");
            const text = res.data as string;
            const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "interview-panel.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Export ready");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not export the interview panel.");
        } finally {
            setExporting(false);
        }
    };

    const pdfView = (sub: ReviewSubmissionView) =>
        sub.pdf_reference && token ? buildPdfViewUrl(sub.pdf_reference, token) : null;

    return (
        <div className="page py-8">
            <PageHeader
                title="Interview panel"
                description="Students shortlisted for an interview - track interviews, final selection and notes."
                actions={
                    <>
                        <Link to="/admin/submissions">
                            <Button variant="secondary">
                                <ClipboardCheck className="size-4" aria-hidden="true" />
                                Submissions
                            </Button>
                        </Link>
                        <Button onClick={handleExport} loading={exporting}>
                            <Download className="size-4" aria-hidden="true" />
                            {exporting ? "Exporting..." : "Export CSV"}
                        </Button>
                    </>
                }
            />

            {error && !loading && <ErrorState message={error} onRetry={refetch} />}
            {loading && !error && <TableSkeleton rows={6} />}

            {!loading && !error && data && (
                <section className="panel panel-ticks relative">
                    <div className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-end sm:p-6">
                        <div className="w-full sm:max-w-xs">
                            <Label htmlFor="iv-domain">Domain</Label>
                            <Select value={domainId} onValueChange={setDomainId}>
                                <SelectTrigger id="iv-domain" className="mt-1.5" aria-label="Domain">
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
                        <div className="w-full sm:max-w-xs">
                            <Label htmlFor="iv-search">Search</Label>
                            <div className="relative mt-1.5">
                                <Search
                                    className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                                    aria-hidden="true"
                                />
                                <Input
                                    id="iv-search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name, email, phone..."
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <p className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase sm:ml-auto">
                            {filtered.length} selected for interview
                        </p>
                    </div>

                    {filtered.length === 0 ? (
                        <EmptyState
                            icon={UsersRound}
                            eyebrow="No interviews"
                            title="Nobody shortlisted yet"
                            description="Mark submissions as selected for interview in Submissions - they appear here grouped by domain."
                            action={
                                <Link to="/admin/submissions">
                                    <Button variant="secondary">Open Submissions</Button>
                                </Link>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary">
                                    <tr>
                                        {["Student", "Email", "Phone", "Domain", "Interview", "Selection", ""].map(
                                            (h, i) => (
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
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-border divide-y">
                                    {filtered.map((row) => (
                                        <tr
                                            key={`${row.student_id}-${row.domain_id}`}
                                            className="hover:bg-secondary/60 transition-colors duration-150"
                                        >
                                            <td className="px-5 py-4 pl-6 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <p className="text-foreground text-sm font-medium">
                                                            {row.full_name || "-"}
                                                        </p>
                                                        <p className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.05em] uppercase">
                                                            {row.course
                                                                ? `${row.course} - ${ordinal(
                                                                      /^\d{11}$/.test(row.enrollment_no?.trim() ?? "")
                                                                          ? studyYearFromEnrollment(row.enrollment_no)
                                                                          : 1
                                                                  )} Year`
                                                                : "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="text-muted-foreground font-mono text-xs">
                                                    {row.email}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="text-muted-foreground text-sm">
                                                    {row.phone || "-"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <Badge variant="primary">{row.domain_name}</Badge>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <label className="flex cursor-pointer items-center gap-2">
                                                    <Checkbox
                                                        checked={row.interview_done}
                                                        onCheckedChange={(v) => handleInterviewDone(row, v === true)}
                                                    />
                                                    <span
                                                        className={cn(
                                                            "text-sm",
                                                            row.interview_done
                                                                ? "text-success"
                                                                : "text-muted-foreground"
                                                        )}
                                                    >
                                                        {row.interview_done ? "Done" : "Pending"}
                                                    </span>
                                                </label>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <label className="flex cursor-pointer items-center gap-2">
                                                    <Checkbox
                                                        checked={row.selected_for_ace}
                                                        onCheckedChange={(v) => handleSelectedForAce(row, v === true)}
                                                    />
                                                    <span
                                                        className={cn(
                                                            "text-sm",
                                                            row.selected_for_ace
                                                                ? "text-success"
                                                                : "text-muted-foreground"
                                                        )}
                                                    >
                                                        {row.selected_for_ace ? "Selected" : "Not selected"}
                                                    </span>
                                                </label>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => openNotes(row)}
                                                    >
                                                        <PenLine className="size-4" aria-hidden="true" />
                                                        Notes
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => setSubsTarget(row)}
                                                    >
                                                        View submissions
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* Notes dialog */}
            <Dialog open={Boolean(notesTarget)} onOpenChange={(o) => !o && setNotesTarget(null)}>
                <DialogContent className="max-w-lg" aria-describedby="iv-notes-desc">
                    <DialogHeader>
                        <DialogTitle>Interview notes</DialogTitle>
                        <DialogDescription id="iv-notes-desc">
                            {notesTarget?.full_name} · {notesTarget?.domain_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            rows={6}
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            placeholder="Add private interview notes for this student..."
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleSaveNotes} loading={notesBusy}>
                                Save notes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Submissions dialog */}
            <Dialog open={Boolean(subsTarget)} onOpenChange={(o) => !o && setSubsTarget(null)}>
                <DialogContent className="max-w-3xl" aria-describedby="iv-subs-desc">
                    <DialogHeader>
                        <DialogTitle>{subsTarget?.full_name ?? ""}</DialogTitle>
                        <DialogDescription id="iv-subs-desc">
                            {subsTarget?.domain_name} · shortlisted submissions
                        </DialogDescription>
                    </DialogHeader>
                    {subsTarget && (
                        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                            {subsTarget.submissions.map((sub) => (
                                <SubmissionReviewCard key={sub.id} submission={sub} pdfUrl={pdfView(sub)} />
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { useFetch } from "./useFetch";
import { supabase } from "@/lib/supabase";
import type { Difficulty, Domain, InterviewRecord, Profile, Submission, Task } from "@/lib/types";

/**
 * Admin review + interview data (ported from admintable-old).
 *
 * The old portal stored submissions as flat per-user rows and interview state
 * on the user record. In this portal everything is relational: submissions
 * reference tasks/domains and interview state lives in `interview_records`.
 * This hook loads the full admin view of all of it in one pass.
 */
export interface ReviewSubmissionView {
    id: string;
    student_id: string;
    task_id: string;
    domain_id: string;
    submission_type: Submission["submission_type"];
    pdf_reference: string | null;
    links: string[];
    status: Submission["status"];
    submitted_at: string;
    selected_for_interview: boolean;
    admin_notes: string | null;
    task_name: string;
    domain_name: string;
    difficulty: Difficulty;
}

export interface AdminReviewData {
    students: Profile[];
    domains: Domain[];
    tasks: Task[];
    submissions: ReviewSubmissionView[];
    records: InterviewRecord[];
}

export async function fetchAdminReviewData(): Promise<AdminReviewData> {
    const [profilesRes, domainsRes, tasksRes, subsRes, recordsRes] = await Promise.all([
        supabase
            .from("profiles")
            .select("id, full_name, email, phone, enrollment_no, course")
            .eq("role", "student")
            .order("full_name"),
        supabase.from("domains").select("id, name, description, display_order, is_visible").order("display_order"),
        supabase.from("tasks").select("id, domain_id, name, difficulty").order("display_order"),
        supabase.from("submissions").select("*").order("submitted_at", { ascending: false }),
        supabase.from("interview_records").select("*"),
    ]);

    for (const r of [profilesRes, domainsRes, tasksRes, subsRes, recordsRes]) {
        if (r.error) throw r.error;
    }

    const taskMap = new Map<string, Task>(((tasksRes.data as Task[]) ?? []).map((t) => [t.id, t]));
    const domainMap = new Map<string, Domain>(((domainsRes.data as Domain[]) ?? []).map((d) => [d.id, d]));

    const submissions: ReviewSubmissionView[] = ((subsRes.data as Submission[]) ?? []).map((s) => ({
        ...s,
        selected_for_interview: s.selected_for_interview ?? false,
        admin_notes: s.admin_notes ?? null,
        task_name: taskMap.get(s.task_id)?.name ?? "Deleted task",
        domain_name: domainMap.get(s.domain_id)?.name ?? "Deleted domain",
        difficulty: taskMap.get(s.task_id)?.difficulty ?? "medium",
    }));

    return {
        students: (profilesRes.data as Profile[]) ?? [],
        domains: (domainsRes.data as Domain[]) ?? [],
        tasks: (tasksRes.data as Task[]) ?? [],
        submissions,
        records: (recordsRes.data as InterviewRecord[]) ?? [],
    };
}

export function useAdminReviewData() {
    return useFetch(fetchAdminReviewData, []);
}

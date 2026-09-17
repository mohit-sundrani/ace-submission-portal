import { supabase } from "./supabase";
import { supabaseUrl } from "./config";

/**
 * Admin-only write helpers for the review & interview pipeline.
 * RLS on the server still enforces that only admins can touch these fields.
 */

export async function updateSubmissionReview(
    id: string,
    patch: { selected_for_interview?: boolean; admin_notes?: string | null }
): Promise<void> {
    const { error } = await supabase.from("submissions").update(patch).eq("id", id);
    if (error) throw error;
}

export async function setStudentRejected(studentId: string, rejected: boolean): Promise<void> {
    const { error } = await supabase.rpc("set_student_rejected", {
        target_student_id: studentId,
        rejected,
    });
    if (error) throw error;
}

export async function updatePortalSettings(patch: {
    mentor_selection_enabled?: boolean;
    mentor_notes_enabled?: boolean;
}): Promise<void> {
    const { error } = await supabase.from("portal_settings").update(patch).eq("id", true);
    if (error) throw error;
}

export async function upsertInterviewRecord(record: {
    student_id: string;
    domain_id: string;
    interview_done: boolean;
    selected_for_ace: boolean;
    notes: string;
}): Promise<void> {
    const { error } = await supabase.from("interview_records").upsert(record, { onConflict: "student_id,domain_id" });
    if (error) throw error;
}

/**
 * Admin-only PDF viewer URL. The bytes stay private on Hugging Face; the
 * `view-pdf` edge function checks the caller's JWT + admin role server-side
 * before streaming them back. The token is embedded because the link opens in
 * a new tab (no Authorization header there) - it is the admin's own short-lived
 * session token and the role check still happens on the server.
 */
export function buildPdfViewUrl(path: string, token: string): string {
    return `${supabaseUrl}/functions/v1/view-pdf?path=${encodeURIComponent(path)}&token=${encodeURIComponent(token)}`;
}

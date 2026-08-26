export type Role = "student" | "admin" | "mentor" | "owner";
export type Difficulty = "easy" | "medium" | "hard" | "extreme";
export type SubmissionType = "pdf" | "link" | "pdf_link";

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    enrollment_no: string;
    course: "BCA" | "MCA";
    role: Role;
    created_at: string;
    updated_at: string;
}

export interface Domain {
    id: string;
    name: string;
    description: string;
    is_visible: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    domain_id: string;
    name: string;
    description: string;
    instructions: string;
    difficulty: Difficulty;
    submission_type: SubmissionType;
    is_visible: boolean;
    display_order: number;
    allows_resubmission: boolean;
    created_at: string;
    updated_at: string;
}

export interface Submission {
    id: string;
    student_id: string;
    task_id: string;
    domain_id: string;
    submission_type: SubmissionType;
    pdf_reference: string | null;
    links: string[];
    status: "submitted" | "failed";
    /** Admin review: shortlist this task submission for an interview (ported from admintable-old). */
    selected_for_interview?: boolean;
    /** Admin review: private per-submission note (ported from admintable-old). */
    admin_notes?: string | null;
    submitted_at: string;
    created_at: string;
    updated_at: string;
}

export interface InterviewRecord {
    id: string;
    student_id: string;
    domain_id: string;
    interview_done: boolean;
    selected_for_ace: boolean;
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    display_order: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
}

export interface NavItem {
    label: string;
    to: string;
    icon: string;
    end?: boolean;
}

export interface NavSection {
    label: string;
    items: NavItem[];
}

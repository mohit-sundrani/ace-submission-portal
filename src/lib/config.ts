export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Submission portal closing deadline (ISO 8601 string, e.g. "2026-09-15T23:59:59Z").
 * Optional - when set, the topbar shows a countdown bar colored by time remaining.
 */
export const submissionDeadline = import.meta.env.VITE_SUBMISSION_DEADLINE as string | undefined;

export const APP_NAME = "ACE";
export const APP_NAME_LONG = "ACE Submission Portal";

/** Max PDF size accepted by the storage layer (matches the edge function). */
export const MAX_PDF_SIZE_MB = 10;
export const MAX_LINKS = 5;

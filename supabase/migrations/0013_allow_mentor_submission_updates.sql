-- ────────────────────────────────────────────────────────────────────────────
-- Migration: Allow mentors to update submissions and interview records
--
-- The UI already grants mentors access to /admin/submissions and /admin/interviews
-- via RequireStaff, but the RLS policies and the review-guard trigger only allow
-- is_admin() (admin + owner). This migration extends write permissions to mentors.
--
-- Changes:
--   1. submissions_review_admin  UPDATE policy  → is_admin_or_mentor()
--   2. interview_records INSERT / UPDATE policies → is_admin_or_mentor()
--   3. prevent_student_review_update trigger      → is_admin_or_mentor()
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Submission review UPDATE policy – allow mentors to review submissions
drop policy if exists "submissions_review_admin" on public.submissions;
create policy "submissions_review_admin" on public.submissions
  for update
  using (public.is_admin_or_mentor())
  with check (public.is_admin_or_mentor());

-- 2. Interview records – allow mentors to insert and update records
drop policy if exists "interview_records_insert_admin" on public.interview_records;
create policy "interview_records_insert_admin" on public.interview_records
  for insert
  with check (public.is_admin_or_mentor());

drop policy if exists "interview_records_update_admin" on public.interview_records;
create policy "interview_records_update_admin" on public.interview_records
  for update
  using (public.is_admin_or_mentor())
  with check (public.is_admin_or_mentor());

-- 3. Update the review-guard trigger to also allow mentors
create or replace function public.prevent_student_review_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_or_mentor()
     and (new.selected_for_interview is distinct from old.selected_for_interview
          or new.admin_notes is distinct from old.admin_notes) then
    raise exception 'Only admins and mentors can update review fields.';
  end if;
  return new;
end $$;

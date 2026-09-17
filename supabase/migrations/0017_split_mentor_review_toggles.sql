-- ────────────────────────────────────────────────────────────────────────────
-- Migration: Split mentor review toggle into selection + notes
--
-- Replaces the combined `mentor_review_enabled` flag from 0016 with two
-- independent controls so admins can turn off mentor shortlisting and mentor
-- notes separately on the Submissions page:
--   • mentor_selection_enabled - shortlist submissions for interview
--   • mentor_notes_enabled     - edit private per-submission notes
-- Both default ON. Admins can always select/note; the trigger guard now
-- enforces each flag independently for mentors.
--
-- Run with:  supabase db push   (or paste into Dashboard → SQL Editor)
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Add the two independent flags ───────────────────────────────────────────
alter table public.portal_settings
  add column if not exists mentor_selection_enabled boolean not null default true;
alter table public.portal_settings
  add column if not exists mentor_notes_enabled boolean not null default true;

-- 2. Backfill both from the already-applied combined flag, then drop it
update public.portal_settings
   set mentor_selection_enabled = mentor_review_enabled,
       mentor_notes_enabled     = mentor_review_enabled
 where exists (
   select 1 from information_schema.columns
   where table_schema = 'public' and table_name = 'portal_settings'
     and column_name = 'mentor_review_enabled'
 );

alter table public.portal_settings
  drop column if exists mentor_review_enabled;

-- 3. Replace the review guard with per-flag enforcement ──────────────────────
create or replace function public.prevent_student_review_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  selection_enabled boolean;
  notes_enabled     boolean;
begin
  if new.selected_for_interview is distinct from old.selected_for_interview
     or new.admin_notes is distinct from old.admin_notes then
    if not public.is_admin() then
      if public.is_mentor() then
        select p.mentor_selection_enabled, p.mentor_notes_enabled
          into selection_enabled, notes_enabled
          from public.portal_settings p
          where p.id = true;
        if new.selected_for_interview is distinct from old.selected_for_interview
           and not coalesce(selection_enabled, true) then
          raise exception 'Mentor selection is currently disabled.';
        end if;
        if new.admin_notes is distinct from old.admin_notes
           and not coalesce(notes_enabled, true) then
          raise exception 'Mentor notes are currently disabled.';
        end if;
        return new;
      end if;
      raise exception 'Only admins and mentors can update review fields.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists submissions_review_guard on public.submissions;
create trigger submissions_review_guard
  after update on public.submissions
  for each row
  when (new.selected_for_interview is distinct from old.selected_for_interview
        or new.admin_notes is distinct from old.admin_notes)
  execute function public.prevent_student_review_update();
-- ────────────────────────────────────────────────────────────────────────────
-- Migration: Fix mentor read access to profiles and interview_records
--
-- Problem: The profiles SELECT policy uses is_admin() which only includes
-- admin and owner roles. Mentors are excluded, so when a mentor loads the
-- submissions page, the profiles query returns empty → students = 0, submissions = 0.
--
-- Similarly, interview_records SELECT policy uses is_admin(), preventing
-- mentors from viewing interview data.
--
-- Fix: Update both SELECT policies to use is_admin_or_mentor() which
-- includes admin, mentor, and owner roles.
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Fix profiles SELECT: allow mentors to read all profiles
--    (needed for the submissions admin page to show student data)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin_or_mentor());

-- 2. Fix interview_records SELECT: allow mentors to read interview records
--    (needed for the interviews admin page)
drop policy if exists "interview_records_select_admin" on public.interview_records;
create policy "interview_records_select_admin" on public.interview_records
  for select using (public.is_admin_or_mentor());

-- ────────────────────────────────────────────────────────────────────────────
-- Migration: Fix privilege escalation (audit findings C1 + C2)
--
-- C1: prevent_role_change used `not is_admin()` as its guard. Since
--     migration 0008 redefined is_admin() to return true for BOTH admin
--     and owner, any admin could self-promote to owner directly from the
--     client (RLS policy profiles_update_own permits users to update
--     their own row).
--
--     NOTE: naively swapping the guard to `not is_owner()` is NOT safe
--     either. This is an AFTER trigger: queries inside it run with an
--     incremented command id and therefore SEE the row as mutated by the
--     current statement. A user promoting THEMSELVES would find their own
--     row already carrying role='owner', making is_owner() return true
--     mid-trigger and waving the change through - for ANY role, including
--     student. The actor's role must therefore be resolved from a source
--     NOT affected by the in-flight statement:
--       * self-change (auth.uid() = OLD.id): use OLD.role, the
--         authoritative pre-update value;
--       * otherwise: read the actor's (untouched) row from profiles.
--
--     Owners may still manage roles from the client, and the
--     app.allow_role_change escape hatch still works for SQL Editor /
--     server-side use.
--
-- C2: set_admin_role / set_mentor_role / set_owner_role are SECURITY
--     DEFINER functions with no explicit ACL. PostgreSQL grants EXECUTE
--     to PUBLIC by default, making them callable via PostgREST/RPC by
--     anon or authenticated sessions - a direct escalation primitive.
--     Fix: revoke EXECUTE from PUBLIC, anon and authenticated. They
--     remain usable from the Dashboard SQL Editor (run as postgres,
--     which bypasses ACLs).
--
-- Run with:  supabase db push   (or paste into Dashboard → SQL Editor)
-- ────────────────────────────────────────────────────────────────────────────

-- ── C1: role changes may only be performed by the owner ───────────────────
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor      uuid := auth.uid();
  actor_role public.app_role;
begin
  if old.role is distinct from new.role then
    if actor = old.id then
      -- Self-change: this trigger can observe the NEW row produced by the
      -- in-flight statement, so never re-read profiles for the actor -
      -- trust only the pre-update value.
      actor_role := old.role;
    else
      -- Changing someone else's row: the actor's own row is untouched by
      -- this statement, so reading it is safe. (If a multi-row statement
      -- already modified the actor's row earlier, that row's own trigger
      -- evaluation hit the self-change branch above and raised.)
      select p.role into actor_role
      from public.profiles p
      where p.id = actor;
    end if;

    if actor_role is distinct from 'owner'
       and current_setting('app.allow_role_change', true) is distinct from 'true'
    then
      raise exception 'Role changes are not allowed from the client.';
    end if;
  end if;

  return new;
end;
$$;

-- ── C2: lock down role-promotion SECURITY DEFINER functions ──────────────
revoke execute on function public.set_admin_role(text)  from public;
revoke execute on function public.set_admin_role(text)  from anon;
revoke execute on function public.set_admin_role(text)  from authenticated;

revoke execute on function public.set_mentor_role(text) from public;
revoke execute on function public.set_mentor_role(text) from anon;
revoke execute on function public.set_mentor_role(text) from authenticated;

revoke execute on function public.set_owner_role(text)  from public;
revoke execute on function public.set_owner_role(text)  from anon;
revoke execute on function public.set_owner_role(text)  from authenticated;

comment on function public.prevent_role_change() is
  'Blocks client-side role changes. Only owners may change roles (resolved from pre-statement state to defeat trigger-visibility tricks); other roles require the app.allow_role_change session flag (SQL Editor use).';
comment on function public.set_admin_role(target_email text) is
  'Promotes a user to admin. Restricted to postgres/superuser - not executable by anon, authenticated or PUBLIC.';
comment on function public.set_mentor_role(target_email text) is
  'Promotes a user to mentor. Restricted to postgres/superuser - not executable by anon, authenticated or PUBLIC.';
comment on function public.set_owner_role(target_email text) is
  'Promotes a user to owner. Restricted to postgres/superuser - not executable by anon, authenticated or PUBLIC.';

-- Grant role-level privileges on submissions and enrollments.
--
-- These two tables were re-created on the live database via the SQL editor
-- after drift, which skipped the default privileges Supabase applies to
-- migration-created tables. Without these grants the authenticated/anon roles
-- hit "permission denied for table ...", which broke enrollment tracking
-- (UC-05 completion %) and explanation reads (UC-04, whose RLS policy reads
-- submissions). RLS still restricts which rows each role may actually touch.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO anon, authenticated;

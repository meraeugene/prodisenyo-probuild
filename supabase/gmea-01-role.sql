-- Run and commit before the remaining GMEA migrations.
alter type public.app_role add value if not exists 'gmea';

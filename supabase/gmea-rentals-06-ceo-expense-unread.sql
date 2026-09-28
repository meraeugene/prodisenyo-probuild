-- CEO unread state for newly created or updated Rental expenses.
begin;

create or replace function public.notify_ceos_of_gmea_rental_expense()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.gmea_rental_expense_notifications(
    expense_id,rental_id,recipient_id
  )
  select new.id,new.rental_id,profile.id
  from public.profiles profile
  where profile.role::text='ceo' and profile.is_active
  on conflict(expense_id,recipient_id) do update set
    rental_id=excluded.rental_id,
    read_at=null,
    created_at=now();
  return new;
end $$;

revoke all on function public.notify_ceos_of_gmea_rental_expense()
  from public,anon,authenticated;

drop trigger if exists gmea_rental_expense_notify_ceos
  on public.gmea_rental_expenses;
create trigger gmea_rental_expense_notify_ceos
after insert or update on public.gmea_rental_expenses
for each row execute function public.notify_ceos_of_gmea_rental_expense();

create or replace function public.mark_gmea_rental_expense_viewed(
  p_actor uuid,
  p_expense uuid
)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='ceo' and is_active
  ) then
    raise exception 'Only an active CEO can view this notification';
  end if;
  if not exists(
    select 1 from public.gmea_rental_expenses where id=p_expense
  ) then
    raise exception 'Rental expense not found';
  end if;
  update public.gmea_rental_expense_notifications
  set read_at=coalesce(read_at,now())
  where expense_id=p_expense and recipient_id=p_actor;
end $$;

revoke all on function public.mark_gmea_rental_expense_viewed(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.mark_gmea_rental_expense_viewed(uuid,uuid)
  to service_role;

commit;

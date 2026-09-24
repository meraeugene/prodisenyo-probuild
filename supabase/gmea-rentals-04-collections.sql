-- Rental collections with append-only payment audit history.
-- Safe to run after gmea-rentals-03.
begin;

comment on table public.gmea_rental_payments is
  'Posted and voided GMEA Rental payments. Voided rows remain as audit history.';

create index if not exists gmea_rental_payments_rental_status_idx
  on public.gmea_rental_payments(rental_id,status,payment_date,recorded_at);

create or replace function public.mutate_gmea_rental_collection(
  p_actor uuid,
  p_rental uuid,
  p_version integer,
  p_command jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  rental public.gmea_rentals;
  payment public.gmea_rental_payments;
  kind text:=p_command->>'kind';
  value jsonb:=p_command->'value';
  target_id uuid;
  charge_total numeric(16,2);
  received_total numeric(16,2);
  payment_amount numeric(16,2);
  payment_on date;
  reason_text text;
begin
  if not exists(
    select 1 from public.profiles
    where id=p_actor and role::text='gmea' and is_active
  ) then
    raise exception 'Only active GMEA users can manage rental collections';
  end if;
  if p_rental is null or p_version is null or p_version < 1 then
    raise exception 'Rental and version are required';
  end if;

  select * into rental
  from public.gmea_rentals
  where id=p_rental
  for update;
  if not found then raise exception 'Rental not found'; end if;
  if rental.version<>p_version then
    raise exception 'This rental changed. Reload before saving';
  end if;

  select coalesce(sum(rate*quantity),0) into charge_total
  from public.gmea_rental_items
  where rental_id=p_rental;

  if kind='record_payment' then
    target_id:=(value->>'id')::uuid;
    payment_amount:=(value->>'amount')::numeric;
    payment_on:=(value->>'payment_date')::date;
    if payment_amount<=0 then
      raise exception 'Payment amount must be greater than zero';
    end if;
    if payment_on>current_date then
      raise exception 'Payment date cannot be in the future';
    end if;
    if length(coalesce(value->>'method',''))>100
      or length(coalesce(value->>'reference_number',''))>100
      or length(coalesce(value->>'notes',''))>1000 then
      raise exception 'Payment details are too long';
    end if;
    select coalesce(sum(amount),0) into received_total
    from public.gmea_rental_payments
    where rental_id=p_rental and status='posted';
    if received_total+payment_amount>charge_total then
      raise exception 'Payment amount exceeds the remaining rental balance';
    end if;
    insert into public.gmea_rental_payments(
      id,rental_id,amount,payment_date,method,reference_number,notes,recorded_by
    ) values(
      target_id,p_rental,payment_amount,payment_on,
      coalesce(value->>'method',''),
      coalesce(value->>'reference_number',''),
      coalesce(value->>'notes',''),
      p_actor
    );
  elsif kind='void_payment' then
    target_id:=(p_command->>'payment_id')::uuid;
    reason_text:=btrim(coalesce(p_command->>'reason',''));
    if length(reason_text) not between 1 and 500 then
      raise exception 'Void reason is required and must be within 500 characters';
    end if;
    select * into payment
    from public.gmea_rental_payments
    where id=target_id and rental_id=p_rental
    for update;
    if not found then raise exception 'Payment not found'; end if;
    if payment.status<>'posted' then
      raise exception 'Payment is already voided';
    end if;
    update public.gmea_rental_payments
    set status='voided',
        voided_by=p_actor,
        voided_at=now(),
        void_reason=reason_text
    where id=target_id;
  else
    raise exception 'Invalid rental collection operation';
  end if;

  update public.gmea_rentals
  set version=version+1,updated_by=p_actor,updated_at=now()
  where id=p_rental;
  return p_rental;
end
$$;

revoke all on function public.mutate_gmea_rental_collection(uuid,uuid,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.mutate_gmea_rental_collection(uuid,uuid,integer,jsonb)
  to service_role;

commit;

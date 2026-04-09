-- Optional phone on profiles; copied from auth user_metadata at signup (`phone` key).

alter table public.profiles add column if not exists phone text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');

  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_phone
  );
  insert into public.usage_limits (user_id) values (new.id)
  on conflict (user_id) do nothing;
  perform public.grant_signup_credits(new.id);
  return new;
end;
$$;

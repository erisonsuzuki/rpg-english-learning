create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_settings_updated_at on public.user_settings;

create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

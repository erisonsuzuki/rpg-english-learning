drop policy if exists "update own llm settings" on public.llm_settings;

create policy "update own llm settings"
on public.llm_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

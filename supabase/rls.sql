-- RLS politikaları (Supabase SQL Editor'de çalıştırın)

alter table credit_cards enable row level security;
alter table loans enable row level security;
alter table other_payments enable row level security;
alter table incomes enable row level security;
alter table custom_types enable row level security;

create policy "credit_cards_select_own" on credit_cards for select using (auth.uid() = user_id);
create policy "credit_cards_insert_own" on credit_cards for insert with check (auth.uid() = user_id);
create policy "credit_cards_update_own" on credit_cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit_cards_delete_own" on credit_cards for delete using (auth.uid() = user_id);

create policy "loans_select_own" on loans for select using (auth.uid() = user_id);
create policy "loans_insert_own" on loans for insert with check (auth.uid() = user_id);
create policy "loans_update_own" on loans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "loans_delete_own" on loans for delete using (auth.uid() = user_id);

create policy "other_payments_select_own" on other_payments for select using (auth.uid() = user_id);
create policy "other_payments_insert_own" on other_payments for insert with check (auth.uid() = user_id);
create policy "other_payments_update_own" on other_payments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "other_payments_delete_own" on other_payments for delete using (auth.uid() = user_id);

create policy "incomes_select_own" on incomes for select using (auth.uid() = user_id);
create policy "incomes_insert_own" on incomes for insert with check (auth.uid() = user_id);
create policy "incomes_update_own" on incomes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "incomes_delete_own" on incomes for delete using (auth.uid() = user_id);

create policy "custom_types_select_own" on custom_types for select using (auth.uid() = user_id);
create policy "custom_types_insert_own" on custom_types for insert with check (auth.uid() = user_id);
create policy "custom_types_update_own" on custom_types for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_types_delete_own" on custom_types for delete using (auth.uid() = user_id);

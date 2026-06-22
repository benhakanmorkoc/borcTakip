-- Tahmini gizleme (projection_dismissals) için RLS politikaları
-- Supabase SQL Editor'de çalıştırın (tablo zaten varsa sadece bu dosyayı yeter)

alter table projection_dismissals enable row level security;

drop policy if exists "projection_dismissals_select_own" on projection_dismissals;
drop policy if exists "projection_dismissals_insert_own" on projection_dismissals;
drop policy if exists "projection_dismissals_update_own" on projection_dismissals;
drop policy if exists "projection_dismissals_delete_own" on projection_dismissals;

create policy "projection_dismissals_select_own" on projection_dismissals for select using (auth.uid() = user_id);
create policy "projection_dismissals_insert_own" on projection_dismissals for insert with check (auth.uid() = user_id);
create policy "projection_dismissals_update_own" on projection_dismissals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projection_dismissals_delete_own" on projection_dismissals for delete using (auth.uid() = user_id);

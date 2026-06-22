-- Mevcut loans tablosuna manuel ileri vade kayıtları
alter table loans
  add column if not exists future_installments jsonb not null default '[]'::jsonb;

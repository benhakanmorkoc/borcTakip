-- Tahmini kart/ödeme dönüşümü ve gizleme
alter table credit_cards
  add column if not exists projected_from_card_id uuid references credit_cards(id) on delete set null;

alter table other_payments
  add column if not exists projected_from_payment_id uuid references other_payments(id) on delete set null;

create table if not exists projection_dismissals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  kind text not null check (kind in ('card', 'payment')),
  target_month text not null,
  source_id uuid not null,
  created_at timestamptz default now(),
  unique (user_id, kind, target_month, source_id)
);

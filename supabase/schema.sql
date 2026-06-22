-- Borç Takip — Supabase şeması (Faz 2)
-- Tek kullanıcı / auth eklendiğinde user_id kolonları kullanılacak

create table if not exists credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  bank_name text not null,
  min_payment numeric(12,2) not null default 0,
  total_debt numeric(12,2) not null default 0,
  due_month text not null, -- YYYY-MM
  min_paid boolean not null default false,
  fully_paid boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  bank_name text not null,
  monthly_payment numeric(12,2) not null default 0,
  total_terms int not null default 1,
  remaining_terms int not null default 1,
  payoff_amount numeric(12,2) not null default 0,
  installment_paid boolean not null default false,
  start_month text,
  end_month text,
  future_installments jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists other_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  name text,
  amount numeric(12,2) not null default 0,
  due_date date not null,
  note text,
  paid boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  name text,
  amount numeric(12,2) not null default 0,
  month text not null, -- YYYY-MM
  created_at timestamptz default now()
);

create table if not exists custom_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text not null check (category in ('payment', 'income')),
  label text not null,
  unique (user_id, category, label)
);

-- RLS (auth sonrası etkinleştirin)
-- alter table credit_cards enable row level security;
-- create policy "own rows" on credit_cards for all using (auth.uid() = user_id);

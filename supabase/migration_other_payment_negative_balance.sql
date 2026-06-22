alter table other_payments
  add column if not exists is_negative_balance boolean not null default false;

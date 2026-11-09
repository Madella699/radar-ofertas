create extension if not exists pgcrypto;

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  source_key text unique not null,
  title text not null,
  category text not null,
  image_url text,
  store text not null,
  seller text not null,
  price_cash numeric(12,2),
  price_card numeric(12,2) not null check (price_card > 0),
  installments integer check (installments > 0),
  installment_value numeric(12,2),
  shipping numeric(12,2),
  condition text not null default 'new' check (condition in ('new','used','refurbished')),
  product_url text not null,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists offers_verified_at_idx on public.offers(verified_at desc);
create index if not exists offers_category_idx on public.offers(category);
create index if not exists offers_price_card_idx on public.offers(price_card);

create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  price_card numeric(12,2) not null,
  captured_at timestamptz not null default now()
);
create index if not exists price_history_offer_time_idx on public.price_history(offer_id, captured_at desc);

create table if not exists public.alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email','telegram','webpush')),
  destination text,
  query text not null,
  category text,
  max_price_card numeric(12,2),
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists alert_subscriptions_active_idx on public.alert_subscriptions(is_active) where is_active = true;

create table if not exists public.admin_users (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;
alter table public.price_history enable row level security;
alter table public.alert_subscriptions enable row level security;
alter table public.admin_users enable row level security;

create policy "offers public read" on public.offers for select using (true);
create policy "history public read" on public.price_history for select using (true);
-- Sem políticas públicas de escrita. O backend deve usar service role e validar operações.

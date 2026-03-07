-- ─── VIRTUE FORGE DATABASE SCHEMA ────────────────────────────────────────────
-- Run this in your Supabase SQL Editor after creating your project.
-- Dashboard → SQL Editor → New Query → paste this → Run

-- 1. App Data (replaces localStorage)
-- Stores each user's children, virtues, setup state, and reading progress.
create table if not exists app_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  data jsonb not null default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Email Subscribers (newsletter / lead capture)
create table if not exists email_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  subscribed_at timestamptz default now() not null,
  unsubscribed_at timestamptz
);

-- 3. Subscriptions (Stripe subscription state)
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive', -- active, canceled, past_due
  plan text not null default 'free', -- free, premium
  billing_period text, -- monthly, yearly
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. Story Generation Log (for analytics and abuse prevention)
create table if not exists story_generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  child_name text, -- first name only, no PII beyond this
  virtue text not null,
  generated_at timestamptz default now() not null
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Each user can only read/write their own data.

alter table app_data enable row level security;
alter table subscriptions enable row level security;
alter table story_generations enable row level security;
alter table email_subscribers enable row level security;

-- App data: users can only access their own row
create policy "Users can read own app_data" on app_data
  for select using (auth.uid() = user_id);
create policy "Users can insert own app_data" on app_data
  for insert with check (auth.uid() = user_id);
create policy "Users can update own app_data" on app_data
  for update using (auth.uid() = user_id);

-- Subscriptions: users can only read their own
create policy "Users can read own subscriptions" on subscriptions
  for select using (auth.uid() = user_id);

-- Story generations: users can read their own
create policy "Users can read own stories" on story_generations
  for select using (auth.uid() = user_id);
create policy "Users can insert own stories" on story_generations
  for insert with check (auth.uid() = user_id);

-- Email subscribers: insert-only from API (no user reads)
create policy "Anyone can subscribe" on email_subscribers
  for insert with check (true);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

create index if not exists idx_app_data_user on app_data(user_id);
create index if not exists idx_subscriptions_user on subscriptions(user_id);
create index if not exists idx_subscriptions_stripe on subscriptions(stripe_subscription_id);
create index if not exists idx_story_gen_user on story_generations(user_id);
create index if not exists idx_email_sub_email on email_subscribers(email);

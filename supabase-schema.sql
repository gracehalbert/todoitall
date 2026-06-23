-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

create table if not exists categories (
  id uuid primary key,
  name text not null,
  color text not null,
  icon text not null
);

create table if not exists tasks (
  id uuid primary key,
  title text not null,
  description text,
  category_id uuid,
  priority text not null default 'low',
  due_date text,
  time_estimate integer,
  completed boolean not null default false,
  completed_at text,
  created_at text not null,
  points integer not null default 0
);

create table if not exists habits (
  id uuid primary key,
  title text not null,
  description text,
  category_id uuid,
  frequency text not null,
  target_days integer[],
  streak integer not null default 0,
  longest_streak integer not null default 0,
  completed_dates text[] not null default '{}',
  created_at text not null,
  points integer not null default 0,
  color text not null
);

create table if not exists routines (
  id uuid primary key,
  title text not null,
  description text,
  category_id uuid,
  steps jsonb not null default '[]',
  frequency text not null,
  last_completed_date text,
  completed_dates text[] not null default '{}',
  created_at text not null,
  points integer not null default 0
);

create table if not exists custom_rewards (
  id uuid primary key,
  title text not null,
  description text,
  cost integer not null default 0,
  emoji text not null,
  redeemed_count integer not null default 0
);

create table if not exists app_config (
  key text primary key,
  value jsonb not null
);

-- Disable row level security so the anon key can read/write everything
alter table categories disable row level security;
alter table tasks disable row level security;
alter table habits disable row level security;
alter table routines disable row level security;
alter table custom_rewards disable row level security;
alter table app_config disable row level security;

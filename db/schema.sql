create extension if not exists pgcrypto;

create table if not exists sessions (
  id text primary key,
  username text not null check (username in ('kusselberg', 'schachmagie', 'daniel')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_expires_at_idx on sessions (expires_at);

create table if not exists workspaces (
  username text primary key check (username in ('kusselberg', 'schachmagie', 'daniel')),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

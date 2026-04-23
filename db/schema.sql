create extension if not exists pgcrypto;

create table if not exists sessions (
  id text primary key,
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_expires_at_idx on sessions (expires_at);

create table if not exists login_throttles (
  scope text not null check (scope in ('ip', 'username')),
  throttle_key text not null,
  failure_count integer not null,
  first_failure_at timestamptz not null,
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (scope, throttle_key)
);

create table if not exists workspaces (
  username text primary key check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists player_library (
  id text primary key,
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  normalized_name text not null,
  display_name text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (username, normalized_name)
);

create index if not exists player_library_username_idx on player_library (username);

create table if not exists tournament_records (
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  tournament_id text not null,
  name text not null,
  status text not null,
  total_rounds integer not null,
  current_round integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (username, tournament_id)
);

create index if not exists tournament_records_username_idx on tournament_records (username);

create table if not exists tournament_player_entries (
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  tournament_id text not null,
  tournament_player_id text not null,
  library_player_id text references player_library(id),
  name_snapshot text not null,
  seed integer not null,
  entered_round integer not null,
  dropped_after_round integer,
  primary key (username, tournament_id, tournament_player_id),
  foreign key (username, tournament_id) references tournament_records(username, tournament_id) on delete cascade
);

create index if not exists tournament_player_entries_username_idx on tournament_player_entries (username);
create index if not exists tournament_player_entries_library_idx on tournament_player_entries (library_player_id);

create table if not exists tournament_match_entries (
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  tournament_id text not null,
  match_id text not null,
  round integer not null,
  board integer not null,
  white_tournament_player_id text not null,
  black_tournament_player_id text,
  white_library_player_id text,
  black_library_player_id text,
  result text,
  is_bye boolean not null,
  primary key (username, tournament_id, match_id),
  foreign key (username, tournament_id) references tournament_records(username, tournament_id) on delete cascade
);

create index if not exists tournament_match_entries_username_idx on tournament_match_entries (username);
create index if not exists tournament_match_entries_white_library_idx on tournament_match_entries (white_library_player_id);
create index if not exists tournament_match_entries_black_library_idx on tournament_match_entries (black_library_player_id);

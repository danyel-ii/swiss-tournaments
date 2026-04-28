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

create table if not exists player_ratings (
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  library_player_id text not null references player_library(id) on delete cascade,
  rating integer not null default 1200,
  games integer not null default 0,
  provisional boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (username, library_player_id)
);

create index if not exists player_ratings_username_idx on player_ratings (username);

create table if not exists rated_games (
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  source_type text not null check (source_type in ('tournament', 'ongoing_table')),
  source_id text not null,
  source_game_id text not null,
  white_library_player_id text not null references player_library(id) on delete cascade,
  black_library_player_id text not null references player_library(id) on delete cascade,
  result text not null check (result in ('1-0', '0-1', '0.5-0.5')),
  played_at timestamptz not null,
  source_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (username, source_type, source_id, source_game_id)
);

create index if not exists rated_games_username_order_idx
  on rated_games (username, played_at, source_order, source_type, source_id, source_game_id);
create index if not exists rated_games_white_player_idx on rated_games (white_library_player_id);
create index if not exists rated_games_black_player_idx on rated_games (black_library_player_id);

create table if not exists rating_events (
  id text primary key,
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  sequence_number integer not null,
  source_type text not null check (source_type in ('tournament', 'ongoing_table')),
  source_id text not null,
  source_game_id text not null,
  white_library_player_id text not null references player_library(id) on delete cascade,
  black_library_player_id text not null references player_library(id) on delete cascade,
  result text not null check (result in ('1-0', '0-1', '0.5-0.5')),
  white_rating_before integer not null,
  black_rating_before integer not null,
  white_rating_after integer not null,
  black_rating_after integer not null,
  white_delta integer not null,
  black_delta integer not null,
  k_white integer not null,
  k_black integer not null,
  played_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (username, source_type, source_id, source_game_id)
);

create index if not exists rating_events_username_sequence_idx
  on rating_events (username, sequence_number);
create index if not exists rating_events_white_player_idx on rating_events (white_library_player_id);
create index if not exists rating_events_black_player_idx on rating_events (black_library_player_id);

create table if not exists ongoing_tables (
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  table_id text not null,
  name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (username, table_id)
);

create index if not exists ongoing_tables_username_idx on ongoing_tables (username, updated_at desc);

create table if not exists ongoing_table_players (
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  table_id text not null,
  library_player_id text not null references player_library(id) on delete cascade,
  name_snapshot text not null,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (username, table_id, library_player_id),
  foreign key (username, table_id) references ongoing_tables(username, table_id) on delete cascade
);

create index if not exists ongoing_table_players_player_idx
  on ongoing_table_players (library_player_id);

create table if not exists ongoing_table_games (
  username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
  table_id text not null,
  game_id text not null,
  white_library_player_id text not null references player_library(id) on delete cascade,
  black_library_player_id text not null references player_library(id) on delete cascade,
  result text check (result in ('1-0', '0-1', '0.5-0.5', '0-0')),
  pairing_weight numeric,
  pairing_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (username, table_id, game_id),
  foreign key (username, table_id) references ongoing_tables(username, table_id) on delete cascade,
  check (
    (result is null and completed_at is null)
    or
    (result is not null and completed_at is not null)
  )
);

create index if not exists ongoing_table_games_table_idx
  on ongoing_table_games (username, table_id, created_at desc);
create index if not exists ongoing_table_games_white_player_idx
  on ongoing_table_games (white_library_player_id);
create index if not exists ongoing_table_games_black_player_idx
  on ongoing_table_games (black_library_player_id);

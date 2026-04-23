begin;

alter table tournament_player_entries
  drop constraint if exists tournament_player_entries_workspace_fkey,
  drop constraint if exists tournament_player_entries_tournament_id_fkey;

alter table tournament_match_entries
  drop constraint if exists tournament_match_entries_workspace_fkey,
  drop constraint if exists tournament_match_entries_tournament_id_fkey;

alter table tournament_player_entries
  drop constraint if exists tournament_player_entries_pkey;

alter table tournament_match_entries
  drop constraint if exists tournament_match_entries_pkey;

alter table tournament_records
  drop constraint if exists tournament_records_pkey;

alter table tournament_records
  add primary key (username, tournament_id);

alter table tournament_player_entries
  add primary key (username, tournament_id, tournament_player_id),
  add constraint tournament_player_entries_workspace_fkey
    foreign key (username, tournament_id)
    references tournament_records(username, tournament_id)
    on delete cascade;

alter table tournament_match_entries
  add primary key (username, tournament_id, match_id),
  add constraint tournament_match_entries_workspace_fkey
    foreign key (username, tournament_id)
    references tournament_records(username, tournament_id)
    on delete cascade;

commit;

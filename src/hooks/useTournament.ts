import { useEffect, useReducer } from 'react'
import {
  addPlayer,
  createDefaultTournament,
  generateNextRound,
  removePlayer,
  resetTournament,
  setMatchResult,
  setTotalRounds,
  setTournamentName,
  startTournament,
} from '../core/tournament'
import { loadTournamentCollection, saveTournamentCollection } from '../utils/storage'
import type { ManualMatchResult, Tournament } from '../types/tournament'

interface TournamentState {
  activeTournamentId: string
  tournaments: Tournament[]
}

export type TournamentAction =
  | { type: 'CREATE_TOURNAMENT'; payload?: { name?: string } }
  | { type: 'SELECT_TOURNAMENT'; payload: { tournamentId: string } }
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'REMOVE_PLAYER'; payload: { playerId: string } }
  | { type: 'SET_TOTAL_ROUNDS'; payload: { totalRounds: number } }
  | { type: 'SET_TOURNAMENT_NAME'; payload: { name: string } }
  | { type: 'START_TOURNAMENT' }
  | { type: 'SET_MATCH_RESULT'; payload: { matchId: string; result: ManualMatchResult } }
  | { type: 'GENERATE_NEXT_ROUND' }
  | { type: 'RESET_TOURNAMENT' }
  | { type: 'LOAD_TOURNAMENTS'; payload: TournamentState }

function updateActiveTournament(
  state: TournamentState,
  update: (tournament: Tournament) => Tournament,
): TournamentState {
  return {
    ...state,
    tournaments: state.tournaments.map((tournament) =>
      tournament.id === state.activeTournamentId ? update(tournament) : tournament,
    ),
  }
}

function buildTournamentName(tournaments: Tournament[]) {
  const tournamentNumber = tournaments.length + 1
  return tournamentNumber === 1 ? 'Chess Tournament' : `Chess Tournament ${tournamentNumber}`
}

function reducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'CREATE_TOURNAMENT': {
      const tournament = createDefaultTournament({
        name: action.payload?.name?.trim() || buildTournamentName(state.tournaments),
      })

      return {
        activeTournamentId: tournament.id,
        tournaments: [...state.tournaments, tournament],
      }
    }
    case 'SELECT_TOURNAMENT':
      return state.tournaments.some((tournament) => tournament.id === action.payload.tournamentId)
        ? { ...state, activeTournamentId: action.payload.tournamentId }
        : state
    case 'ADD_PLAYER':
      return updateActiveTournament(state, (tournament) => addPlayer(tournament, action.payload.name))
    case 'REMOVE_PLAYER':
      return updateActiveTournament(state, (tournament) => removePlayer(tournament, action.payload.playerId))
    case 'SET_TOTAL_ROUNDS':
      return updateActiveTournament(state, (tournament) =>
        setTotalRounds(tournament, action.payload.totalRounds),
      )
    case 'SET_TOURNAMENT_NAME':
      return updateActiveTournament(state, (tournament) =>
        setTournamentName(tournament, action.payload.name),
      )
    case 'START_TOURNAMENT':
      return updateActiveTournament(state, startTournament)
    case 'SET_MATCH_RESULT':
      return updateActiveTournament(state, (tournament) =>
        setMatchResult(tournament, action.payload.matchId, action.payload.result),
      )
    case 'GENERATE_NEXT_ROUND':
      return updateActiveTournament(state, generateNextRound)
    case 'RESET_TOURNAMENT':
      return updateActiveTournament(state, resetTournament)
    case 'LOAD_TOURNAMENTS':
      return action.payload
    default:
      return state
  }
}

function getInitialState(): TournamentState {
  try {
    const collection = loadTournamentCollection()

    return {
      activeTournamentId: collection.activeTournamentId,
      tournaments: collection.tournaments,
    }
  } catch {
    const fallbackTournament = createDefaultTournament()

    return {
      activeTournamentId: fallbackTournament.id,
      tournaments: [fallbackTournament],
    }
  }
}

export function useTournament() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState)

  useEffect(() => {
    saveTournamentCollection({
      activeTournamentId: state.activeTournamentId,
      tournaments: state.tournaments,
    })
  }, [state])

  const tournament =
    state.tournaments.find((entry) => entry.id === state.activeTournamentId) ?? state.tournaments[0]

  return {
    activeTournamentId: state.activeTournamentId,
    tournament,
    tournaments: state.tournaments,
    dispatch,
  }
}

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  addPlayer,
  createDefaultTournament,
  generateNextRound,
  renamePlayer,
  removePlayer,
  resetTournament,
  setMatchResult,
  setTotalRounds,
  setTournamentName,
  startTournament,
} from '../core/tournament'
import { loadTournamentCollection, saveTournamentCollection } from '../utils/storage'
import type { ManualMatchResult, Tournament } from '../types/tournament'
import type { TournamentCollection } from '../types/workspace'

type TournamentState = TournamentCollection

export type TournamentAction =
  | { type: 'CREATE_TOURNAMENT'; payload?: { name?: string } }
  | { type: 'SELECT_TOURNAMENT'; payload: { tournamentId: string } }
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'RENAME_PLAYER'; payload: { playerId: string; name: string } }
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
    case 'RENAME_PLAYER':
      return updateActiveTournament(state, (tournament) =>
        renamePlayer(tournament, action.payload.playerId, action.payload.name),
      )
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

function createFallbackState(): TournamentState {
  const fallbackTournament = createDefaultTournament()

  return {
    activeTournamentId: fallbackTournament.id,
    tournaments: [fallbackTournament],
  }
}

export function useTournament(enabled: boolean) {
  const [state, dispatch] = useReducer(reducer, undefined, createFallbackState)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const hydratedRef = useRef(false)
  const lastSyncedPayloadRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      hydratedRef.current = false
      lastSyncedPayloadRef.current = null
      setLoading(false)
      setError(null)
      dispatch({ type: 'LOAD_TOURNAMENTS', payload: createFallbackState() })
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        const collection = await loadTournamentCollection()

        if (cancelled) {
          return
        }

        const nextState = {
          activeTournamentId: collection.activeTournamentId,
          tournaments: collection.tournaments,
        }

        hydratedRef.current = true
        lastSyncedPayloadRef.current = JSON.stringify(nextState)
        dispatch({ type: 'LOAD_TOURNAMENTS', payload: nextState })
        setError(null)
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load workspace')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled])

  const serializedState = useMemo(
    () =>
      JSON.stringify({
        activeTournamentId: state.activeTournamentId,
        tournaments: state.tournaments,
      } satisfies TournamentCollection),
    [state.activeTournamentId, state.tournaments],
  )

  useEffect(() => {
    if (!enabled || !hydratedRef.current || serializedState === lastSyncedPayloadRef.current) {
      return
    }

    const nextCollection = JSON.parse(serializedState) as TournamentCollection
    lastSyncedPayloadRef.current = serializedState

    void saveTournamentCollection(nextCollection).catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save workspace')
      lastSyncedPayloadRef.current = null
    })
  }, [enabled, serializedState])

  const tournament =
    state.tournaments.find((entry) => entry.id === state.activeTournamentId) ?? state.tournaments[0]

  return {
    activeTournamentId: state.activeTournamentId,
    tournament,
    tournaments: state.tournaments,
    dispatch,
    loading,
    error,
  }
}

import { useEffect, useReducer } from 'react'
import { addPlayer, createDefaultTournament, generateNextRound, removePlayer, resetTournament, setMatchResult, setTotalRounds, setTournamentName, startTournament } from '../core/tournament'
import { clearTournament, loadTournament, saveTournament } from '../utils/storage'
import type { ManualMatchResult, Tournament } from '../types/tournament'

export type TournamentAction =
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'REMOVE_PLAYER'; payload: { playerId: string } }
  | { type: 'SET_TOTAL_ROUNDS'; payload: { totalRounds: number } }
  | { type: 'SET_TOURNAMENT_NAME'; payload: { name: string } }
  | { type: 'START_TOURNAMENT' }
  | { type: 'SET_MATCH_RESULT'; payload: { matchId: string; result: ManualMatchResult } }
  | { type: 'GENERATE_NEXT_ROUND' }
  | { type: 'RESET_TOURNAMENT' }
  | { type: 'LOAD_TOURNAMENT'; payload: { tournament: Tournament } }

function reducer(state: Tournament, action: TournamentAction): Tournament {
  switch (action.type) {
    case 'ADD_PLAYER':
      return addPlayer(state, action.payload.name)
    case 'REMOVE_PLAYER':
      return removePlayer(state, action.payload.playerId)
    case 'SET_TOTAL_ROUNDS':
      return setTotalRounds(state, action.payload.totalRounds)
    case 'SET_TOURNAMENT_NAME':
      return setTournamentName(state, action.payload.name)
    case 'START_TOURNAMENT':
      return startTournament(state)
    case 'SET_MATCH_RESULT':
      return setMatchResult(state, action.payload.matchId, action.payload.result)
    case 'GENERATE_NEXT_ROUND':
      return generateNextRound(state)
    case 'RESET_TOURNAMENT':
      return resetTournament()
    case 'LOAD_TOURNAMENT':
      return action.payload.tournament
    default:
      return state
  }
}

export function useTournament() {
  const [tournament, dispatch] = useReducer(reducer, undefined, () => {
    try {
      return loadTournament()
    } catch {
      return createDefaultTournament()
    }
  })

  useEffect(() => {
    saveTournament(tournament)
  }, [tournament])

  const safeDispatch = (action: TournamentAction) => {
    if (action.type === 'RESET_TOURNAMENT') {
      clearTournament()
    }

    dispatch(action)
  }

  return {
    tournament,
    dispatch: safeDispatch,
  }
}

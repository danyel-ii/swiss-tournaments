import { useMemo, useState } from 'react'
import { ActionBar } from './components/ActionBar'
import { PairingsView } from './components/PairingsView'
import { PlayerList } from './components/PlayerList'
import { RoundNavigator } from './components/RoundNavigator'
import { StandingsTable } from './components/StandingsTable'
import { TournamentControls } from './components/TournamentControls'
import { TournamentHeader } from './components/TournamentHeader'
import { TournamentPulse } from './components/TournamentPulse'
import {
  getCurrentRoundMatches,
  getRoundMatches,
  getStandings,
  hasTournamentFinished,
  hasTournamentStarted,
  isCurrentRoundComplete,
} from './core/ranking'
import { useTournament } from './hooks/useTournament'
import type { ManualMatchResult } from './types/tournament'
import { downloadTournamentExport } from './utils/export'

function App() {
  const { tournament, dispatch } = useTournament()
  const [playerName, setPlayerName] = useState('')
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [selectedRound, setSelectedRound] = useState(0)

  const standings = useMemo(
    () => getStandings(tournament.players, tournament.matches),
    [tournament.matches, tournament.players],
  )
  const currentRoundMatches = useMemo(
    () => getCurrentRoundMatches(tournament),
    [tournament],
  )
  const availableRounds = useMemo(
    () =>
      Array.from(
        new Set(tournament.matches.map((match) => match.round)),
      ).sort((left, right) => left - right),
    [tournament.matches],
  )
  const viewedRound =
    selectedRound > 0 && selectedRound <= tournament.currentRound
      ? selectedRound
      : tournament.currentRound
  const viewedMatches = useMemo(() => {
    if (viewedRound < 1) {
      return []
    }

    return getRoundMatches(tournament.matches, viewedRound)
  }, [tournament.matches, viewedRound])
  const isViewingCurrentRound = viewedRound === tournament.currentRound
  const resultsEntered = currentRoundMatches.filter(
    (match) => !match.isBye && match.result !== null,
  ).length
  const resultTarget = currentRoundMatches.filter((match) => !match.isBye).length
  const roundComplete =
    tournament.currentRound > 0 &&
    isCurrentRoundComplete(tournament.matches, tournament.currentRound)
  const inProgress = hasTournamentStarted(tournament)
  const completed = hasTournamentFinished(tournament)
  const leader = standings[0]
  const roundsError =
    tournament.totalRounds >= 1 && tournament.totalRounds <= 20
      ? null
      : 'Rounds must be between 1 and 20'

  const handleAddPlayer = () => {
    const trimmedName = playerName.trim()

    if (!trimmedName) {
      setPlayerError('Player name cannot be empty')
      setDuplicateWarning(null)
      return
    }

    const duplicateExists = tournament.players.some(
      (player) => player.name.trim().toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
    )

    dispatch({
      type: 'ADD_PLAYER',
      payload: { name: trimmedName },
    })
    setPlayerName('')
    setPlayerError(null)
    setDuplicateWarning(
      duplicateExists ? `Duplicate name warning: "${trimmedName}" already exists.` : null,
    )
  }

  const handleStart = () => {
    if (tournament.players.length < 2) {
      setPlayerError('Add at least 2 players to start a tournament')
      return
    }

    dispatch({ type: 'START_TOURNAMENT' })
    setSelectedRound(1)
  }

  const handleSetResult = (matchId: string, result: ManualMatchResult) => {
    dispatch({
      type: 'SET_MATCH_RESULT',
      payload: { matchId, result },
    })
  }

  const handleReset = () => {
    const confirmed = window.confirm('Reset the tournament and clear saved state?')

    if (!confirmed) {
      return
    }

    dispatch({ type: 'RESET_TOURNAMENT' })
    setSelectedRound(0)
    setPlayerName('')
    setPlayerError(null)
    setDuplicateWarning(null)
  }

  const canGenerateNextRound =
    tournament.status === 'in_progress' &&
    roundComplete &&
    tournament.currentRound < tournament.totalRounds

  const handleGenerateNextRound = () => {
    if (!canGenerateNextRound) {
      return
    }

    const nextRound = tournament.currentRound + 1
    dispatch({ type: 'GENERATE_NEXT_ROUND' })
    setSelectedRound(nextRound)
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <TournamentHeader tournament={tournament} />

        <TournamentControls
          tournament={tournament}
          roundsError={roundsError}
          onNameChange={(value) =>
            dispatch({ type: 'SET_TOURNAMENT_NAME', payload: { name: value } })
          }
          onRoundsChange={(value) =>
            dispatch({ type: 'SET_TOTAL_ROUNDS', payload: { totalRounds: value } })
          }
          onStart={handleStart}
          onExport={() => downloadTournamentExport(tournament)}
          onReset={handleReset}
        />

        <TournamentPulse
          currentRound={tournament.currentRound}
          totalRounds={tournament.totalRounds}
          activeMatches={currentRoundMatches.filter((match) => !match.isBye).length}
          leader={leader?.name ?? 'TBD'}
          leaderScore={leader?.score ?? 0}
        />

        <RoundNavigator
          rounds={availableRounds}
          selectedRound={viewedRound}
          currentRound={tournament.currentRound}
          onSelectRound={setSelectedRound}
        />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
          <PlayerList
            players={tournament.players}
            status={tournament.status}
            playerName={playerName}
            error={playerError}
            duplicateWarning={duplicateWarning}
            onPlayerNameChange={(value) => {
              setPlayerName(value)
              if (playerError) {
                setPlayerError(null)
              }
            }}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={(playerId) =>
              dispatch({ type: 'REMOVE_PLAYER', payload: { playerId } })
            }
          />

          <StandingsTable
            standings={standings}
            players={tournament.players}
            matches={tournament.matches}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <PairingsView
            hasStarted={inProgress}
            matches={viewedMatches}
            players={tournament.players}
            viewedRound={viewedRound}
            isViewingCurrentRound={isViewingCurrentRound}
            resultsEntered={resultsEntered}
            resultTarget={resultTarget}
            isRoundComplete={roundComplete}
            onSetResult={handleSetResult}
          />

          <ActionBar
            canGenerateNextRound={canGenerateNextRound}
            isCompleted={completed}
            currentRound={tournament.currentRound}
            totalRounds={tournament.totalRounds}
            onGenerateNextRound={handleGenerateNextRound}
          />
        </div>
      </div>
    </div>
  )
}

export default App

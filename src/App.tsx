import { useMemo, useState } from 'react'
import { DashboardView } from './components/DashboardView'
import { StandingsFocusView } from './components/StandingsFocusView'
import { TournamentHeader } from './components/TournamentHeader'
import { ViewTabs } from './components/ViewTabs'
import { useI18n } from './useI18n'
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
  const { t } = useI18n()
  const [playerName, setPlayerName] = useState('')
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [selectedRound, setSelectedRound] = useState(0)
  const [activeView, setActiveView] = useState<'dashboard' | 'standings'>('dashboard')

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
      : t.controls.roundsError

  const handleAddPlayer = () => {
    const trimmedName = playerName.trim()

    if (!trimmedName) {
      setPlayerError(t.players.errors.emptyName)
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
      duplicateExists ? t.players.errors.duplicateWarning(trimmedName) : null,
    )
  }

  const handleStart = () => {
    if (tournament.players.length < 2) {
      setPlayerError(t.players.errors.minPlayers)
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
    const confirmed = window.confirm(t.controls.resetConfirm)

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
    <div className="min-h-screen px-4 py-8 text-[var(--theme-text)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <TournamentHeader tournament={tournament} />

        <ViewTabs activeView={activeView} onSelectView={setActiveView} />

        {activeView === 'standings' ? (
          <StandingsFocusView
            standings={standings}
            currentRound={tournament.currentRound}
            totalRounds={tournament.totalRounds}
          />
        ) : (
          <DashboardView
            tournament={tournament}
            standings={standings}
            currentRoundMatches={currentRoundMatches}
            viewedMatches={viewedMatches}
            availableRounds={availableRounds}
            viewedRound={viewedRound}
            isViewingCurrentRound={isViewingCurrentRound}
            resultsEntered={resultsEntered}
            resultTarget={resultTarget}
            roundComplete={roundComplete}
            roundsError={roundsError}
            playerName={playerName}
            playerError={playerError}
            duplicateWarning={duplicateWarning}
            canGenerateNextRound={canGenerateNextRound}
            completed={completed}
            inProgress={inProgress}
            leaderName={leader?.name ?? t.common.unknown}
            leaderScore={leader?.score ?? 0}
            onNameChange={(value) =>
              dispatch({ type: 'SET_TOURNAMENT_NAME', payload: { name: value } })
            }
            onRoundsChange={(value) =>
              dispatch({ type: 'SET_TOTAL_ROUNDS', payload: { totalRounds: value } })
            }
            onStart={handleStart}
            onExport={() => downloadTournamentExport(tournament)}
            onReset={handleReset}
            onSelectRound={setSelectedRound}
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
            onSetResult={handleSetResult}
            onGenerateNextRound={handleGenerateNextRound}
          />
        )}
      </div>
    </div>
  )
}

export default App

import { type Dispatch, useMemo, useState } from 'react'
import { DashboardView } from './components/DashboardView'
import { LoginView } from './components/LoginView'
import { StandingsFocusView } from './components/StandingsFocusView'
import { TournamentDirectoryView } from './components/TournamentDirectoryView'
import { TournamentHeader } from './components/TournamentHeader'
import { ViewTabs } from './components/ViewTabs'
import { useAuth } from './hooks/useAuth'
import { useI18n } from './useI18n'
import {
  getCurrentRoundMatches,
  getPlayersEnteredByRound,
  getRoundMatches,
  getStandings,
  hasTournamentFinished,
  hasTournamentStarted,
  isCurrentRoundComplete,
} from './core/ranking'
import { type TournamentAction, useTournament } from './hooks/useTournament'
import type { Tournament } from './types/tournament'
import type { ManualMatchResult } from './types/tournament'
import { downloadTournamentExport } from './utils/export'

interface TournamentWorkspaceProps {
  username: string
  tournament: Tournament
  tournaments: Tournament[]
  activeTournamentId: string
  dispatch: Dispatch<TournamentAction>
  syncError: string | null
  onLogout: () => void
  activeView: 'dashboard' | 'standings' | 'tournaments'
  setActiveView: (view: 'dashboard' | 'standings' | 'tournaments') => void
}

function TournamentWorkspace({
  username,
  tournament,
  tournaments,
  activeTournamentId,
  dispatch,
  syncError,
  onLogout,
  activeView,
  setActiveView,
}: TournamentWorkspaceProps) {
  const { t } = useI18n()
  const [playerName, setPlayerName] = useState('')
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [selectedRound, setSelectedRound] = useState(
    tournament.currentRound > 0 ? tournament.currentRound : 0,
  )

  const standings = useMemo(
    () => getStandings(getPlayersEnteredByRound(tournament.players, tournament.currentRound), tournament.matches),
    [tournament.currentRound, tournament.matches, tournament.players],
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
        <TournamentHeader tournament={tournament} username={username} onLogout={onLogout} />

        {syncError ? (
          <div className="theme-panel rounded-3xl px-6 py-4 text-sm text-[var(--theme-red)]">
            {t.auth.workspaceError(syncError)}
          </div>
        ) : null}

        <ViewTabs activeView={activeView} onSelectView={setActiveView} />

        {activeView === 'tournaments' ? (
          <TournamentDirectoryView
            tournaments={tournaments}
            activeTournamentId={activeTournamentId}
            onCreateTournament={() => {
              dispatch({ type: 'CREATE_TOURNAMENT' })
              setActiveView('dashboard')
            }}
            onOpenTournament={(tournamentId) => {
              dispatch({ type: 'SELECT_TOURNAMENT', payload: { tournamentId } })
              setActiveView('dashboard')
            }}
          />
        ) : activeView === 'standings' ? (
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
            onRenamePlayer={(playerId, name) =>
              dispatch({ type: 'RENAME_PLAYER', payload: { playerId, name } })
            }
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

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen px-4 py-8 text-[var(--theme-text)]">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <section className="theme-panel w-full rounded-[2rem] p-8 text-center">
          <p className="theme-copy font-data text-base">{label}</p>
        </section>
      </div>
    </div>
  )
}

function App() {
  const { t } = useI18n()
  const auth = useAuth()
  const { tournament, tournaments, activeTournamentId, dispatch, loading, error } = useTournament(
    auth.user !== null,
  )
  const [activeView, setActiveView] = useState<'dashboard' | 'standings' | 'tournaments'>('dashboard')

  if (auth.loading) {
    return <LoadingScreen label={t.auth.loadingSession} />
  }

  if (!auth.user) {
    return (
      <LoginView
        error={auth.error}
        onLogin={async (username, password) => {
          try {
            await auth.login(username, password)
          } catch (loginError) {
            auth.setError(loginError instanceof Error ? loginError.message : 'Unable to sign in')
          }
        }}
      />
    )
  }

  if (loading) {
    return <LoadingScreen label={t.auth.loadingWorkspace} />
  }

  return (
    <TournamentWorkspace
      username={auth.user.username}
      key={tournament.id}
      tournament={tournament}
      tournaments={tournaments}
      activeTournamentId={activeTournamentId}
      dispatch={dispatch}
      syncError={error}
      onLogout={() => {
        void auth.logout()
      }}
      activeView={activeView}
      setActiveView={setActiveView}
    />
  )
}

export default App

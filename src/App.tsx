import { type Dispatch, useMemo, useState } from 'react'
import { DashboardView } from './components/DashboardView'
import { InstallPrompt } from './components/InstallPrompt'
import { LiveView } from './components/LiveView'
import { LoginView } from './components/LoginView'
import { StandingsFocusView } from './components/StandingsFocusView'
import { StatisticsView } from './components/StatisticsView'
import { TournamentDirectoryView } from './components/TournamentDirectoryView'
import { TournamentHeader } from './components/TournamentHeader'
import { ViewTabs } from './components/ViewTabs'
import { useAuth } from './hooks/useAuth'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { usePlayerLibrary } from './hooks/usePlayerLibrary'
import { usePlayerStats } from './hooks/usePlayerStats'
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
import type { LibraryPlayer } from './types/library'
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
  isMutatingWorkspace: boolean
  onLogout: () => void
  onDeleteTournament: (tournamentId: string) => Promise<void>
  onClearAllData: () => Promise<void>
  onDeleteLibraryPlayer: (playerId: string) => Promise<void>
  libraryPlayers: LibraryPlayer[]
  libraryLoading: boolean
  libraryDeleting: boolean
  libraryError: string | null
  statisticsPlayers: ReturnType<typeof usePlayerStats>['players']
  statisticsDetail: ReturnType<typeof usePlayerStats>['detail']
  statisticsLoading: boolean
  statisticsDeleting: boolean
  statisticsError: string | null
  onSelectStatsPlayer: (playerId: string | null) => void
  onDeleteStatsPlayer: (playerId: string) => Promise<void>
  activeView: 'dashboard' | 'live' | 'standings' | 'tournaments' | 'statistics'
  setActiveView: (view: 'dashboard' | 'live' | 'standings' | 'tournaments' | 'statistics') => void
}

function TournamentWorkspace({
  username,
  tournament,
  tournaments,
  activeTournamentId,
  dispatch,
  syncError,
  isMutatingWorkspace,
  onLogout,
  onDeleteTournament,
  onClearAllData,
  onDeleteLibraryPlayer,
  libraryPlayers,
  libraryLoading,
  libraryDeleting,
  libraryError,
  statisticsPlayers,
  statisticsDetail,
  statisticsLoading,
  statisticsDeleting,
  statisticsError,
  onSelectStatsPlayer,
  onDeleteStatsPlayer,
  activeView,
  setActiveView,
}: TournamentWorkspaceProps) {
  const { language, setLanguage, t } = useI18n()
  const [playerName, setPlayerName] = useState('')
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [liveMenuOpen, setLiveMenuOpen] = useState(false)
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
  const isLiveView = activeView === 'live'
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
        {isLiveView ? (
          <section className="theme-panel rounded-3xl px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="theme-heading truncate font-display text-2xl font-bold tracking-[-0.03em] md:text-3xl">
                  {tournament.name}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setLiveMenuOpen((current) => !current)}
                aria-label={liveMenuOpen ? t.common.hide : t.common.open}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--theme-surface)] transition"
              >
                <span className="flex flex-col gap-1.5">
                  <span className="block h-0.5 w-5 rounded-full bg-[var(--theme-text)]" />
                  <span className="block h-0.5 w-5 rounded-full bg-[var(--theme-text)]" />
                  <span className="block h-0.5 w-5 rounded-full bg-[var(--theme-text)]" />
                </span>
              </button>
            </div>
          </section>
        ) : (
          <TournamentHeader tournament={tournament} username={username} onLogout={onLogout} />
        )}

        {syncError ? (
          <div className="theme-panel rounded-3xl px-6 py-4 text-sm text-[var(--theme-red)]">
            {t.auth.workspaceError(syncError)}
          </div>
        ) : null}

        {isLiveView ? (
          liveMenuOpen ? (
            <section className="theme-panel rounded-3xl p-4">
              <div className="space-y-4">
                <ViewTabs
                  activeView={activeView}
                  onSelectView={(view) => {
                    setActiveView(view)
                    setLiveMenuOpen(false)
                  }}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <div className="theme-copy rounded-full bg-[var(--theme-surface)] px-4 py-2 text-sm">
                    {t.header.signedInAs(username)}
                  </div>

                  <label className="theme-copy flex items-center gap-2 text-sm">
                    <span className="font-display font-semibold">{t.header.languageLabel}</span>
                    <select
                      value={language}
                      onChange={(event) => setLanguage(event.target.value as typeof language)}
                      className="theme-input font-data rounded-full border px-3 py-2 outline-none transition"
                    >
                      <option value="en">{t.common.english}</option>
                      <option value="de">{t.common.german}</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="font-display rounded-full bg-[var(--theme-surface)] px-4 py-2 text-sm font-semibold transition"
                  >
                    {t.header.logout}
                  </button>
                </div>
              </div>
            </section>
          ) : null
        ) : (
          <ViewTabs activeView={activeView} onSelectView={setActiveView} />
        )}

        {activeView === 'tournaments' ? (
          <TournamentDirectoryView
            tournaments={tournaments}
            activeTournamentId={activeTournamentId}
            disabled={isMutatingWorkspace}
            onCreateTournament={() => {
              dispatch({ type: 'CREATE_TOURNAMENT' })
              setActiveView('dashboard')
            }}
            onOpenTournament={(tournamentId) => {
              dispatch({ type: 'SELECT_TOURNAMENT', payload: { tournamentId } })
              setActiveView('dashboard')
            }}
            onDeleteTournament={async (tournamentId) => {
              await onDeleteTournament(tournamentId)
              setActiveView('tournaments')
            }}
            onClearAllData={async () => {
              await onClearAllData()
              setActiveView('dashboard')
            }}
          />
        ) : activeView === 'live' ? (
          <LiveView
            currentRound={tournament.currentRound}
            totalRounds={tournament.totalRounds}
            status={tournament.status}
            matches={currentRoundMatches}
            players={tournament.players}
            resultsEntered={resultsEntered}
            resultTarget={resultTarget}
            roundComplete={roundComplete}
            canGenerateNextRound={canGenerateNextRound}
            completed={completed}
            onSetResult={handleSetResult}
            onGenerateNextRound={handleGenerateNextRound}
          />
        ) : activeView === 'standings' ? (
          <StandingsFocusView
            standings={standings}
            currentRound={tournament.currentRound}
            totalRounds={tournament.totalRounds}
          />
        ) : activeView === 'statistics' ? (
          <StatisticsView
            players={statisticsPlayers}
            detail={statisticsDetail}
            loading={statisticsLoading}
            deleting={statisticsDeleting}
            error={statisticsError}
            onSelectPlayer={onSelectStatsPlayer}
            onDeletePlayer={onDeleteStatsPlayer}
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
            libraryPlayers={libraryPlayers}
            libraryLoading={libraryLoading}
            libraryDeleting={libraryDeleting}
            libraryError={libraryError}
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
            onAddLibraryPlayer={(player) =>
              dispatch({ type: 'ADD_PLAYER', payload: { name: player.name, libraryPlayerId: player.id } })
            }
            onDeleteLibraryPlayer={(player) => onDeleteLibraryPlayer(player.id)}
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
  const installPrompt = useInstallPrompt()
  const {
    tournament,
    tournaments,
    activeTournamentId,
    dispatch,
    deleteTournament,
    clearAllData,
    loading,
    mutating,
    error,
  } = useTournament(
    auth.user !== null,
  )
  const [activeView, setActiveView] = useState<'dashboard' | 'live' | 'standings' | 'tournaments' | 'statistics'>('dashboard')
  const [selectedStatsPlayerId, setSelectedStatsPlayerId] = useState<string | null>(null)
  const workspaceRefreshKey = useMemo(
    () =>
      tournaments
        .map((entry) => `${entry.id}:${entry.updatedAt}:${entry.players.length}:${entry.matches.length}`)
        .join('|'),
    [tournaments],
  )
  const playerLibrary = usePlayerLibrary(auth.user !== null, workspaceRefreshKey)
  const playerStats = usePlayerStats(auth.user !== null, workspaceRefreshKey, selectedStatsPlayerId)

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
    <>
      {installPrompt.visible ? (
        <div className="fixed inset-x-4 bottom-4 z-50 md:hidden">
          <InstallPrompt
            isIosManualInstall={installPrompt.isIosManualInstall}
            onInstall={() => {
              void installPrompt.promptInstall()
            }}
            onDismiss={installPrompt.dismiss}
          />
        </div>
      ) : null}

      <TournamentWorkspace
        username={auth.user.username}
        key={tournament.id}
        tournament={tournament}
        tournaments={tournaments}
        activeTournamentId={activeTournamentId}
        dispatch={dispatch}
        syncError={error}
        isMutatingWorkspace={mutating}
        onLogout={() => {
          void auth.logout()
        }}
        onDeleteTournament={deleteTournament}
        onClearAllData={clearAllData}
        onDeleteLibraryPlayer={playerLibrary.deletePlayer}
        libraryPlayers={playerLibrary.players}
        libraryLoading={playerLibrary.loading}
        libraryDeleting={playerLibrary.mutating}
        libraryError={playerLibrary.error}
        statisticsPlayers={playerStats.players}
        statisticsDetail={playerStats.detail}
        statisticsLoading={playerStats.loading}
        statisticsDeleting={playerStats.mutating}
        statisticsError={playerStats.error}
        onSelectStatsPlayer={setSelectedStatsPlayerId}
        onDeleteStatsPlayer={playerStats.deletePlayer}
        activeView={activeView}
        setActiveView={setActiveView}
      />
    </>
  )
}

export default App

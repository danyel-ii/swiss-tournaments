import { ActionBar } from './ActionBar'
import { PairingsView } from './PairingsView'
import { PlayerList } from './PlayerList'
import { RoundNavigator } from './RoundNavigator'
import { StandingsTable } from './StandingsTable'
import { TournamentControls } from './TournamentControls'
import { TournamentPulse } from './TournamentPulse'
import type { LibraryPlayer } from '../types/library'
import type { ManualMatchResult, Match, PlayerStanding, Tournament } from '../types/tournament'

interface DashboardViewProps {
  tournament: Tournament
  standings: PlayerStanding[]
  currentRoundMatches: Match[]
  viewedMatches: Match[]
  availableRounds: number[]
  viewedRound: number
  isViewingCurrentRound: boolean
  resultsEntered: number
  resultTarget: number
  roundComplete: boolean
  roundsError: string | null
  sendingReportEmail: boolean
  libraryPlayers: LibraryPlayer[]
  libraryLoading: boolean
  playerName: string
  playerError: string | null
  duplicateWarning: string | null
  canGenerateNextRound: boolean
  completed: boolean
  inProgress: boolean
  leaderName: string
  leaderScore: number
  onNameChange: (value: string) => void
  onRoundsChange: (value: number) => void
  onStart: () => void
  onExport: () => void
  onEmailReport: () => void
  onReset: () => void
  onSelectRound: (round: number) => void
  onPlayerNameChange: (value: string) => void
  onAddPlayer: () => void
  onAddLibraryPlayer: (player: LibraryPlayer) => void
  onRenamePlayer: (playerId: string, name: string) => void
  onRemovePlayer: (playerId: string) => void
  onSetResult: (matchId: string, result: ManualMatchResult) => void
  onGenerateNextRound: () => void
}

export function DashboardView({
  tournament,
  standings,
  currentRoundMatches,
  viewedMatches,
  availableRounds,
  viewedRound,
  isViewingCurrentRound,
  resultsEntered,
  resultTarget,
  roundComplete,
  roundsError,
  sendingReportEmail,
  libraryPlayers,
  libraryLoading,
  playerName,
  playerError,
  duplicateWarning,
  canGenerateNextRound,
  completed,
  inProgress,
  leaderName,
  leaderScore,
  onNameChange,
  onRoundsChange,
  onStart,
  onExport,
  onEmailReport,
  onReset,
  onSelectRound,
  onPlayerNameChange,
  onAddPlayer,
  onAddLibraryPlayer,
  onRenamePlayer,
  onRemovePlayer,
  onSetResult,
  onGenerateNextRound,
}: DashboardViewProps) {
  return (
    <>
      <TournamentControls
        key={`${tournament.id}:${tournament.name}`}
        tournament={tournament}
        roundsError={roundsError}
        sendingReportEmail={sendingReportEmail}
        onNameChange={onNameChange}
        onRoundsChange={onRoundsChange}
        onStart={onStart}
        onExport={onExport}
        onEmailReport={onEmailReport}
        onReset={onReset}
      />

      <TournamentPulse
        currentRound={tournament.currentRound}
        totalRounds={tournament.totalRounds}
        activeMatches={currentRoundMatches.filter((match) => !match.isBye).length}
        leader={leaderName}
        leaderScore={leaderScore}
      />

      <RoundNavigator
        rounds={availableRounds}
        selectedRound={viewedRound}
        currentRound={tournament.currentRound}
        onSelectRound={onSelectRound}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr] xl:items-start">
        <PlayerList
          players={tournament.players}
          status={tournament.status}
          currentRound={tournament.currentRound}
          libraryPlayers={libraryPlayers}
          libraryLoading={libraryLoading}
          playerName={playerName}
          error={playerError}
          duplicateWarning={duplicateWarning}
          onPlayerNameChange={onPlayerNameChange}
          onAddPlayer={onAddPlayer}
          onAddLibraryPlayer={onAddLibraryPlayer}
          onRenamePlayer={onRenamePlayer}
          onRemovePlayer={onRemovePlayer}
        />

        <StandingsTable
          standings={standings}
          players={tournament.players}
          matches={tournament.matches}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-start">
        <PairingsView
          hasStarted={inProgress}
          matches={viewedMatches}
          players={tournament.players}
          viewedRound={viewedRound}
          isViewingCurrentRound={isViewingCurrentRound}
          resultsEntered={resultsEntered}
          resultTarget={resultTarget}
          isRoundComplete={roundComplete}
          onSetResult={onSetResult}
        />

        <ActionBar
          canGenerateNextRound={canGenerateNextRound}
          isCompleted={completed}
          currentRound={tournament.currentRound}
          totalRounds={tournament.totalRounds}
          onGenerateNextRound={onGenerateNextRound}
        />
      </div>
    </>
  )
}

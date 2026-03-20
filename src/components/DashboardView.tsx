import { ActionBar } from './ActionBar'
import { PairingsView } from './PairingsView'
import { PlayerList } from './PlayerList'
import { RoundNavigator } from './RoundNavigator'
import { StandingsTable } from './StandingsTable'
import { TournamentControls } from './TournamentControls'
import { TournamentPulse } from './TournamentPulse'
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
  onReset: () => void
  onSelectRound: (round: number) => void
  onPlayerNameChange: (value: string) => void
  onAddPlayer: () => void
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
  onReset,
  onSelectRound,
  onPlayerNameChange,
  onAddPlayer,
  onRemovePlayer,
  onSetResult,
  onGenerateNextRound,
}: DashboardViewProps) {
  return (
    <>
      <TournamentControls
        tournament={tournament}
        roundsError={roundsError}
        onNameChange={onNameChange}
        onRoundsChange={onRoundsChange}
        onStart={onStart}
        onExport={onExport}
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
          playerName={playerName}
          error={playerError}
          duplicateWarning={duplicateWarning}
          onPlayerNameChange={onPlayerNameChange}
          onAddPlayer={onAddPlayer}
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

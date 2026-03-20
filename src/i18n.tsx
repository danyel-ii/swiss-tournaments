import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { TournamentStatus } from './types/tournament'

export type Language = 'en' | 'de'

const LANGUAGE_STORAGE_KEY = 'chessTournamentLanguage'

type TranslationSet = {
  common: {
    english: string
    german: string
    bye: string
    unknown: string
    live: string
    yes: string
    no: string
    open: string
    hide: string
    setup: string
    selectResult: string
    pending: string
    autoPoint: string
    playedWhite: string
    playedBlack: string
  }
  header: {
    title: string
    playersReady: (count: number) => string
    statusLabel: (status: TournamentStatus, currentRound: number, totalRounds: number) => string
    languageLabel: string
  }
  navigation: {
    dashboard: string
    standings: string
  }
  controls: {
    tournamentName: string
    totalRounds: string
    roundsError: string
    startTournament: string
    exportReport: string
    resetTournament: string
    resetConfirm: string
  }
  pulse: {
    currentRound: string
    activeMatches: string
    leader: string
    setupValue: string
    roundOf: (currentRound: number, totalRounds: number) => string
    configureRounds: (totalRounds: number) => string
    boardsOnDesk: string
    topScore: (score: string) => string
    currentRoundHelpLabel: string
    currentRoundHelpTitle: string
    currentRoundHelpBody: string
    activeMatchesHelpLabel: string
    activeMatchesHelpTitle: string
    activeMatchesHelpBody: string
    leaderHelpLabel: string
    leaderHelpTitle: string
    leaderHelpBody: string
  }
  rounds: {
    archiveTitle: string
    archiveSubtitle: string
    round: (round: number) => string
  }
  players: {
    title: string
    subtitle: string
    playerName: string
    addPlayer: string
    noPlayers: string
    seed: (seed: number) => string
    remove: string
    errors: {
      emptyName: string
      minPlayers: string
      duplicateWarning: (name: string) => string
    }
  }
  standings: {
    title: string
    subtitle: string
    tooltipLabel: string
    tooltipTitle: string
    tooltipBody: string
    rank: string
    player: string
    seed: string
    score: string
    scoreHelpLabel: string
    scoreHelpTitle: string
    scoreHelpBody: string
    buchholz: string
    buchholzHelpLabel: string
    buchholzHelpTitle: string
    buchholzHelpBody: string
    colors: string
    colorsHelpLabel: string
    colorsHelpTitle: string
    colorsHelpBody: string
    details: string
    summary: string
    opponentResults: string
    opponentsFaced: (count: number) => string
    receivedBye: (value: boolean) => string
    colorPath: (value: string) => string
    noCompletedRounds: string
    roundBoard: (round: number, board: number) => string
    focusTitle: string
    focusSubtitle: string
    focusEmpty: string
    focusRound: (currentRound: number, totalRounds: number) => string
    focusLeader: (name: string, score: string) => string
  }
  pairings: {
    title: string
    workflowLabel: string
    workflowTitle: string
    workflowBody: string
    roundComplete: string
    resultsEntered: (entered: number, target: number) => string
    archivedRound: (round: number) => string
    waiting: string
    complete: string
    incomplete: string
    archive: string
    board: string
    white: string
    black: string
    result: string
    allowedResultsLabel: string
    allowedResultsTitle: string
    allowedResultsBody: string
    resultForBoard: (board: number) => string
  }
  actions: {
    completedMessage: (totalRounds: number) => string
    title: string
    setupPrompt: string
    generatePrompt: string
    finalRoundComplete: string
    generateNextRound: string
  }
}

const translations: Record<Language, TranslationSet> = {
  en: {
    common: {
      english: 'English',
      german: 'German',
      bye: 'BYE',
      unknown: 'Unknown',
      live: 'Live',
      yes: 'Yes',
      no: 'No',
      open: 'Open',
      hide: 'Hide',
      setup: 'Setup',
      selectResult: 'Select result',
      pending: 'Pending',
      autoPoint: 'Auto point',
      playedWhite: 'Played White',
      playedBlack: 'Played Black',
    },
    header: {
      title: 'Swiss Chess Tournament',
      playersReady: (count) => `${count} players ready to play`,
      statusLabel: (status, currentRound, totalRounds) => {
        if (status === 'setup') {
          return 'Setup'
        }

        if (status === 'completed') {
          return 'Completed'
        }

        return `Round ${currentRound} of ${totalRounds}`
      },
      languageLabel: 'Language',
    },
    navigation: {
      dashboard: 'Dashboard',
      standings: 'Standings',
    },
    controls: {
      tournamentName: 'Tournament name',
      totalRounds: 'Total rounds',
      roundsError: 'Rounds must be between 1 and 20',
      startTournament: 'Start Tournament',
      exportReport: 'Export Report',
      resetTournament: 'Reset Tournament',
      resetConfirm: 'Reset the tournament and clear saved state?',
    },
    pulse: {
      currentRound: 'Current Round',
      activeMatches: 'Active Matches',
      leader: 'Leader',
      setupValue: 'Setup',
      roundOf: (currentRound, totalRounds) => `Round ${currentRound} of ${totalRounds}`,
      configureRounds: (totalRounds) => `Configure up to ${totalRounds} rounds`,
      boardsOnDesk: 'Boards currently on the desk',
      topScore: (score) => `Top score ${score}`,
      currentRoundHelpLabel: 'How current round works',
      currentRoundHelpTitle: 'Current Round',
      currentRoundHelpBody:
        'This is the active live round. Pairings, standings, and next-round availability all use this round as the tournament desk state.',
      activeMatchesHelpLabel: 'How active matches are counted',
      activeMatchesHelpTitle: 'Active Matches',
      activeMatchesHelpBody:
        'This counts non-bye pairings in the current live round. A bye is completed automatically and does not count as an active board.',
      leaderHelpLabel: 'How leader is chosen',
      leaderHelpTitle: 'Leader',
      leaderHelpBody:
        'The leader is the current first-place player after applying the standings sort order: score, then Buchholz, then seed.',
    },
    rounds: {
      archiveTitle: 'Round Archive',
      archiveSubtitle: 'Jump across previous pairings without changing live standings.',
      round: (round) => `Round ${round}`,
    },
    players: {
      title: 'Player Management',
      subtitle: 'Add at least 2 players to start a tournament.',
      playerName: 'Player name',
      addPlayer: 'Add Player',
      noPlayers: 'No players registered yet.',
      seed: (seed) => `Seed ${seed}`,
      remove: 'Remove',
      errors: {
        emptyName: 'Player name cannot be empty',
        minPlayers: 'Add at least 2 players to start a tournament',
        duplicateWarning: (name) => `Duplicate name warning: "${name}" already exists.`,
      },
    },
    standings: {
      title: 'Standings',
      subtitle: 'Sorted by score, Buchholz, and seed.',
      tooltipLabel: 'How standings are sorted',
      tooltipTitle: 'Standings Rules',
      tooltipBody:
        'Players are sorted by total score first, then by Buchholz, then by registration seed. Buchholz is the sum of the current scores of all completed opponents. Byes do not add Buchholz.',
      rank: 'Rank',
      player: 'Player',
      seed: 'Seed',
      score: 'Score',
      scoreHelpLabel: 'How score works',
      scoreHelpTitle: 'Score',
      scoreHelpBody:
        'Wins are worth 1 point, draws 0.5, losses 0, double forfeits 0, and a bye counts as 1 point.',
      buchholz: 'Buchholz',
      buchholzHelpLabel: 'How Buchholz is computed',
      buchholzHelpTitle: 'Buchholz',
      buchholzHelpBody:
        'Add together the current scores of the player\'s completed opponents. A bye is not an opponent, so it contributes 0.',
      colors: 'Colors',
      colorsHelpLabel: 'How color history works',
      colorsHelpTitle: 'Color History',
      colorsHelpBody:
        'This shows prior color assignments across non-bye rounds. `W` means the player had White; `B` means they had Black.',
      details: 'Details',
      summary: 'Summary',
      opponentResults: 'Opponent results',
      opponentsFaced: (count) => `Opponents faced: ${count}`,
      receivedBye: (value) => `Received bye: ${value ? 'Yes' : 'No'}`,
      colorPath: (value) => `Color path: ${value}`,
      noCompletedRounds: 'No completed rounds yet.',
      roundBoard: (round, board) => `Round ${round} · Board ${board}`,
      focusTitle: 'Current Standings',
      focusSubtitle: 'A clean tournament-floor view of the live ranking.',
      focusEmpty: 'Standings will appear after players are added and rounds begin.',
      focusRound: (currentRound, totalRounds) =>
        currentRound > 0 ? `Round ${currentRound} of ${totalRounds}` : 'Tournament setup',
      focusLeader: (name, score) => `Leader: ${name} with ${score}`,
    },
    pairings: {
      title: 'Pairings and results',
      workflowLabel: 'How pairings and result entry work',
      workflowTitle: 'Round Workflow',
      workflowBody:
        'Enter one result for every non-bye board in the current round. The next round stays locked until all live boards have a completed result. `0-0` is a real completed result, not a placeholder.',
      roundComplete: 'Round complete',
      resultsEntered: (entered, target) => `${entered} of ${target} results entered`,
      archivedRound: (round) => `Reviewing archived pairings for round ${round}`,
      waiting: 'Pairings will appear after the tournament starts.',
      complete: 'Complete',
      incomplete: 'Incomplete',
      archive: 'Archive',
      board: 'Board',
      white: 'White',
      black: 'Black',
      result: 'Result',
      allowedResultsLabel: 'Allowed result values',
      allowedResultsTitle: 'Allowed Results',
      allowedResultsBody:
        'Manual entries are `1-0`, `0-1`, `0.5-0.5`, and `0-0`. A bye is stored automatically as `BYE` and cannot be edited.',
      resultForBoard: (board) => `Result for board ${board}`,
    },
    actions: {
      completedMessage: (totalRounds) =>
        `Tournament complete. Final standings are locked after round ${totalRounds}.`,
      title: 'Round Actions',
      setupPrompt: 'Start the tournament to generate round 1.',
      generatePrompt: 'Generate the next round only after all current results are entered.',
      finalRoundComplete: 'Final Round Complete',
      generateNextRound: 'Generate Next Round',
    },
  },
  de: {
    common: {
      english: 'Englisch',
      german: 'Deutsch',
      bye: 'SPIELFREI',
      unknown: 'Unbekannt',
      live: 'Live',
      yes: 'Ja',
      no: 'Nein',
      open: 'Oeffnen',
      hide: 'Schliessen',
      setup: 'Einrichtung',
      selectResult: 'Ergebnis waehlen',
      pending: 'Ausstehend',
      autoPoint: 'Automatischer Punkt',
      playedWhite: 'Mit Weiss gespielt',
      playedBlack: 'Mit Schwarz gespielt',
    },
    header: {
      title: 'Schweizer Schachturnier',
      playersReady: (count) => `${count} Spieler bereit`,
      statusLabel: (status, currentRound, totalRounds) => {
        if (status === 'setup') {
          return 'Einrichtung'
        }

        if (status === 'completed') {
          return 'Abgeschlossen'
        }

        return `Runde ${currentRound} von ${totalRounds}`
      },
      languageLabel: 'Sprache',
    },
    navigation: {
      dashboard: 'Dashboard',
      standings: 'Tabelle',
    },
    controls: {
      tournamentName: 'Turniername',
      totalRounds: 'Anzahl Runden',
      roundsError: 'Die Rundenzahl muss zwischen 1 und 20 liegen',
      startTournament: 'Turnier starten',
      exportReport: 'Bericht exportieren',
      resetTournament: 'Turnier zuruecksetzen',
      resetConfirm: 'Turnier zuruecksetzen und gespeicherten Stand loeschen?',
    },
    pulse: {
      currentRound: 'Aktuelle Runde',
      activeMatches: 'Aktive Partien',
      leader: 'Fuehrung',
      setupValue: 'Einrichtung',
      roundOf: (currentRound, totalRounds) => `Runde ${currentRound} von ${totalRounds}`,
      configureRounds: (totalRounds) => `Bis zu ${totalRounds} Runden konfigurieren`,
      boardsOnDesk: 'Bretter aktuell in Bearbeitung',
      topScore: (score) => `Topwertung ${score}`,
      currentRoundHelpLabel: 'Wie die aktuelle Runde funktioniert',
      currentRoundHelpTitle: 'Aktuelle Runde',
      currentRoundHelpBody:
        'Das ist die aktive Live-Runde. Paarungen, Tabelle und die Verfuegbarkeit der naechsten Runde beziehen sich auf diesen Turnierstand.',
      activeMatchesHelpLabel: 'Wie aktive Partien gezaehlt werden',
      activeMatchesHelpTitle: 'Aktive Partien',
      activeMatchesHelpBody:
        'Hier werden alle Paarungen ohne Freilos in der aktuellen Live-Runde gezaehlt. Ein Freilos wird automatisch abgeschlossen und zaehlt nicht als aktives Brett.',
      leaderHelpLabel: 'Wie die Fuehrung bestimmt wird',
      leaderHelpTitle: 'Fuehrung',
      leaderHelpBody:
        'Angefuehrt wird die Tabelle vom aktuellen Erstplatzierten nach Sortierung ueber Punkte, danach Buchholz, danach Setznummer.',
    },
    rounds: {
      archiveTitle: 'Rundenarchiv',
      archiveSubtitle: 'Zwischen frueheren Paarungen wechseln, ohne die Live-Tabelle zu veraendern.',
      round: (round) => `Runde ${round}`,
    },
    players: {
      title: 'Spielerverwaltung',
      subtitle: 'Fuege mindestens 2 Spieler hinzu, um ein Turnier zu starten.',
      playerName: 'Spielername',
      addPlayer: 'Spieler hinzufuegen',
      noPlayers: 'Noch keine Spieler registriert.',
      seed: (seed) => `Setznummer ${seed}`,
      remove: 'Entfernen',
      errors: {
        emptyName: 'Der Spielername darf nicht leer sein',
        minPlayers: 'Fuege mindestens 2 Spieler hinzu, um ein Turnier zu starten',
        duplicateWarning: (name) => `Warnung: Der Name "${name}" existiert bereits.`,
      },
    },
    standings: {
      title: 'Tabelle',
      subtitle: 'Sortiert nach Punkten, Buchholz und Setznummer.',
      tooltipLabel: 'Wie die Tabelle sortiert wird',
      tooltipTitle: 'Tabellenregeln',
      tooltipBody:
        'Die Sortierung erfolgt zuerst nach Gesamtpunkten, dann nach Buchholz, dann nach Anmeldesetznummer. Buchholz ist die Summe der aktuellen Punkte aller beendeten Gegner. Freilose zaehlen nicht zur Buchholz-Wertung.',
      rank: 'Rang',
      player: 'Spieler',
      seed: 'Setznummer',
      score: 'Punkte',
      scoreHelpLabel: 'Wie Punkte funktionieren',
      scoreHelpTitle: 'Punkte',
      scoreHelpBody:
        'Ein Sieg gibt 1 Punkt, ein Remis 0.5, eine Niederlage 0, ein doppelter kampfloser Verlust 0 und ein Freilos zaehlt als 1 Punkt.',
      buchholz: 'Buchholz',
      buchholzHelpLabel: 'Wie Buchholz berechnet wird',
      buchholzHelpTitle: 'Buchholz',
      buchholzHelpBody:
        'Addiert werden die aktuellen Punkte aller bereits beendeten Gegner des Spielers. Ein Freilos ist kein Gegner und traegt daher 0 bei.',
      colors: 'Farben',
      colorsHelpLabel: 'Wie die Farbhistorie funktioniert',
      colorsHelpTitle: 'Farbhistorie',
      colorsHelpBody:
        'Das zeigt die bisherigen Farbzuweisungen in Runden ohne Freilos. `W` steht fuer Weiss, `B` fuer Schwarz.',
      details: 'Details',
      summary: 'Uebersicht',
      opponentResults: 'Ergebnisse gegen Gegner',
      opponentsFaced: (count) => `Gegner gespielt: ${count}`,
      receivedBye: (value) => `Freilos erhalten: ${value ? 'Ja' : 'Nein'}`,
      colorPath: (value) => `Farbverlauf: ${value}`,
      noCompletedRounds: 'Noch keine abgeschlossenen Runden.',
      roundBoard: (round, board) => `Runde ${round} · Brett ${board}`,
      focusTitle: 'Aktuelle Tabelle',
      focusSubtitle: 'Eine ruhige Ansicht der laufenden Rangliste fuer den Turniersaal.',
      focusEmpty: 'Die Tabelle erscheint, sobald Spieler hinzugefuegt wurden und Runden laufen.',
      focusRound: (currentRound, totalRounds) =>
        currentRound > 0 ? `Runde ${currentRound} von ${totalRounds}` : 'Turnier in Einrichtung',
      focusLeader: (name, score) => `Fuehrung: ${name} mit ${score}`,
    },
    pairings: {
      title: 'Paarungen und Ergebnisse',
      workflowLabel: 'Wie Paarungen und Ergebniseingabe funktionieren',
      workflowTitle: 'Rundenablauf',
      workflowBody:
        'Trage fuer jedes Brett ohne Freilos in der aktuellen Runde ein Ergebnis ein. Die naechste Runde bleibt gesperrt, bis alle Live-Bretter ein abgeschlossenes Ergebnis haben. `0-0` ist ein echtes abgeschlossenes Ergebnis und kein Platzhalter.',
      roundComplete: 'Runde abgeschlossen',
      resultsEntered: (entered, target) => `${entered} von ${target} Ergebnissen erfasst`,
      archivedRound: (round) => `Archivierte Paarungen fuer Runde ${round}`,
      waiting: 'Die Paarungen erscheinen nach dem Turnierstart.',
      complete: 'Abgeschlossen',
      incomplete: 'Unvollstaendig',
      archive: 'Archiv',
      board: 'Brett',
      white: 'Weiss',
      black: 'Schwarz',
      result: 'Ergebnis',
      allowedResultsLabel: 'Zulaessige Ergebniswerte',
      allowedResultsTitle: 'Zulaessige Ergebnisse',
      allowedResultsBody:
        'Manuelle Eintraege sind `1-0`, `0-1`, `0.5-0.5` und `0-0`. Ein Freilos wird automatisch als `BYE` gespeichert und kann nicht bearbeitet werden.',
      resultForBoard: (board) => `Ergebnis fuer Brett ${board}`,
    },
    actions: {
      completedMessage: (totalRounds) =>
        `Turnier abgeschlossen. Die Endtabelle ist nach Runde ${totalRounds} fixiert.`,
      title: 'Rundenaktionen',
      setupPrompt: 'Starte das Turnier, um Runde 1 zu erzeugen.',
      generatePrompt: 'Erzeuge die naechste Runde erst, wenn alle aktuellen Ergebnisse eingetragen sind.',
      finalRoundComplete: 'Letzte Runde abgeschlossen',
      generateNextRound: 'Naechste Runde erzeugen',
    },
  },
}

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: TranslationSet
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'en' || stored === 'de') {
    return stored
  }

  return window.navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }

  return context
}

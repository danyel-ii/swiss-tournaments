import type { TournamentStatus } from './types/tournament'

export type Language = 'en' | 'de'

export type TranslationSet = {
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
    signedInAs: (username: string) => string
    logout: string
  }
  navigation: {
    dashboard: string
    tournaments: string
    live: string
    standings: string
    tables: string
    statistics: string
    headToHead: string
  }
  live: {
    title: string
    subtitle: string
    currentRound: (currentRound: number, totalRounds: number) => string
    resultsEntered: (entered: number, target: number) => string
  }
  tournaments: {
    directoryEyebrow: string
    title: string
    subtitle: (count: number) => string
    createTournament: string
    deleteTournament: string
    deleteTournamentConfirm: (name: string) => string
    deleteAllData: string
    deleteAllDataConfirm: string
    deleteAllDataHelp: string
    active: string
    openTournament: string
    openCurrent: string
    tournamentId: (id: string) => string
    players: (count: number) => string
    updatedAt: (value: string) => string
  }
  controls: {
    tournamentName: string
    totalRounds: string
    pairingAlgorithm: string
    pairingAlgorithmGreedy: string
    pairingAlgorithmBlossom: string
    roundsError: string
    decreaseRounds: string
    increaseRounds: string
    startTournament: string
    exportReport: string
    exportAllPlayerStats: string
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
    subtitle: (status: TournamentStatus) => string
    playerName: string
    addPlayer: string
    noPlayers: string
    seed: (seed: number) => string
    remove: string
    dropNextRound: string
    edit: string
    save: string
    cancel: string
    active: string
      libraryTitle: string
      libraryEmpty: string
      addFromLibrary: string
      deleteLibrary: string
      deleteLibraryConfirm: (name: string) => string
      joinsNextRound: (round: number) => string
    droppedAfterRound: (round: number) => string
    errors: {
      emptyName: string
      minPlayers: string
      duplicateWarning: (name: string) => string
    }
  }
  statistics: {
    title: string
    subtitle: string
    empty: string
    loading: string
    selectPlayer: string
    backToPlayers: string
    exportPlayerStats: string
    deletePlayer: string
    deletePlayerConfirm: (name: string) => string
    tournamentsPlayed: string
    gamesPlayed: string
    score: string
    wins: string
    winRate: string
    winRateByColor: string
    draws: string
    drawRate: string
    losses: string
    lossRate: string
    byes: string
    white: string
    black: string
    whiteBlack: string
    colorImbalance: string
    longestColorStreak: string
    averageBuchholz: string
    bestBuchholz: string
    latestBuchholz: string
    buchholz: string
    rank: string
    seedVsPlacement: string
    scorePercentage: string
    completedVsPartial: string
    undefeated: string
    undefeatedTournaments: string
    lateEntries: string
    dropouts: string
    completed: string
    inProgress: string
    setup: string
    headToHeadTitle: string
    noHeadToHead: string
    byeHistory: string
    noByes: string
    entryDrop: string
    roundProgression: string
    opponents: string
    managePlayer: string
    roundShort: (round: number) => string
    lastPlayed: string
    historyTitle: string
    noHistory: string
  }
  headToHead: {
    title: string
    subtitle: string
    playerA: string
    playerB: string
    selectPlayer: string
    choosePlayers: string
    samePlayer: string
    loading: string
    noGames: string
    tournamentMeetings: string
    lastMeeting: string
    wins: (name: string) => string
  }
  tables: {
    title: string
    subtitle: string
    createTable: string
    tableName: string
    selectPlayers: string
    internalElo: string
    rating: string
    ratingGames: string
    provisional: string
    suggestPairing: string
    suggestBatch: string
    batchSuggestions: (count: number) => string
    createGame: string
    createAllGames: string
    manualPairing: string
    whitePlayer: string
    blackPlayer: string
    pendingGames: string
    recentGames: string
    archiveTable: string
    deleteTable: string
    noTableSelected: string
    noPairingAvailable: string
    resultSaved: string
    standings: string
    activeTables: string
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
    archivedRoundEditable: (round: number) => string
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
    archivedEditWarning: string
  }
  actions: {
    completedMessage: (totalRounds: number) => string
    title: string
    setupPrompt: string
    generatePrompt: string
    finalRoundComplete: string
    generateNextRound: string
  }
  auth: {
    eyebrow: string
    title: string
    subtitle: string
    username: string
    password: string
    showPassword: string
    signIn: string
    signingIn: string
    loadingSession: string
    loadingWorkspace: string
    workspaceError: (message: string) => string
  }
  install: {
    eyebrow: string
    title: string
    body: string
    iosBody: string
    install: string
    dismiss: string
  }
}

const LANGUAGE_STORAGE_KEY = 'chessTournamentLanguage'

export const translations: Record<Language, TranslationSet> = {
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
      title: 'Chess Tournament (Swiss Pairings)',
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
      signedInAs: (username) => `Signed in as ${username}`,
      logout: 'Log Out',
    },
    navigation: {
      dashboard: 'Dashboard',
      tournaments: 'Tournaments',
      live: 'Live View',
      standings: 'Standings',
      tables: 'Tables',
      statistics: 'Statistics',
      headToHead: 'Head-to-Head',
    },
    live: {
      title: 'Live Round Desk',
      subtitle: 'Only the current round, result entry, and next-round action for fast mobile use.',
      currentRound: (currentRound, totalRounds) =>
        currentRound > 0 ? `Round ${currentRound} of ${totalRounds}` : 'Tournament setup',
      resultsEntered: (entered, target) => `${entered} of ${target} live results entered`,
    },
    tournaments: {
      directoryEyebrow: 'Multi Swiss',
      title: 'Tournament Directory',
      subtitle: (count) => `${count} tournament${count === 1 ? '' : 's'} saved in this browser`,
      createTournament: 'Create Tournament',
      deleteTournament: 'Delete Tournament',
      deleteTournamentConfirm: (name) =>
        `Delete "${name}" from the active tournament workspace? Historical player statistics stay available until explicitly deleted.`,
      deleteAllData: 'Delete All Data',
      deleteAllDataConfirm:
        'Delete all saved tournaments for this account? Player library entries and statistics stay available.',
      deleteAllDataHelp:
        'This clears only the saved tournament workspace. Player library entries and historical statistics remain available.',
      active: 'Active',
      openTournament: 'Open Tournament',
      openCurrent: 'Continue',
      tournamentId: (id) => `ID ${id}`,
      players: (count) => `${count} player${count === 1 ? '' : 's'}`,
      updatedAt: (value) => `Updated ${value}`,
    },
    controls: {
      tournamentName: 'Tournament name',
      totalRounds: 'Total rounds',
      pairingAlgorithm: 'Pairing algorithm',
      pairingAlgorithmGreedy: 'Greedy',
      pairingAlgorithmBlossom: 'Balanced Swiss',
      roundsError: 'Rounds must be between 1 and 20',
      decreaseRounds: 'Decrease rounds',
      increaseRounds: 'Increase rounds',
      startTournament: 'Start Tournament',
      exportReport: 'Download Report (.md)',
      exportAllPlayerStats: 'Download All Player Stats (.md)',
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
      subtitle: (status) =>
        status === 'setup'
          ? 'Add at least 2 players to start a tournament.'
          : status === 'in_progress'
            ? 'Renames apply immediately. New players join next round, and removals become drops after the current round.'
            : 'Renames stay available after the tournament. Structural roster changes are locked once the event is complete.',
      playerName: 'Player name',
      addPlayer: 'Add Player',
      noPlayers: 'No players registered yet.',
      seed: (seed) => `Seed ${seed}`,
      remove: 'Remove',
      dropNextRound: 'Drop Next Round',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      active: 'Active',
      libraryTitle: 'Player Library',
      libraryEmpty: 'Players you use across tournaments will appear here.',
      addFromLibrary: 'Add from library',
      deleteLibrary: 'Delete',
      deleteLibraryConfirm: (name) => `Delete "${name}" from the player library? Tournament history and statistics stay available.`,
      joinsNextRound: (round) => `Joins in round ${round}`,
      droppedAfterRound: (round) => `Dropped after round ${round}`,
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
        "Add together the current scores of the player's completed opponents. A bye is not an opponent, so it contributes 0.",
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
      archivedRoundEditable: (round) => `Editing results in archived round ${round}`,
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
      archivedEditWarning: 'Changing a past-round result removes every later round. You will need to regenerate them.',
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
    statistics: {
      title: 'Player Statistics',
      subtitle: 'Inspect player performance across all tournaments saved for this account.',
      empty: 'No player statistics yet. Finish or save tournaments with players to build the library.',
      loading: 'Loading player statistics...',
      selectPlayer: 'Select player',
      backToPlayers: 'Back to players',
      exportPlayerStats: 'Download Stats (.md)',
      deletePlayer: 'Delete Player Stats',
      deletePlayerConfirm: (name) =>
        `Delete all saved statistics for "${name}"? Tournaments stay intact, but this player is removed from the library and historical stats.`,
      tournamentsPlayed: 'Tournaments',
      gamesPlayed: 'Games',
      score: 'Score',
      wins: 'Wins',
      winRate: 'Win rate',
      winRateByColor: 'Win rate by color',
      draws: 'Draws',
      drawRate: 'Draw rate',
      losses: 'Losses',
      lossRate: 'Loss rate',
      byes: 'Byes',
      white: 'White',
      black: 'Black',
      whiteBlack: 'White / Black',
      colorImbalance: 'Color imbalance',
      longestColorStreak: 'Longest color streak',
      averageBuchholz: 'Average Buchholz',
      bestBuchholz: 'Best Buchholz',
      latestBuchholz: 'Latest Buchholz',
      buchholz: 'Buchholz',
      rank: 'Placement',
      seedVsPlacement: 'Seed to place',
      scorePercentage: 'Score %',
      completedVsPartial: 'Completed / Partial',
      undefeated: 'Undefeated',
      undefeatedTournaments: 'Undefeated events',
      lateEntries: 'Late entries',
      dropouts: 'Dropouts',
      completed: 'Completed',
      inProgress: 'In progress',
      setup: 'Setup',
      headToHeadTitle: 'Head-to-Head',
      noHeadToHead: 'No head-to-head history yet.',
      byeHistory: 'Bye History',
      noByes: 'No byes recorded for this player.',
      entryDrop: 'Entered / Dropped',
      roundProgression: 'Round progression',
      opponents: 'Opponents',
      managePlayer: 'Manage player',
      roundShort: (round: number) => `R${round}`,
      lastPlayed: 'Last played',
      historyTitle: 'Tournament History',
      noHistory: 'No completed stats are available for this player yet.',
    },
    headToHead: {
      title: 'Head-to-Head',
      subtitle: 'Compare two players across all recorded tournaments for this account.',
      playerA: 'Player A',
      playerB: 'Player B',
      selectPlayer: 'Select player',
      choosePlayers: 'Choose two players to compare.',
      samePlayer: 'Choose two different players.',
      loading: 'Loading head-to-head data...',
      noGames: 'No recorded games between these two players yet.',
      tournamentMeetings: 'Tournament Meetings',
      lastMeeting: 'Last meeting',
      wins: (name) => `${name} wins`,
    },
    tables: {
      title: 'Ongoing tables',
      subtitle: 'Open-ended rated games for selected library players.',
      createTable: 'Create table',
      tableName: 'Table name',
      selectPlayers: 'Select players',
      internalElo: 'Magie-Punkte',
      rating: 'Magie-Punkte',
      ratingGames: 'Rated games',
      provisional: 'Provisional',
      suggestPairing: 'Suggest pairing',
      suggestBatch: 'Suggest batch',
      batchSuggestions: (count) => `${count} suggested games`,
      createGame: 'Create game',
      createAllGames: 'Create all games',
      manualPairing: 'Manual pairing',
      whitePlayer: 'White player',
      blackPlayer: 'Black player',
      pendingGames: 'Pending games',
      recentGames: 'Recent games',
      archiveTable: 'Archive table',
      deleteTable: 'Delete table',
      noTableSelected: 'No table selected',
      noPairingAvailable: 'No pairing available',
      resultSaved: 'Result saved',
      standings: 'Standings',
      activeTables: 'Active tables',
    },
    auth: {
      eyebrow: 'Private Access',
      title: 'Sign in to tournament control',
      subtitle:
        'Authentication and saved tournament data are handled by Neon-backed server routes.',
      username: 'Username',
      password: 'Password',
      showPassword: 'View password',
      signIn: 'Sign In',
      signingIn: 'Signing In...',
      loadingSession: 'Checking session...',
      loadingWorkspace: 'Loading tournament workspace...',
      workspaceError: (message) => `Workspace sync issue: ${message}`,
    },
    install: {
      eyebrow: 'Install App',
      title: 'Add this tournament app to your phone',
      body: 'Install it now for faster access, a full-screen experience, and an icon on your home screen.',
      iosBody: 'To install on iPhone or iPad, tap Share in Safari and then choose “Add to Home Screen”.',
      install: 'Install',
      dismiss: 'Not now',
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
      title: 'Schachturnier (Schweizer Paarungen)',
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
      signedInAs: (username) => `Angemeldet als ${username}`,
      logout: 'Abmelden',
    },
    navigation: {
      dashboard: 'Dashboard',
      tournaments: 'Turniere',
      live: 'Live Ansicht',
      standings: 'Tabelle',
      tables: 'Tabellen',
      statistics: 'Statistik',
      headToHead: 'Direkter Vergleich',
    },
    live: {
      title: 'Live-Rundenansicht',
      subtitle:
        'Nur die aktuelle Runde, Ergebniseingabe und der Knopf fuer die naechste Runde fuer einen schnellen mobilen Ablauf.',
      currentRound: (currentRound, totalRounds) =>
        currentRound > 0 ? `Runde ${currentRound} von ${totalRounds}` : 'Turnier in Einrichtung',
      resultsEntered: (entered, target) => `${entered} von ${target} Live-Ergebnissen erfasst`,
    },
    tournaments: {
      directoryEyebrow: 'Multi Swiss',
      title: 'Turnierliste',
      subtitle: (count) => `${count} Turniere in diesem Browser gespeichert`,
      createTournament: 'Turnier erstellen',
      deleteTournament: 'Turnier loeschen',
      deleteTournamentConfirm: (name) =>
        `Turnier "${name}" aus dem aktiven Turnierbereich loeschen? Historische Spielerstatistiken bleiben erhalten, bis sie ausdruecklich geloescht werden.`,
      deleteAllData: 'Alle Daten loeschen',
      deleteAllDataConfirm:
        'Alle gespeicherten Turniere dieses Kontos loeschen? Spielerbibliothek und Statistiken bleiben erhalten.',
      deleteAllDataHelp:
        'Das entfernt nur den gespeicherten Turnierbereich. Spielerbibliothek und historische Statistiken bleiben erhalten.',
      active: 'Aktiv',
      openTournament: 'Turnier oeffnen',
      openCurrent: 'Weiter',
      tournamentId: (id) => `ID ${id}`,
      players: (count) => `${count} Spieler`,
      updatedAt: (value) => `Aktualisiert ${value}`,
    },
    controls: {
      tournamentName: 'Turniername',
      totalRounds: 'Anzahl Runden',
      pairingAlgorithm: 'Paarungsalgorithmus',
      pairingAlgorithmGreedy: 'Greedy',
      pairingAlgorithmBlossom: 'Balanced Swiss',
      roundsError: 'Die Rundenzahl muss zwischen 1 und 20 liegen',
      decreaseRounds: 'Runden verringern',
      increaseRounds: 'Runden erhoehen',
      startTournament: 'Turnier starten',
      exportReport: 'Bericht herunterladen (.md)',
      exportAllPlayerStats: 'Alle Spielerstatistiken herunterladen (.md)',
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
      subtitle: (status) =>
        status === 'setup'
          ? 'Fuege mindestens 2 Spieler hinzu, um ein Turnier zu starten.'
          : status === 'in_progress'
            ? 'Namensaenderungen gelten sofort. Neue Spieler steigen erst in der naechsten Runde ein, und Entfernungen werden nach der aktuellen Runde wirksam.'
            : 'Namensaenderungen bleiben moeglich. Strukturelle Aenderungen an der Teilnehmerliste sind nach Turnierende gesperrt.',
      playerName: 'Spielername',
      addPlayer: 'Spieler hinzufuegen',
      noPlayers: 'Noch keine Spieler registriert.',
      seed: (seed) => `Setznummer ${seed}`,
      remove: 'Entfernen',
      dropNextRound: 'Ab naechster Runde raus',
      edit: 'Bearbeiten',
      save: 'Speichern',
      cancel: 'Abbrechen',
      active: 'Aktiv',
      libraryTitle: 'Spielerbibliothek',
      libraryEmpty: 'Spieler, die du turnieruebergreifend verwendest, erscheinen hier.',
      addFromLibrary: 'Aus Bibliothek hinzufuegen',
      deleteLibrary: 'Loeschen',
      deleteLibraryConfirm: (name) => `„${name}“ aus der Spielerbibliothek loeschen? Turnierhistorie und Statistiken bleiben erhalten.`,
      joinsNextRound: (round) => `Steigt in Runde ${round} ein`,
      droppedAfterRound: (round) => `Nach Runde ${round} ausgeschieden`,
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
      archivedRoundEditable: (round) => `Ergebnisse in archivierter Runde ${round} bearbeiten`,
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
      archivedEditWarning: 'Wenn du ein Ergebnis aus einer frueheren Runde aenderst, werden alle spaeteren Runden entfernt und muessen neu erzeugt werden.',
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
    statistics: {
      title: 'Spielerstatistik',
      subtitle: 'Leistungen der Spieler ueber alle fuer dieses Konto gespeicherten Turniere hinweg ansehen.',
      empty: 'Noch keine Spielerstatistiken vorhanden. Speichere Turniere mit Spielern, um die Bibliothek aufzubauen.',
      loading: 'Spielerstatistiken werden geladen...',
      selectPlayer: 'Spieler auswaehlen',
      backToPlayers: 'Zurueck zur Liste',
      exportPlayerStats: 'Statistik herunterladen (.md)',
      deletePlayer: 'Spielerstatistik loeschen',
      deletePlayerConfirm: (name) =>
        `Alle gespeicherten Statistiken fuer "${name}" loeschen? Turniere bleiben erhalten, aber dieser Spieler wird aus Bibliothek und historischer Statistik entfernt.`,
      tournamentsPlayed: 'Turniere',
      gamesPlayed: 'Partien',
      score: 'Punkte',
      wins: 'Siege',
      winRate: 'Siegquote',
      winRateByColor: 'Siegquote nach Farbe',
      draws: 'Remis',
      drawRate: 'Remisquote',
      losses: 'Niederlagen',
      lossRate: 'Niederlagenquote',
      byes: 'Freilose',
      white: 'Weiss',
      black: 'Schwarz',
      whiteBlack: 'Weiss / Schwarz',
      colorImbalance: 'Farbungleichgewicht',
      longestColorStreak: 'Laengste Farbserie',
      averageBuchholz: 'Durchschnittliche Buchholz',
      bestBuchholz: 'Beste Buchholz',
      latestBuchholz: 'Letzte Buchholz',
      buchholz: 'Buchholz',
      rank: 'Platzierung',
      seedVsPlacement: 'Setzliste zu Platz',
      scorePercentage: 'Punktquote',
      completedVsPartial: 'Abgeschlossen / Teilweise',
      undefeated: 'Ungeschlagen',
      undefeatedTournaments: 'Ungeschlagene Turniere',
      lateEntries: 'Spaete Einstiege',
      dropouts: 'Ausstiege',
      completed: 'Abgeschlossen',
      inProgress: 'Laeuft',
      setup: 'Einrichtung',
      headToHeadTitle: 'Direkter Vergleich',
      noHeadToHead: 'Noch keine direkten Vergleiche vorhanden.',
      byeHistory: 'Freilos-Historie',
      noByes: 'Fuer diesen Spieler wurden keine Freilose verzeichnet.',
      entryDrop: 'Einstieg / Ausstieg',
      roundProgression: 'Rundenverlauf',
      opponents: 'Gegner',
      managePlayer: 'Spieler verwalten',
      roundShort: (round: number) => `R${round}`,
      lastPlayed: 'Zuletzt gespielt',
      historyTitle: 'Turnierverlauf',
      noHistory: 'Fuer diesen Spieler liegen noch keine auswertbaren Daten vor.',
    },
    headToHead: {
      title: 'Direkter Vergleich',
      subtitle: 'Vergleiche zwei Spieler ueber alle fuer dieses Konto erfassten Turniere hinweg.',
      playerA: 'Spieler A',
      playerB: 'Spieler B',
      selectPlayer: 'Spieler auswaehlen',
      choosePlayers: 'Waehle zwei Spieler fuer den Vergleich aus.',
      samePlayer: 'Waehle zwei unterschiedliche Spieler aus.',
      loading: 'Direkter Vergleich wird geladen...',
      noGames: 'Zwischen diesen beiden Spielern sind noch keine Partien erfasst.',
      tournamentMeetings: 'Begegnungen nach Turnier',
      lastMeeting: 'Letzte Begegnung',
      wins: (name) => `${name} Siege`,
    },
    tables: {
      title: 'Laufende Tabellen',
      subtitle: 'Offene gewertete Partien fuer ausgewaehlte Bibliotheksspieler.',
      createTable: 'Tabelle erstellen',
      tableName: 'Tabellenname',
      selectPlayers: 'Spieler auswaehlen',
      internalElo: 'Magie-Punkte',
      rating: 'Magie-Punkte',
      ratingGames: 'Gewertete Partien',
      provisional: 'Vorlaeufig',
      suggestPairing: 'Paarung vorschlagen',
      suggestBatch: 'Batch vorschlagen',
      batchSuggestions: (count) => `${count} vorgeschlagene Partien`,
      createGame: 'Partie erstellen',
      createAllGames: 'Alle Partien erstellen',
      manualPairing: 'Manuelle Paarung',
      whitePlayer: 'Weiss-Spieler',
      blackPlayer: 'Schwarz-Spieler',
      pendingGames: 'Offene Partien',
      recentGames: 'Letzte Partien',
      archiveTable: 'Tabelle archivieren',
      deleteTable: 'Tabelle loeschen',
      noTableSelected: 'Keine Tabelle ausgewaehlt',
      noPairingAvailable: 'Keine Paarung verfuegbar',
      resultSaved: 'Ergebnis gespeichert',
      standings: 'Tabelle',
      activeTables: 'Aktive Tabellen',
    },
    auth: {
      eyebrow: 'Privater Zugang',
      title: 'Bei der Turniersteuerung anmelden',
      subtitle: '',
      username: 'Benutzername',
      password: 'Passwort',
      showPassword: 'Passwort anzeigen',
      signIn: 'Anmelden',
      signingIn: 'Anmeldung laeuft...',
      loadingSession: 'Sitzung wird geprueft...',
      loadingWorkspace: 'Turnierbereich wird geladen...',
      workspaceError: (message) => `Problem bei der Synchronisierung: ${message}`,
    },
    install: {
      eyebrow: 'App installieren',
      title: 'Diese Turnier-App zum Startbildschirm hinzufuegen',
      body: 'Installiere sie jetzt fuer schnelleren Zugriff, Vollbildansicht und ein eigenes Symbol auf dem Handy.',
      iosBody: 'Auf iPhone oder iPad installierst du die App ueber Teilen in Safari und dann „Zum Home-Bildschirm“.',
      install: 'Installieren',
      dismiss: 'Spaeter',
    },
  },
}

export function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'en' || stored === 'de') {
    return stored
  }

  return window.navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en'
}

export function persistLanguage(language: Language) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}

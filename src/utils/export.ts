import type { Tournament } from '../types/tournament'
import { slugifyFileName } from './format'
import { buildTournamentReport } from './tournamentReport'

export const buildTournamentExport = buildTournamentReport

export function downloadTournamentExport(tournament: Tournament): void {
  const report = buildTournamentExport(tournament)
  const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const fileName = `${slugifyFileName(tournament.name)}-report.md`

  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

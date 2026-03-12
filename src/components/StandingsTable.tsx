import { formatScore } from '../utils/format'
import type { PlayerStanding } from '../types/tournament'

interface StandingsTableProps {
  standings: PlayerStanding[]
}

export function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-serif text-2xl text-slate-900">Standings</h2>
        <p className="mt-1 text-sm text-slate-600">
          Sorted by score, Buchholz, seed, and name.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Rank</th>
              <th className="px-4 py-3 font-semibold">Player</th>
              <th className="px-4 py-3 font-semibold">Seed</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Buchholz</th>
              <th className="px-4 py-3 font-semibold">Colors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {standings.map((standing) => (
              <tr key={standing.playerId}>
                <td className="px-4 py-3 font-medium text-slate-900">{standing.rank}</td>
                <td className="px-4 py-3 text-slate-800">{standing.name}</td>
                <td className="px-4 py-3 text-slate-700">{standing.seed}</td>
                <td className="px-4 py-3 text-slate-700">
                  {formatScore(standing.score)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatScore(standing.buchholz)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {standing.colorHistory.join('') || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

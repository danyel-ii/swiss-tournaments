import { apiRequest } from '../api/client'
import type { TournamentCollection } from '../types/workspace'

export async function loadTournamentCollection(): Promise<TournamentCollection> {
  return apiRequest<TournamentCollection>('/api/workspace')
}

export async function saveTournamentCollection(collection: TournamentCollection): Promise<void> {
  await apiRequest<{ ok: true }>('/api/workspace', {
    method: 'PUT',
    body: JSON.stringify(collection),
  })
}

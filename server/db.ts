import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

type SqlClient = NeonQueryFunction<false, false>

export class DatabaseConfigurationError extends Error {
  constructor() {
    super('DATABASE_URL environment variable is required')
    this.name = 'DatabaseConfigurationError'
  }
}

let sqlClient: SqlClient | null = null

function getSqlClient(): SqlClient {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new DatabaseConfigurationError()
  }

  sqlClient ??= neon(databaseUrl)

  return sqlClient
}

export const sql = ((strings: TemplateStringsArray, ...params: unknown[]) =>
  getSqlClient()(strings, ...params)) as SqlClient

import { sql } from './db.js'
import type { AllowedUsername } from './config.js'

const REPORT_EMAIL_TO = 'daniel.r.hawes@proton.me'
const REPORT_COOLDOWN_MS = 1000 * 30

let ensureReportEmailSchemaPromise: Promise<void> | null = null

interface ReportEmailThrottleRow {
  last_sent_at: string
}

function getReportEmailApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null
}

function getReportEmailFrom(): string | null {
  return process.env.REPORT_EMAIL_FROM ?? null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getCooldownSeconds(lastSentAt: string): number {
  const retryAfterMs = new Date(lastSentAt).getTime() + REPORT_COOLDOWN_MS - Date.now()

  return Math.max(1, Math.ceil(retryAfterMs / 1000))
}

async function ensureReportEmailSchema(): Promise<void> {
  if (!ensureReportEmailSchemaPromise) {
    ensureReportEmailSchemaPromise = (async () => {
      await sql`
        create table if not exists tournament_report_emails (
          username text not null check (username in ('kusselberg', 'schachmagie', 'danyel-ii')),
          tournament_id text not null,
          last_sent_at timestamptz not null default now(),
          primary key (username, tournament_id)
        )
      `
    })()
  }

  await ensureReportEmailSchemaPromise
}

async function getTournamentReportCooldownState(
  username: AllowedUsername,
  tournamentId: string,
): Promise<{ blocked: false } | { blocked: true; retryAfterSeconds: number }> {
  await ensureReportEmailSchema()

  const result = (await sql`
    select last_sent_at
    from tournament_report_emails
    where username = ${username}
      and tournament_id = ${tournamentId}
    limit 1
  `) as ReportEmailThrottleRow[]

  const lastSentAt = result[0]?.last_sent_at ?? null

  if (!lastSentAt) {
    return { blocked: false }
  }

  const retryAfterSeconds = getCooldownSeconds(lastSentAt)

  if (new Date(lastSentAt).getTime() + REPORT_COOLDOWN_MS <= Date.now()) {
    return { blocked: false }
  }

  return { blocked: true, retryAfterSeconds }
}

async function recordTournamentReportEmail(
  username: AllowedUsername,
  tournamentId: string,
): Promise<void> {
  await ensureReportEmailSchema()

  await sql`
    insert into tournament_report_emails (username, tournament_id, last_sent_at)
    values (${username}, ${tournamentId}, now())
    on conflict (username, tournament_id)
    do update set last_sent_at = excluded.last_sent_at
  `
}

export async function sendTournamentReportEmail(
  username: AllowedUsername,
  options: {
    tournamentId: string
    tournamentName: string
    report: string
  },
): Promise<{ ok: true } | { ok: false; status: 429; retryAfterSeconds: number } | { ok: false; status: 503; error: string } | { ok: false; status: 502; error: string }> {
  const cooldownState = await getTournamentReportCooldownState(username, options.tournamentId)

  if (cooldownState.blocked) {
    return { ok: false, status: 429, retryAfterSeconds: cooldownState.retryAfterSeconds }
  }

  const apiKey = getReportEmailApiKey()
  const from = getReportEmailFrom()

  if (!apiKey || !from) {
    return {
      ok: false,
      status: 503,
      error: 'Email delivery is not configured',
    }
  }

  const report = options.report
  const subject = `${options.tournamentName} Tournament Report`
  const html = [
    '<div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap;">',
    escapeHtml(report),
    '</div>',
  ].join('')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [REPORT_EMAIL_TO],
      subject,
      text: report,
      html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()

    return {
      ok: false,
      status: 502,
      error: errorText || 'Email provider rejected the request',
    }
  }

  await recordTournamentReportEmail(username, options.tournamentId)

  return { ok: true }
}

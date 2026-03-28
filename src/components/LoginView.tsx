import { useState } from 'react'
import { useI18n } from '../useI18n'

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<void>
  error: string | null
}

const USER_OPTIONS = ['kusselberg', 'schachmagie', 'danyel-ii'] as const

export function LoginView({ onLogin, error }: LoginViewProps) {
  const { t } = useI18n()
  const [username, setUsername] = useState<(typeof USER_OPTIONS)[number]>('kusselberg')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--theme-text)]">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center">
        <section className="theme-panel w-full rounded-[2rem] p-8 md:p-10">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--theme-text-soft)]">
            {t.auth.eyebrow}
          </p>
          <h1 className="theme-heading mt-3 font-display text-4xl font-bold tracking-[-0.04em]">
            {t.auth.title}
          </h1>
          <p className="theme-copy mt-3 font-data text-base">
            {t.auth.subtitle}
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmitting(true)
              void onLogin(username, password).finally(() => {
                setSubmitting(false)
                setPassword('')
              })
            }}
          >
            <label className="theme-label block text-sm font-medium">
              <span className="font-display">{t.auth.username}</span>
              <select
                value={username}
                onChange={(event) => setUsername(event.target.value as (typeof USER_OPTIONS)[number])}
                className="theme-input font-data mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition"
              >
                {USER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="theme-label block text-sm font-medium">
              <span className="font-display">{t.auth.password}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="theme-input font-data mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition"
              />
            </label>

            {error ? (
              <p className="font-data text-sm text-[var(--theme-red)]">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="theme-button-aqua font-display inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t.auth.signingIn : t.auth.signIn}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

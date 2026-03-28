import { useI18n } from '../useI18n'

interface InstallPromptProps {
  isIosManualInstall: boolean
  onInstall: () => void
  onDismiss: () => void
}

export function InstallPrompt({
  isIosManualInstall,
  onInstall,
  onDismiss,
}: InstallPromptProps) {
  const { t } = useI18n()

  return (
    <section className="theme-panel rounded-3xl border-[var(--theme-aqua)] bg-[var(--theme-aqua-soft)] px-5 py-4">
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--theme-plum)]">
            {t.install.eyebrow}
          </p>
          <h2 className="theme-heading mt-1 font-display text-xl font-semibold">
            {t.install.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--theme-plum)]">
            {isIosManualInstall ? t.install.iosBody : t.install.body}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isIosManualInstall ? (
            <button
              type="button"
              onClick={onInstall}
              className="theme-button-plum rounded-full px-4 py-2 font-display text-sm font-semibold transition"
            >
              {t.install.install}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full bg-[var(--theme-surface)] px-4 py-2 font-display text-sm font-semibold text-[var(--theme-plum)] transition"
          >
            {t.install.dismiss}
          </button>
        </div>
      </div>
    </section>
  )
}

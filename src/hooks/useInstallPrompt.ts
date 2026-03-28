import { useEffect, useState } from 'react'

const DISMISS_KEY = 'swissTournamentInstallPromptDismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isLikelyIosMobile(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isLikelyMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(max-width: 768px)').matches
}

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIosManualInstall, setIsIosManualInstall] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return isLikelyMobileViewport() && isLikelyIosMobile() && !isStandaloneDisplayMode()
  })
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(DISMISS_KEY) === 'true'
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncManualInstallState = () => {
      setIsIosManualInstall(
        isLikelyMobileViewport() && isLikelyIosMobile() && !isStandaloneDisplayMode(),
      )
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setIsInstallable(isLikelyMobileViewport() && !isStandaloneDisplayMode())
    }

    const handleAppInstalled = () => {
      setInstallEvent(null)
      setIsInstallable(false)
      setIsIosManualInstall(false)
      window.localStorage.setItem(DISMISS_KEY, 'true')
      setDismissed(true)
    }

    syncManualInstallState()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('resize', syncManualInstallState)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('resize', syncManualInstallState)
    }
  }, [])

  const promptInstall = async () => {
    if (!installEvent) {
      return
    }

    await installEvent.prompt()
    const choice = await installEvent.userChoice

    if (choice.outcome === 'accepted') {
      window.localStorage.setItem(DISMISS_KEY, 'true')
      setDismissed(true)
      setInstallEvent(null)
      setIsInstallable(false)
    }
  }

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, 'true')
    }
    setDismissed(true)
  }

  return {
    visible: !dismissed && (isInstallable || isIosManualInstall),
    isIosManualInstall,
    promptInstall,
    dismiss,
  }
}

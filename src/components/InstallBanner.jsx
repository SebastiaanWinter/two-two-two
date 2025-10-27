import React, { useEffect, useState } from 'react'

/**
 * InstallBanner
 * - Shows a real "Install" button when the beforeinstallprompt event fires (Android/desktop)
 * - On iOS Safari, shows a one-time hint to "Add to Home Screen"
 * - Remembers dismissal in localStorage
 */

const KEY = 'flow222_install_banner_dismissed'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(KEY) === 'true'
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setIsStandalone(standalone)

    // detect iOS Safari-ish
    const ua = window.navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(ua))

    if (dismissed || standalone) return

    const handler = (e) => {
      // prevent mini-infobar
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // If beforeinstallprompt never fires (e.g., iOS), show a gentle hint once
    const iOSTimer = setTimeout(() => {
      if (!standalone && !dismissed && isIOS) setShow(true)
    }, 1500)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(iOSTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isStandalone || !show) return null

  const dismiss = () => {
    localStorage.setItem(KEY, 'true')
    setShow(false)
  }

  const install = async () => {
    if (!deferredPrompt) {
      // iOS path: show instructions
      alert('On iPhone: open in Safari → Share → Add to Home Screen')
      return
    }
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(KEY, 'true')
      setShow(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-2xl border border-orange-200 bg-white shadow-xl max-w-md">
        <div className="p-4">
          <p className="font-semibold text-gray-900 mb-1">Install 2-2-2 on your phone</p>
          <p className="text-sm text-gray-700">
            {isIOS
              ? 'Open in Safari → tap the Share icon → “Add to Home Screen”.'
              : 'Get the app-like experience with one tap.'}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={install}
              className="px-4 py-2 rounded-full text-white bg-orange-600 hover:bg-orange-700"
            >
              {isIOS ? 'How to install' : 'Install'}
            </button>
            <button
              onClick={dismiss}
              className="px-4 py-2 rounded-full border bg-white hover:bg-gray-50"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

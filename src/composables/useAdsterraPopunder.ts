import { adsterraConfig } from '@/config/adsterra'
import { usePremiumStatus } from '@/composables/usePremiumStatus'

// Popunder is capped at one per browser session. The flag lives in
// sessionStorage so it resets when the tab is closed, and requires no
// backend or per-user state.
const SESSION_FLAG = 'seeus_adsterra_popunder_triggered'

export function useAdsterraPopunder() {
  const { isPremiumActive, checkPremiumStatus } = usePremiumStatus()

  /**
   * Attempt to show a single session-capped popunder.
   *
   * Intended to be called ONLY when the user actively clicks a provider card
   * inside the Watch modal — never on modal open/close, overlays, ESC, or
   * passive navigation. Returns a promise so callers can await it without
   * blocking normal UI.
   */
  async function maybeTriggerPopunder(): Promise<void> {
    if (isPremiumActive.value) return
    if (!adsterraConfig.popunder.enabled || adsterraConfig.popunder.scriptUrl.length === 0) {
      return
    }
    if (typeof window === 'undefined') return

    if (window.sessionStorage.getItem(SESSION_FLAG) === '1') return

    await checkPremiumStatus()
    if (isPremiumActive.value) return

    // Double-check after async premium resolution.
    if (window.sessionStorage.getItem(SESSION_FLAG) === '1') return

    try {
      const script = document.createElement('script')
      script.src = adsterraConfig.popunder.scriptUrl
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      document.body.appendChild(script)
      window.sessionStorage.setItem(SESSION_FLAG, '1')
    } catch {
      // Never surface a popunder error to the user; the provider link still works.
    }
  }

  return { maybeTriggerPopunder }
}
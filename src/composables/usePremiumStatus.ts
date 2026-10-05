import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { usePremiumService } from '@/composables/usePremiumService'

/**
 * Shared premium-status helper used by all ad components (AdSense + Adsterra)
 * so a single subscription lookup per page lifecycle is not duplicated.
 *
 * The subscription check is cached in module scope: once resolved for the
 * current page lifecycle it is not repeated on every ad mount. Call
 * `resetPremiumStatus()` when re-checking is required (e.g. logout/login).
 */

let cachedPremiumActive = false
let cachedIsAuthenticated = false
let cachedChecked = false

export function usePremiumStatus() {
  const { user, isAuthenticated } = useAuth()

  const isPremiumActive = ref(cachedPremiumActive)
  const isChecked = ref(cachedChecked)

  onMounted(() => {
    syncFromCache()
  })

  function syncFromCache() {
    isPremiumActive.value = cachedPremiumActive
    isChecked.value = cachedChecked
  }

  /** Returns true when the current user holds an active premium subscription. */
  async function checkPremiumStatus(): Promise<boolean> {
    if (!isAuthenticated.value || !user.value) {
      cachedPremiumActive = false
      cachedIsAuthenticated = false
      cachedChecked = true
      syncFromCache()
      return isPremiumActive.value
    }

    if (cachedChecked && cachedIsAuthenticated) {
      syncFromCache()
      return isPremiumActive.value
    }

    const { getSubscription } = usePremiumService()
    try {
      const subscription = await getSubscription()
      cachedPremiumActive = subscription?.status === 'active'
    } catch {
      // On error, treat as not premium (show ads) so content is not blocked.
      cachedPremiumActive = false
    } finally {
      cachedIsAuthenticated = true
      cachedChecked = true
      syncFromCache()
    }
    return isPremiumActive.value
  }

  const shouldRenderAds = computed(() => !isPremiumActive.value)

  /** Reset the cache when the auth/premium context changes (e.g. logout). */
  function resetPremiumStatus() {
    cachedPremiumActive = false
    cachedIsAuthenticated = false
    cachedChecked = false
    syncFromCache()
  }

  return {
    isPremiumActive,
    isChecked,
    shouldRenderAds,
    checkPremiumStatus,
    resetPremiumStatus,
  }
}
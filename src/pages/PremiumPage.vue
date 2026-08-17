<template>
  <div class="premium-page" v-if="!isShowingAuthForm">
    <div class="premium-page__intro">
      <h3 class="premium-page__title">{{ $t('premium.plans.title') }}</h3>
      <p class="premium-page__subtitle">{{ $t('premium.plans.subtitle') }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="premium-page__loading">
      <p>{{ $t('common.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="premium-page__error">
      <p>{{ $t('common.error') }}</p>
      <button class="btn btn-outline" @click="fetchData">
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Auth notice banner (non-fatal, e.g. email confirmation) -->
      <div v-if="authNotice" class="premium-page__auth-notice">
        {{ authNotice }}
      </div>

      <!-- Premium Status Banner -->
      <div v-if="isPremiumActive" class="premium-page__premium-banner">
        <div class="premium-page__premium-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="premium-page__premium-icon">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>{{ $t('premium.status.active') }}</span>
        </div>
      </div>

      <!-- Authenticated User Indicator with Logout -->
      <div v-else-if="isAppAuthenticated" class="premium-page__user-banner">
        <div class="premium-page__user-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="premium-page__user-icon">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span>{{ $t('premium.status.authenticated') }}</span>
          <button type="button" class="btn btn-outline btn-sm" @click="handleSignOut">
            {{ $t('auth.logout') }}
          </button>
        </div>
      </div>

      <div class="premium-page__plans">
        <div v-for="plan in plans" :key="plan.id" class="premium-page__plan-card"
          :class="`premium-page__plan-card--${plan.id}`">
          <div v-if="plan.badge" class="premium-page__plan-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {{ $t(plan.badge) }}
          </div>

          <div class="premium-page__plan-header">
            <h4 class="premium-page__plan-name">{{ $t(`premium.plans.${getTranslationKey(plan.id)}.title`) }}</h4>
            <p class="premium-page__plan-description">{{
              $t(`premium.plans.${getTranslationKey(plan.id)}.description`) }}</p>
          </div>
          
          <div v-if="plan.id !== 'free'" class="premium-page__plan-price">
            <span class="premium-page__plan-price-amount">{{ $t(`premium.plans.${getTranslationKey(plan.id)}.price`) }}</span>
            <span class="premium-page__plan-price-period">{{ $t(`premium.plans.${getTranslationKey(plan.id)}.period`) }}</span>
          </div>

          <ul class="premium-page__plan-features">
            <li v-for="feature in plan.features" :key="feature" class="premium-page__plan-feature">
              <span class="premium-page__plan-feature-icon">{{ plan.freePlan ? '✅' : '⭐' }}</span>
              {{ $t(feature) }}
            </li>
          </ul>
         
          <!-- Free Plan Button -->
          <button v-if="plan.freePlan" class="premium-page__plan-button btn btn-primary" @click="handleFreePlan">
            {{ $t('premium.plans.startFree') }}
          </button>

          <!-- Premium Plan Buttons -->
          <button v-else :class="[
            'premium-page__plan-button',
            'btn',
            'btn-primary',
            isPremiumActive ? 'btn-success' : ''
          ]" :disabled="isPremiumActive || checkoutLoading"
            @click="handleCheckoutOrShowAuth(plan.id as Exclude<PremiumPlanId, 'free'>)">
            <template v-if="isPremiumActive">
              {{ $t('common.active') }}
            </template>
            <template v-else-if="checkoutLoading">
              {{ $t('common.processing') }}
            </template>
            <template v-else>
              {{ $t('premium.subscribe') }}
            </template>
          </button>
          
          <p v-if="$te(`premium.plans.${getTranslationKey(plan.id)}.footer`)" class="premium-page__plan-footer">{{ $t(`premium.plans.${getTranslationKey(plan.id)}.footer`) }}</p>
          <p v-else class="premium-page__plan-footer">{{ $t(`premium.plans.${getTranslationKey(plan.id)}.savings`) }}</p>
        </div>
      </div>

      <!-- Current Subscription Info -->
      <div v-if="subscription" class="premium-page__subscription-info">
        <p>{{ $t('premium.status.current') }}: {{ $t(`premium.status.${subscription.status}`) }}</p>
        <button v-if="subscription.status === 'active'" class="btn btn-outline" @click="handleCancelSubscription">
          {{ $t('premium.actions.cancel') }}
        </button>
      </div>
    </div>
  </div>

  <!-- Authentication form shown when the user is not authenticated -->
  <div v-if="isShowingAuthForm" class="premium-page__auth">
    <button
      type="button"
      class="premium-page__auth-close"
      :aria-label="$t('auth.close')"
      @click="closeAuthModal"
    >
      &times;
    </button>

    <h3 class="premium-page__auth-title">
      {{ authMode === 'login' ? $t('auth.loginTitle') : $t('auth.signupTitle') }}
    </h3>
    <p class="premium-page__auth-subtitle">
      {{ authMode === 'login' ? $t('auth.loginSubtitle') : $t('auth.signupSubtitle') }}
    </p>

    <form class="premium-page__auth-form" @submit.prevent="handleAuthSubmit">
      <label class="premium-page__auth-field">
        <span>{{ $t('auth.email') }}</span>
        <input
          v-model="authForm.email"
          type="email"
          name="email"
          :placeholder="$t('auth.email')"
          autocomplete="email"
          required
        />
      </label>

      <label class="premium-page__auth-field">
        <span>{{ $t('auth.password') }}</span>
        <input
          v-model="authForm.password"
          type="password"
          name="password"
          :placeholder="$t('auth.password')"
          autocomplete="current-password"
          required
        />
      </label>

      <div v-if="error" class="premium-page__auth-error">
        {{ error }}
      </div>

      <button
        type="submit"
        class="btn btn-primary premium-page__auth-submit"
        :disabled="isAppLoading"
      >
        {{ isAppLoading
          ? $t('common.processing')
          : (authMode === 'login' ? $t('auth.login') : $t('auth.signup')) }}
      </button>
    </form>

    <p class="premium-page__auth-toggle">
      {{ authMode === 'login' ? $t('auth.noAccount') : $t('auth.haveAccount') }}
      <button type="button" class="premium-page__auth-toggle-link" @click="toggleAuthMode">
        {{ authMode === 'login' ? $t('auth.signup') : $t('auth.login') }}
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePremiumService } from '@/composables/usePremiumService'
import { useAuth } from '@/composables/useAuth'
import { useSupabaseAppAuth } from '@/composables/useSupabaseAppAuth'
import { useRouter } from 'vue-router'
import { supabaseApp } from '@/lib/supabase-app'
import type { PremiumPlanDTO, PremiumSubscriptionDTO, CreateCheckoutRequest, CheckoutResponse, PremiumPlanId, CancelSubscriptionResponse } from '@/types/premium'
import { PremiumNotImplementedError } from '@/types/premium'

const { t } = useI18n()
const router = useRouter()
const { isAuthenticated: isLandingAuthenticated } = useAuth()
const {
  currentUser: appUser,
  isAuthenticated: isAppAuthenticated,
  isLoadingAuth: isAppLoading,
  initAuth: initSupabaseAppAuth,
  signIn: appSignIn,
  signUp: appSignUp,
  signOut: appSignOut,
  getSession: getAppSession
} = useSupabaseAppAuth()

const {
  listPlans,
  getSubscription,
  createCheckout,
  cancelSubscription,
} = usePremiumService()

// Auth form state
const isShowingAuthForm = ref(false)
const authMode = ref<'login' | 'signup'>('login')
const pendingPlanId = ref<Exclude<PremiumPlanId, 'free'> | null>(null)
const authForm = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

// Translation key mapping for premium plans
const getTranslationKey = (planId: string) => {
  const mapping: Record<string, string> = {
    'premium': 'premium',
    'premium-annual': 'annual',
    'free': 'free'
  }
  return mapping[planId] || planId
}

/**
 * Transforms raw plan data from the service into the format expected by the template.
 * Adds i18n keys for badge and features, and freePlan flag.
 */
function transformPlans(rawPlans: any[]) {
  return rawPlans.map(plan => {
    // If it already looks like a transformed plan, return as-is
    if (plan.badge !== undefined && Array.isArray(plan.features)) {
      return plan
    }

    const transformed = {
      ...plan,
      freePlan: plan.id === 'free'
    }

    // Add badge as translation key
    if (plan.id === 'premium') {
      transformed.badge = 'premium.plans.badge'
    } else if (plan.id === 'premium-annual') {
      transformed.badge = 'premium.plans.annual.badge'
    }
    // free plan has no badge (leave as undefined)

    // Add features as array of translation keys
    switch (plan.id) {
      case 'free':
        transformed.features = [
          'premium.plans.free.features.favorites',
          'premium.plans.free.features.unlimitedWatchlist',
          'premium.plans.free.features.officialTrailers'
        ]
        break
      case 'premium':
        transformed.features = [
          'premium.plans.premium.features.unlimitedSync',
          'premium.plans.premium.features.personalStats',
          'premium.plans.premium.features.fullHistory',
          'premium.plans.premium.features.adFree',
          'premium.plans.premium.features.aiRecommendations',
          'premium.plans.premium.features.smartNotifications',
          'premium.plans.premium.features.exclusiveWidgets'
        ]
        break
      case 'premium-annual':
        transformed.features = [
          'premium.plans.annual.features.sameBenefits'
        ]
        break
      default:
        transformed.features = []
    }

    return transformed
  })
}

// State
const plans = ref<any[]>([])
const subscription = ref<PremiumSubscriptionDTO | null>(null)
const loading = ref<boolean>(true)
const error = ref<string | null>(null)
// Non-fatal auth notice shown in the plans view, e.g. "confirm your email".
const authNotice = ref<string | null>(null)
const checkoutLoading = ref<boolean>(false)

// Computed
const isPremiumActive = computed(() => subscription.value?.status === 'active')

// Methods
async function fetchPlans() {
  const data = await listPlans()
  plans.value = transformPlans(data)
}

async function fetchSubscription() {
  try {
    const data = await getSubscription()
    subscription.value = data
  } catch (err) {
    error.value = 'Failed to load subscription'
    console.error('Error fetching subscription:', err)
  }
}

async function fetchData() {
  error.value = null
  loading.value = true
  try {
    // Always fetch plans (public endpoint).
    const plansData = await listPlans()
    plans.value = transformPlans(plansData)

    if (isAppAuthenticated.value) {
      const subscriptionData = await getSubscription()
      subscription.value = subscriptionData
    } else {
      subscription.value = null
    }
  } catch (err) {
    error.value = 'Failed to load premium data'
    console.error('PremiumPage fetch error:', err)
  } finally {
    loading.value = false
  }
}

async function handleFreePlan() {
  // Free plan doesn't require backend activation in current implementation
  alert(t('premium.messages.freeActivated'))
  // Refresh subscription status only if user is authenticated
  if (isAppAuthenticated.value) {
    await fetchSubscription()
  }
}

async function handleCheckout(planId: Exclude<PremiumPlanId, 'free'>) {
  if (checkoutLoading.value) return

  checkoutLoading.value = true
  error.value = null

  try {
    // Verify Supabase App session exists and has valid access token
    const { data: { session } } = await supabaseApp.auth.getSession()
    if (!session?.access_token || !session?.user?.id) {
      error.value = 'Please sign in to continue with checkout.'
      console.warn('[PremiumPage] No valid Supabase App session for checkout')
      return
    }

    const checkoutRequest: CreateCheckoutRequest = { plan_id: planId }
    const checkout = await createCheckout(checkoutRequest)
    const initPoint = typeof checkout === 'string'
      ? checkout
      : (checkout as Partial<{ init_point?: string; sandbox_init_point?: string; checkout_url?: string }>).init_point
        ?? (checkout as Partial<{ init_point?: string; sandbox_init_point?: string; checkout_url?: string }>).sandbox_init_point
        ?? (checkout as Partial<{ init_point?: string; sandbox_init_point?: string; checkout_url?: string }>).checkout_url

    if (!initPoint) {
      throw new Error('Missing checkout URL in checkout response')
    }

    // Redirect to Mercado Pago checkout
    window.location.href = initPoint
  } catch (err) {
    // Provide more specific error message for common cases
    if (err instanceof Error) {
      if (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('Invalid token')) {
        error.value = 'Authentication expired. Please sign in again.'
      } else if (err.message.includes('400') || err.message.includes('Bad Request')) {
        error.value = 'Invalid plan selection. Please try again.'
      } else if (err.message.includes('Missing checkout URL')) {
        error.value = 'Checkout configuration error. Please contact support.'
      } else {
        error.value = 'Checkout failed. Please try again.'
      }
    } else {
      error.value = 'Checkout failed. Please try again.'
    }
    console.error('Checkout error:', err)
  } finally {
    checkoutLoading.value = false
  }
}

async function handleCancelSubscription() {
  if (!subscription.value) return

  try {
    await cancelSubscription()
    // Refresh subscription status after cancellation
    await fetchSubscription()
    alert(t('premium.messages.cancelled'))
  } catch (err) {
    error.value = 'Cancellation failed. Please try again.'
    console.error('Cancellation error:', err)
  }
}

const PREMIUM_PLAN_KEY = 'premium_pending_plan'

// Lifecycle
onMounted(() => {
  // Initialize Supabase App authentication state
  initSupabaseAppAuth()

  // Check for plan query parameter (e.g., after email confirmation redirect)
  const routePlan = new URLSearchParams(window.location.search).get('plan')
  if (routePlan) {
    pendingPlanId.value = routePlan as PremiumPlanId
    // Clean URL
    const cleanUrl = `${window.location.pathname}`
    window.history.replaceState({}, document.title, cleanUrl)
  }

  fetchData()
})

// React to auth state changes (login/logout)
watch(isAppAuthenticated, (newVal) => {
  if (newVal) {
    // User just logged in - fetch subscription data
    fetchSubscription()
  } else {
    // User just logged out - clear subscription
    subscription.value = null
  }
})

// Debug: watch isShowingAuthForm to see when it changes
watch(isShowingAuthForm, (newVal) => {
  console.log('[PremiumPage] isShowingAuthForm changed to:', newVal)
})

// Auth Methods
function showAuthModal(planId: Exclude<PremiumPlanId, 'free'>) {
  pendingPlanId.value = planId
  authForm.email = ''
  authForm.password = ''
  isShowingAuthForm.value = true
}

function closeAuthModal() {
  isShowingAuthForm.value = false
  pendingPlanId.value = null
}

async function handleAuthSubmit() {
  if (authMode.value === 'login') {
    await handleLogin()
  } else {
    await handleSignup()
  }
}

async function handleLogin() {
  try {
    await appSignIn(authForm.email, authForm.password)
    // Capture the plan id before closeAuthModal clears pendingPlanId
    const planIdSel = pendingPlanId.value
    closeAuthModal()

    // After successful login, proceed with checkout
    if (planIdSel) {
      await handleCheckout(planIdSel)
    }
  } catch (err) {
    error.value = 'Invalid email or password'
    console.error('Login error:', err)
  }
}

async function handleSignup() {
  try {
    const { session } = await appSignUp(authForm.email, authForm.password)

    // Email confirmation required -> do NOT resume checkout now.
    // Store the pending plan in sessionStorage so it survives the email confirmation redirect.
    if (!session) {
      if (pendingPlanId.value) {
        try {
          sessionStorage.setItem(PREMIUM_PLAN_KEY, pendingPlanId.value)
        } catch {
          /* ignore */
        }
      }
      isShowingAuthForm.value = false
      authNotice.value = t('auth.emailConfirmation')
      return
    }

    // Capture the plan id before closeAuthModal clears pendingPlanId
    const planIdSel = pendingPlanId.value
    closeAuthModal()

    if (planIdSel) {
      await handleCheckout(planIdSel)
    }
  } catch (err) {
    error.value = 'Signup failed. Please try again.'
    console.error('Signup error:', err)
  }
}

function toggleAuthMode() {
  authMode.value = authMode.value === 'login' ? 'signup' : 'login'
  // Clear form when switching modes
  authForm.email = ''
  authForm.password = ''
  authForm.confirmPassword = ''
  authNotice.value = null
}

// New method to handle checkout or show auth
async function handleCheckoutOrShowAuth(planId: Exclude<PremiumPlanId, 'free'>) {
  if (isAppAuthenticated.value) {
    await handleCheckout(planId)
  } else {
    showAuthModal(planId)
  }
}

async function handleSignOut() {
  await appSignOut()
}
</script>

<style scoped lang="scss">
@use '@/style/variables' as *;

.premium-page {
  &__intro {
    text-align: center;
    margin-bottom: $space-8;
  }

  &__title {
    font-size: $text-2xl;
    font-weight: $weight-bold;
    color: $color-text;
    margin: 0 0 $space-2 0;
  }

  &__subtitle {
    font-size: $text-base;
    color: $color-text-secondary;
    margin: 0;
  }

  &__loading,
  &__error {
    text-align: center;
    padding: $space-8;
    color: $color-text-secondary;
  }

  &__error {
    .btn-outline {
      margin-top: $space-4;
    }
  }

  &__premium-banner {
    background: linear-gradient(135deg, rgba($color-primary, 0.1) 0%, rgba($color-surface, 0.95) 100%);
    border: 1px solid $color-primary;
    border-radius: $radius-lg;
    padding: $space-4;
    margin-bottom: $space-6;
    display: flex;
    align-items: center;
    gap: $space-3;

    .premium-page__premium-content {
      display: flex;
      align-items: center;
      gap: $space-2;

      .premium-page__premium-icon {
        color: $color-primary;
      }

      span {
        font-weight: $weight-semibold;
        color: $color-text;
      }
    }
  }

  &__user-banner {
    background: linear-gradient(135deg, rgba($color-primary, 0.1) 0%, rgba($color-surface, 0.95) 100%);
    border: 1px solid $color-primary;
    border-radius: $radius-lg;
    padding: $space-4;
    margin-bottom: $space-6;
    display: flex;
    align-items: center;
    gap: $space-3;

    .premium-page__user-content {
      display: flex;
      align-items: center;
      gap: $space-3;
      flex: 1;

      .premium-page__user-icon {
        color: $color-primary;
      }

      span {
        font-weight: $weight-semibold;
        color: $color-text;
      }
    }

    .btn-outline {
      flex-shrink: 0;
    }
  }

  &__plans {
    display: grid;
    grid-template-columns: 1fr;
    gap: $space-6;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__plan-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: $space-6;
    background: $gradient-surface;
    border: 1px solid $color-border;
    border-radius: $radius-lg;
    transition: all $transition-fast;
    min-height: 100%;

    &--free {
      grid-column: 1 / -1;
    }

    &--premium,
    &--premium-annual {
      border-color: $color-primary;
      background: linear-gradient(135deg, rgba($color-primary, 0.1) 0%, rgba($color-surface, 0.95) 100%);
    }

    @media (hover: hover) {
      &:hover {
        transform: translateY(-2px);
        border-color: $color-border-hover;
      }
    }
  }

  &__plan-badge {
    position: absolute;
    top: -$space-3;
    right: $space-4;
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    padding: $space-1 $space-3;
    font-size: $text-xs;
    font-weight: $weight-semibold;
    background: linear-gradient(135deg, $color-primary 0%, $color-primary-active 100%);
    color: $color-text;
    border-radius: $radius-full;
    box-shadow: $shadow-primary-glow;
  }

  &__plan-header {
    margin-bottom: $space-4;
    padding-bottom: $space-4;
    border-bottom: 1px solid $color-border;
  }

  &__plan-name {
    font-size: $text-xl;
    font-weight: $weight-bold;
    color: $color-text;
    margin: 0 0 $space-2 0;
  }

  &__plan-description {
    font-size: $text-sm;
    color: $color-text-secondary;
    margin: 0;
    line-height: $leading-relaxed;
  }

  &__plan-price {
    display: flex;
    align-items: baseline;
    gap: $space-1;
    margin-bottom: $space-4;
  }

  &__plan-price-amount {
    font-size: $text-3xl;
    font-weight: $weight-bold;
    color: $color-primary;
  }

  &__plan-price-period {
    font-size: $text-sm;
    color: $color-text-secondary;
  }

  &__plan-features {
    list-style: none;
    padding: 0;
    margin: 0 0 $space-6 0;
    flex-grow: 1;
  }

  &__plan-feature {
    display: flex;
    align-items: flex-start;
    gap: $space-3;
    padding: $space-2 0;
    font-size: $text-sm;
    color: $color-text-secondary;
    line-height: $leading-relaxed;

    &-icon {
      flex-shrink: 0;
      font-size: $text-base;
    }
  }

  &__plan-button {
    width: 100%;
    position: relative;
    cursor: pointer;
    transition: all $transition-fast;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    &.btn-success {
      background: $color-success;
      border-color: $color-success;
      color: $color-text;

      &:hover {
        background: $color-success;
      }
    }
  }

  &__plan-button-badge {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: $space-1 $space-3;
    font-size: $text-xs;
    font-weight: $weight-medium;
    background: rgba($color-primary, 0.2);
    color: $color-primary;
    border: 1px solid rgba($color-primary, 0.4);
    border-radius: $radius-md;
  }

  &__plan-footer {
    margin-top: $space-4;
    padding-top: $space-4;
    border-top: 1px solid $color-border;
    font-size: $text-xs;
    color: $color-text-secondary;
    text-align: center;
    line-height: $leading-relaxed;
  }

  &__subscription-info {
    background: $color-surface;
    border-radius: $radius-md;
    padding: $space-4;
    margin-top: $space-6;
    text-align: center;

    p {
      margin-bottom: $space-3;
    }
  }

  &__plan-footer {
    margin-top: $space-4;
    padding-top: $space-4;
    border-top: 1px solid $color-border;
    font-size: $text-xs;
    color: $color-text-secondary;
    text-align: center;
    line-height: $leading-relaxed;
  }
}

.premium-page__auth {
  position: relative;
  padding: $space-6;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-lg;

  &-close {
    position: absolute;
    top: $space-3;
    right: $space-3;
    background: none;
    border: none;
    font-size: $text-2xl;
    line-height: 1;
    color: $color-text-secondary;
    cursor: pointer;
    padding: $space-1;
  }

  &-title {
    font-size: $text-xl;
    font-weight: $weight-bold;
    color: $color-text;
    margin: 0 0 $space-2 0;
  }

  &-subtitle {
    font-size: $text-sm;
    color: $color-text-secondary;
    margin: 0 0 $space-6 0;
  }

  &-form {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &-field {
    display: flex;
    flex-direction: column;
    gap: $space-1;

    span {
      font-size: $text-sm;
      font-weight: $weight-medium;
      color: $color-text;
    }

    input {
      padding: $space-3;
      font-size: $text-base;
      color: $color-text;
      background: $color-surface;
      border: 1px solid $color-border;
      border-radius: $radius-md;
      transition: border-color $transition-fast;

      &:focus {
        outline: none;
        border-color: $color-primary;
      }
    }
  }

  &-error {
    font-size: $text-sm;
    color: $color-text-secondary;
  }

  &-submit {
    width: 100%;
  }

  &-toggle {
    margin-top: $space-4;
    text-align: center;
    font-size: $text-sm;
    color: $color-text-secondary;

    &-link {
      background: none;
      border: none;
      color: $color-primary;
      font-weight: $weight-semibold;
      cursor: pointer;
      padding: 0 $space-1;
    }
  }
}
</style>
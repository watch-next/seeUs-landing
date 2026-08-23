<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import premiumService from '@/services/premium.service';
import type { PremiumSubscriptionDTO } from '@/types/premium';

const { t, d } = useI18n();
const router = useRouter();

/**
 * Mercado Pago returns the user to this page after the preapproval flow,
 * appending the preapproval id as `?preapproval_id=...`. We consult the
 * backend for the authoritative subscription status rather than trusting
 * the URL alone.
 */
type SuccessState = 'loading' | 'confirmed' | 'pending' | 'rejected' | 'canceled' | 'error';

const state = ref<SuccessState>('loading');
const loading = ref(true);
const errorMessage = ref('');
const subscription = ref<PremiumSubscriptionDTO | null>(null);

const preapprovalId = computed(
  () => (router.currentRoute.value.query.preapproval_id as string) ?? ''
);

async function fetchStatus(): Promise<void> {
  loading.value = true;
  try {
    // Backend endpoint /premium/subscription/status is public - no authentication required
    const result = await premiumService.getSubscriptionStatus(
      preapprovalId.value,
      // No frontend access token is passed; the endpoint is public.
      '',
    );
    if (!result) {
      // Backend reported no subscription found for this preapproval_id
      state.value = 'error';
      errorMessage.value = t('premium.success.errors.generic');
      return;
    }
    subscription.value = result;
    if (result.status === 'active' || result.status === 'authorized') {
      state.value = 'confirmed';
    } else if (result.status === 'pending') {
      state.value = 'pending';
    } else if (result.status === 'cancelled') {
      state.value = 'canceled';
    } else {
      // other state (rejected, expired, paused) remains unchecked.
      state.value = 'rejected';
    }
  } catch (error) {
    state.value = 'error';
    errorMessage.value =
      error instanceof Error ? error.message : t('premium.success.errors.generic');
  } finally {
    loading.value = false;
  }
}

function retry(): void {
  void fetchStatus();
}

/** i18n key for the subscribed plan name shown in the summary box. */
const planNameKey = computed(() => {
  const planId = subscription.value?.planId;
  if (planId === 'premium-annual') return 'premium.plans.annual.title';
  return 'premium.plans.premium.title';
});

/** Formatted renewal date, or null when the cycle has no end date. */
const renewalDate = computed(() => {
  const end = subscription.value?.currentPeriodEnd;
  if (!end) return null;
  const date = new Date(end);
  return Number.isNaN(date.getTime()) ? null : date;
});

function goToPremium(): void {
  // Reuse the existing destination route the app already navigates to.
  router.push('/premium');
}

onMounted(() => {
  void fetchStatus();
});
</script>

<template>
  <section class="success-page">
    <div class="success-card">
      <!-- Loading -->
      <div v-if="loading" class="success-state" data-testid="premium-success-loading">
        <span class="state-icon state-icon--spin" aria-hidden="true"></span>
        <h1 class="state-title">{{ t('premium.success.loading.title') }}</h1>
        <p class="state-description">{{ t('premium.success.loading.description') }}</p>
      </div>

      <!-- Confirmed -->
      <div v-else-if="state === 'confirmed'" class="success-state" data-testid="premium-success-confirmed">
        <span class="state-icon state-icon--success" aria-hidden="true">&#10003;</span>
        <h1 class="state-title">{{ t('premium.success.confirmed.title') }}</h1>
        <p class="state-description">{{ t('premium.success.confirmed.description') }}</p>

        <!-- Subscription summary -->
        <div class="summary-box" v-if="subscription">
          <div class="summary-box__row">
            <span class="summary-box__label">{{ t('premium.success.confirmed.summary.plan') }}</span>
            <span class="summary-box__value">{{ t(planNameKey) }}</span>
          </div>
          <div class="summary-box__row" v-if="renewalDate">
            <span class="summary-box__label">{{ t('premium.success.confirmed.summary.renewal') }}</span>
            <span class="summary-box__value">{{ d(renewalDate, 'medium', 'pt-BR') }}</span>
          </div>
        </div>

        <a href="/#platforms" class="btn btn-primary success-state__actions--primary">
          {{ t('premium.success.confirmed.downloadPlatform') }}
        </a>
        <button class="btn btn-ghost success-state__actions--secondary" type="button" @click="goToPremium">
          {{ t('premium.success.confirmed.backToStart') }}
        </button>
      </div>

      <!-- Pending payment -->
      <div v-else-if="state === 'pending'" class="success-state" data-testid="premium-success-pending">
        <span class="state-icon state-icon--pending" aria-hidden="true">&#8634;</span>
        <h1 class="state-title">{{ t('premium.success.pending.title') }}</h1>
        <p class="state-description">{{ t('premium.success.pending.description') }}</p>
        <button class="btn btn--outline" type="button" @click="retry">
          {{ t('premium.success.pending.retry') }}
        </button>
      </div>

      <!-- Canceled -->
      <div v-else-if="state === 'canceled'" class="success-state" data-testid="premium-success-canceled">
        <span class="state-icon state-icon--error" aria-hidden="true">&#10006;</span>
        <h1 class="state-title">{{ t('premium.success.canceled.title') }}</h1>
        <p class="state-description">{{ t('premium.success.canceled.description') }}</p>
        <button class="btn btn--outline" type="button" @click="goToPremium">
          {{ t('premium.success.canceled.back') }}
        </button>
      </div>

      <!-- Rejected -->
      <div v-else-if="state === 'rejected'" class="success-state" data-testid="premium-success-rejected">
        <span class="state-icon state-icon--error" aria-hidden="true">&#10006;</span>
        <h1 class="state-title">{{ t('premium.success.rejected.title') }}</h1>
        <p class="state-description">{{ t('premium.success.rejected.description') }}</p>
        <button class="btn btn--outline" type="button" @click="goToPremium">
          {{ t('premium.success.rejected.back') }}
        </button>
      </div>

      <!-- Error -->
      <div v-else-if="state === 'error'" class="success-state" data-testid="premium-success-error">
        <span class="state-icon state-icon--error" aria-hidden="true">&#10006;</span>
        <h1 class="state-title">{{ t('premium.success.error.title') }}</h1>
        <p class="state-description">{{ errorMessage || t('premium.success.error.description') }}</p>
        <button class="btn btn--outline" type="button" @click="retry">
          {{ t('premium.success.error.retry') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.success-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 64px;
}

.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  :deep(.btn) {
    width: 100%;
    max-width: 340px;
    margin-top: 0.75rem;
  }

  :deep(.btn-primary) {
    margin-top: 1.5rem;
  }

  @media (min-width: 640px) {
    :deep(.btn) {
      width: auto;
      min-width: 220px;
    }
  }
}

.state-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: $space-10;
  height: $space-10;
  margin-bottom: $space-4;
  border-radius: $radius-full;
  font-size: $text-3xl;
  font-weight: $weight-bold;
  line-height: 1;
}

.state-icon--success {
  color: #ffffff;
  background: $color-success;
  border: 1px solid $color-success;
}

.state-icon--pending {
  color: $color-text;
}

.state-icon--error {
  color: $color-error;
}

.state-title {
  margin: 0 0 $space-2;
  color: $color-text;
  font-size: $text-2xl;
  font-weight: $weight-semibold;
}

.state-description {
  margin: 0;
  color: $color-text-muted;
  font-size: $text-base;
  line-height: 1.6;
}

.success-state__actions--primary {
  margin-top: 1.5rem;
}

.success-state__actions--secondary {
  margin-top: 0.75rem;
}

.summary-box {
  width: 100%;
  max-width: 340px;
  margin-top: 1.5rem;
  padding: $space-4 $space-5;
  text-align: left;
  background: $gradient-surface;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
}

.summary-box__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-2 0;

  & + & {
    border-top: 1px solid $color-divider;
  }
}

.summary-box__label {
  color: $color-text-muted;
  font-size: $text-sm;
}

.summary-box__value {
  color: $color-text;
  font-weight: $weight-medium;
  text-align: right;
}
</style>
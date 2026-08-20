<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { usePremiumService } from '@/composables/usePremiumService';

const { t } = useI18n();
const router = useRouter();
const { getSubscriptionStatus } = usePremiumService();

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

const preapprovalId = computed(
  () => (router.currentRoute.value.query.preapproval_id as string) ?? ''
);

async function fetchStatus(): Promise<void> {
  if (!preapprovalId.value) {
    // No preapproval id in the URL — treat as an invalid/erroneous return.
    state.value = 'error';
    errorMessage.value = t('premium.success.errors.noId');
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const subscription = await getSubscriptionStatus(preapprovalId.value);
    if (!subscription) {
      // No authenticated session or backend reported no subscription —
      // we cannot confirm activation, so surface an error.
      state.value = 'error';
      errorMessage.value = t('premium.success.errors.generic');
      return;
    }
    if (subscription.status === 'active' || subscription.status === 'authorized') {
      state.value = 'confirmed';
    } else if (subscription.status === 'pending') {
      state.value = 'pending';
    } else if (subscription.status === 'cancelled') {
      state.value = 'canceled';
    } else {
      // Any other state (rejected, expired, paused) remains unchecked.
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
        <button class="btn btn--primary" type="button" @click="goToPremium">
          {{ t('premium.success.confirmed.continue') }}
        </button>
      </div>

      <!-- Pending payment -->
      <div v-else-if="state === 'pending'" class="success-state" data-testid="premium-success-pending">
        <span class="state-icon state-icon--pending" aria-hidden="true">&#9889;</span>
        <h1 class="state-title">{{ t('premium.success.pending.title') }}</h1>
        <p class="state-description">{{ t('premium.success.pending.description') }}</p>
        <div class="success-actions">
          <button class="btn btn--primary" type="button" @click="retry">
            {{ t('premium.success.pending.retry') }}
          </button>
          <button class="btn btn--secondary" type="button" @click="goToPremium">
            {{ t('premium.success.actions.goToPremium') }}
          </button>
        </div>
      </div>

      <!-- Rejected payment -->
      <div v-else-if="state === 'rejected'" class="success-state" data-testid="premium-success-rejected">
        <span class="state-icon state-icon--rejected" aria-hidden="true">&#10007;</span>
        <h1 class="state-title">{{ t('premium.success.rejected.title') }}</h1>
        <p class="state-description">{{ t('premium.success.rejected.description') }}</p>
        <button class="btn btn--primary" type="button" @click="goToPremium">
          {{ t('premium.success.actions.goToPremium') }}
        </button>
      </div>

      <!-- Canceled subscription -->
      <div v-else-if="state === 'canceled'" class="success-state" data-testid="premium-success-canceled">
        <span class="state-icon state-icon--canceled" aria-hidden="true">&#10006;</span>
        <h1 class="state-title">{{ t('premium.success.canceled.title') }}</h1>
        <p class="state-description">{{ t('premium.success.canceled.description') }}</p>
        <button class="btn btn--primary" type="button" @click="goToPremium">
          {{ t('premium.success.actions.goToPremium') }}
        </button>
      </div>

      <!-- Error -->
      <div v-else class="success-state" data-testid="premium-success-error">
        <span class="state-icon state-icon--error" aria-hidden="true">&#9888;</span>
        <h1 class="state-title">{{ t('premium.success.errors.title') }}</h1>
        <p class="state-description">{{ errorMessage }}</p>
        <div class="success-actions">
          <button class="btn btn--primary" type="button" @click="retry">
            {{ t('premium.success.errors.retry') }}
          </button>
          <button class="btn btn--secondary" type="button" @click="goToPremium">
            {{ t('premium.success.actions.goToPremium') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/style/variables' as *;

.success-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-16 $space-4;
  min-height: 70vh;
}

.success-card {
  width: 100%;
  max-width: 480px;
  padding: $space-12 $space-8;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-card-lg;
  text-align: center;
  box-shadow: $shadow-card;
}

.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
}

.state-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: $radius-full;
  font-size: 1.75rem;
  font-weight: 700;
}

.state-icon--success {
  color: $color-success;
  border: 2px solid $color-success;
}

.state-icon--pending {
  color: $color-warning;
  border: 2px solid $color-warning;
}

.state-icon--rejected,
.state-icon--error {
  color: $color-error;
  border: 2px solid $color-error;
}

.state-icon--spin {
  border: 3px solid $color-border;
  border-top-color: $color-primary;
  border-radius: $radius-full;
  animation: premium-spin 0.8s linear infinite;
}

@keyframes premium-spin {
  to {
    transform: rotate(360deg);
  }
}

.state-title {
  margin: 0;
  color: $color-text;
  font-family: $font-primary;
  font-size: 1.5rem;
  font-weight: 700;
}

.state-description {
  margin: 0;
  color: $color-text-secondary;
  font-family: $font-primary;
  font-size: 1rem;
  line-height: 1.6;
}

.success-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  justify-content: center;
  margin-top: $space-2;
}

.btn {
  padding: $space-3 $space-6;
  border-radius: $radius-button-lg;
  font-family: $font-primary;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: $transition-base;

  &--primary {
    color: $color-text;
    background: $color-primary;
    border: 1px solid $color-primary;

    &:hover {
      background: $color-primary-hover;
      border-color: $color-primary-hover;
    }
  }

  &--secondary {
    color: $color-text;
    background: transparent;
    border: 1px solid $color-border;

    &:hover {
      background: $color-surface-hover;
      border-color: $color-text-secondary;
    }
  }
}
</style>
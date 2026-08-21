<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import premiumService from '@/services/premium.service';

const { t } = useI18n();
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

const preapprovalId = computed(
  () => (router.currentRoute.value.query.preapproval_id as string) ?? ''
);

async function fetchStatus(): Promise<void> {
  loading.value = true;
  try {
    // Backend endpoint /premium/subscription/status is public - no authentication required
    const subscription = await premiumService.getSubscriptionStatus(preapprovalId.value);
    if (!subscription) {
      // Backend reported no subscription found for this preapproval_id
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
        <p class="state-description">{{ errorMessage.value || t('premium.success.error.description') }}</p>
        <button class="btn btn--outline" type="button" @click="retry">
          {{ t('premium.success.error.retry') }}
        </button>
      </div>
    </div>
  </section>
</template>
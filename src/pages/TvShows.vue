<template>
  <div class="tv-shows-page">
    <div class="container">
      <!-- Header -->
      <header class="tv-shows-page__header">
        <Breadcrumbs :items="[{ label: t('common.home'), to: '/' }, { label: t('navigation.tvShows') }]" />
        <h1 class="tv-shows-page__title">{{ t('navigation.tvShows') }}</h1>
        <p class="tv-shows-page__subtitle">{{ t('tvShows.underConstruction') }}</p>
      </header>

      <AdsterraBanner />
    </div>

    <AdsterraNative />
  </div>
</template>

<script setup lang="ts">
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import { useI18n } from 'vue-i18n'
import { useSeo } from '@/composables/useSeo'
import AdsterraBanner from '@/components/ads/AdsterraBanner.vue'
import AdsterraNative from '@/components/ads/AdsterraNative.vue'

const { t } = useI18n()

// SEO
useSeo({
  title: 'TV Shows | SeeUs',
  description: 'Discover our curated collection of TV series',
  type: 'website',
})
</script>

<style lang="scss" scoped>
.tv-shows-page {
  padding: clamp(1rem, 3vw, 2rem) 0 clamp(2rem, 4vw, 4rem);

  &__header {
    margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
  }

  &__title {
    font-size: clamp(1.5rem, 3vw, 2.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
  }

  &__subtitle {
    font-size: clamp(0.9375rem, 1.2vw, 1.125rem);
    color: var(--text-secondary);
    margin: 0;
  }
}
</style>
<template>
  <article v-if="series" class="tv-show-page">
    <div class="cinematic-card" :style="{ backgroundImage: series.backdrop_path ? `url('https://image.tmdb.org/t/p/original${series.backdrop_path}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: series.backdrop_path ? 'transparent' : 'var(--bg-primary)' }">
      <div class="container tv-show-page__container">
        <!-- Breadcrumb -->
        <Breadcrumbs :items="breadcrumbItems" />
         <!-- Adsterra Banner -->
            <AdsterraBanner class="tv-show-page__adsterra" />

            <!-- AdSense Banner -->
            <AdSenseAd format="auto" layout="in-feed" responsive class="tv-show-page__ad" />
        <!-- Header with Poster and Backdrop -->
        <header class="tv-show-page__header">
          <div class="tv-show-page__media">
            <div class="tv-show-page__poster">
              <img v-if="posterUrl" :src="posterUrl" :alt="series.name" class="tv-show-page__poster-img" loading="lazy" />
              <div v-else class="tv-show-page__poster-placeholder">
                <span>📺</span>
                <p>{{ t('tvShow.no_poster') }}</p>
              </div>
            </div>
          </div>

          <div class="tv-show-page__info">
            <h1 class="tv-show-page__title">{{ series.name }}</h1>

            <p v-if="series.original_name && series.original_name !== series.name" class="tv-show-page__original-title">
              <span class="label">{{ t('tvShow.original_title') }}:</span> {{ series.original_name }}
            </p>

            <p v-if="series.tagline" class="tv-show-page__tagline">"{{ series.tagline }}"</p>

            <div class="tv-show-page__meta">
              <span class="tv-show-page__year" v-if="firstAirYear">
                {{ firstAirYear }}
              </span>
              <span class="tv-show-page__year" v-if="lastAirYear && lastAirYear !== firstAirYear">–{{ lastAirYear }}</span>
              <span class="tv-show-page__seasons" v-if="numberOfSeasons">
                {{ numberOfSeasons }} {{ t('tvShow.seasons') }}
              </span>
              <span class="tv-show-page__status" v-if="series.status">
                {{ series.status }}
              </span>
              <span class="tv-show-page__popularity" v-if="series.popularity">
                {{ t('tvShow.popularity') }}: {{ series.popularity.toFixed(0) }}
              </span>
            </div>

            <!-- Ratings -->
            <div class="tv-show-page__ratings" v-if="series">
              <div class="tv-show-page__rating-circle" :style="{
                background: animatedRatingPercentage !== null
                  ? `conic-gradient(
                    from -90deg,
                    #3E8BFF 0%,
                    #3E8BFF ${animatedRatingPercentage}%,
                    #1A1F55 ${animatedRatingPercentage}%,
                    #1A1F55 100%
                  )`
                  : '#1A1F55',
                boxShadow: animatedRatingPercentage !== null ? '0 0 12px rgba(62, 139, 255, 0.12)' : 'none'
              }">
                <div class="tv-show-page__rating-circle__inner">
                  <span class="tv-show-page__rating-circle__rating-value">{{ animatedRatingPercentage !== null ?
                    `${animatedRatingPercentage}%` : 'N/A' }}</span>
                </div>
              </div>
              <div class="tv-show-page__ratings__count" v-if="series.vote_count">
                {{ series.vote_count.toLocaleString() }} {{ t('tvShow.votes') }}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="tv-show-page__action-buttons" v-if="series">
              <button type="button" @click="toggleAction('watchlist')" :aria-pressed="activeActions.watchlist"
                :class="['tv-show-page__action-btn', { 'tv-show-page__action-btn--active': activeActions.watchlist }]"
                title="Add to your watch list">
                <img :src="`/assets/icons/discover.svg`" alt="" class="action-icon" aria-hidden="true" />
                <span class="action-label">{{ t('tvShow.watchlist') }}</span>
              </button>
              <button type="button" @click="toggleAction('favorite')" :aria-pressed="activeActions.favorite"
                :class="['tv-show-page__action-btn', { 'tv-show-page__action-btn--active': activeActions.favorite }]"
                title="Add to your favorites">
                <img :src="`/assets/icons/rating.svg`" alt="" class="action-icon" aria-hidden="true" />
                <span class="action-label">{{ t('tvShow.favorite') }}</span>
              </button>
              <button type="button" @click="toggleAction('interest')" :aria-pressed="activeActions.interest"
                :class="['tv-show-page__action-btn', { 'tv-show-page__action-btn--active': activeActions.interest }]"
                title="Mark as interested">
                <img :src="`/assets/icons/track.svg`" alt="" class="action-icon" aria-hidden="true" />
                <span class="action-label">{{ t('tvShow.interest') }}</span>
              </button>
            </div>

            <!-- Genres as Chips -->
            <div class="tv-show-page__genres" v-if="series.genres && series.genres.length">
              <Chip v-for="genre in series.genres" :key="genre.id" :label="genre.name" />
            </div>
            <!-- Action Buttons (aligned in block) -->
            <div class="tv-show-page__actions">
              <a v-if="series.homepage" :href="series.homepage" target="_blank" rel="noopener noreferrer"
                class="tv-show-page__btn tv-show-page__btn--homepage">
                🌐 {{ t('tvShow.official_site') }}
                <span class="external-link-icon">↗</span>
              </a>
              <button type="button" @click="showWatchModal = true" class="tv-show-page__btn tv-show-page__btn--watch">
                📺 {{ t('tvShow.watch_now') }}
              </button>
            </div>

            <!-- Synopsis -->
            <section class="tv-show-page__synopsis">
              <h2 class="synopsis__title">{{ t('tvShow.synopsis') }}</h2>
              <p v-if="series.overview" class="synopsis__content">{{ series.overview }}</p>
              <p v-else class="synopsis__empty">{{ t('tvShow.no_synopsis') }}</p>
            </section>
          </div>
        </header>
      </div>
    </div>
  </article>

  <!-- Current Season Section -->
  <section v-if="series && series.number_of_seasons && series.number_of_seasons > 0" class="tv-show-page__season section">
    <div class="container">
      <h2 class="section__title">{{ t('tvShow.season.title') }}</h2>

      <div v-if="isLoadingSeason" class="season__loading">
        <div class="spinner"></div>
        <p>{{ t('tvShow.season.loading') }}</p>
      </div>

      <div v-else-if="seasonError" class="season__error">
        <p>{{ seasonError }}</p>
      </div>

      <div v-else-if="currentSeason" class="season__card">
        <div class="season__media">
          <img
            v-if="currentSeason.poster_path"
            :src="getTmdbImageUrl(currentSeason.poster_path, 'w500')"
            :alt="currentSeason.name"
            class="season__poster"
            loading="lazy"
          />
          <div v-else class="season__poster-placeholder">
            <span>📺</span>
            <p>{{ t('tvShow.no_poster') }}</p>
          </div>
        </div>

        <div class="season__info">
          <h3 class="season__name">{{ currentSeason.name || `${t('tvShow.season.season')} ${currentSeason.season_number}` }}</h3>

          <p v-if="currentSeason.air_date" class="season__air-date">
            <span class="label">{{ t('tvShow.season.air_date') }}:</span>
            {{ formatDate(currentSeason.air_date) }}
          </p>

          <p v-if="currentSeason.episode_count > 0" class="season__episodes">
            <span class="label">{{ t('tvShow.season.episodes') }}:</span>
            {{ t('tvShow.season.episode_count', { count: currentSeason.episode_count }) }}
          </p>

          <p v-if="currentSeason.vote_average !== undefined && currentSeason.vote_average !== null" class="season__rating">
            <span class="label">{{ t('tvShow.votes') }}:</span>
            <span class="rating">{{ currentSeason.vote_average.toFixed(1) }}</span>
            <span class="rating__stars" aria-hidden="true">★</span>
          </p>

          <p v-if="currentSeason.overview" class="season__overview">
            <span class="label">{{ t('tvShow.season.overview') }}:</span>
            {{ currentSeason.overview }}
          </p>
        </div>
      </div>

      <p v-else class="season__empty">{{ t('tvShow.season.no_overview') }}</p>
    </div>
  </section>

  <!-- Media Section -->
  <section v-if="series && (series.poster_path || series.backdrop_path)" class="tv-show-page__media-section section">
    <div class="container">
      <h2 class="section__title">{{ t('tvShow.media.title') }}</h2>

      <!-- Media Tabs -->
      <div class="media__tabs" role="tablist" aria-label="{{ t('tvShow.media.title') }}">
        <button
          v-if="series.poster_path"
          role="tab"
          :aria-selected="activeMediaTab === 'posters'"
          :aria-controls="activeMediaTab === 'posters' ? 'media-panel-posters' : undefined"
          :id="activeMediaTab === 'posters' ? 'tab-posters' : undefined"
          class="media__tab"
          :class="{ 'media__tab--active': activeMediaTab === 'posters' }"
          @click="activeMediaTab = 'posters'"
        >
          {{ t('tvShow.media.posters') }}
        </button>
        <button
          v-if="series.backdrop_path"
          role="tab"
          :aria-selected="activeMediaTab === 'backdrops'"
          :aria-controls="activeMediaTab === 'backdrops' ? 'media-panel-backdrops' : undefined"
          :id="activeMediaTab === 'backdrops' ? 'tab-backdrops' : undefined"
          class="media__tab"
          :class="{ 'media__tab--active': activeMediaTab === 'backdrops' }"
          @click="activeMediaTab = 'backdrops'"
        >
          {{ t('tvShow.media.backdrops') }}
        </button>
      </div>

      <!-- Posters Panel -->
      <div
        v-if="activeMediaTab === 'posters' && series.poster_path"
        role="tabpanel"
        id="media-panel-posters"
        :aria-labelledby="activeMediaTab === 'posters' ? 'tab-posters' : undefined"
        class="media__panel"
      >
        <div class="media__grid">
          <figure class="media__item" @click="openMediaModal(getTmdbImageUrl(series.poster_path, 'original'))">
            <img
              :src="getTmdbImageUrl(series.poster_path, 'w500')"
              :alt="series.name"
              class="media__image"
              loading="lazy"
            />
            <figcaption class="media__caption">{{ series.name }} - Poster</figcaption>
          </figure>
        </div>
      </div>

      <!-- Backdrops Panel -->
      <div
        v-else-if="activeMediaTab === 'backdrops' && series.backdrop_path"
        role="tabpanel"
        id="media-panel-backdrops"
        :aria-labelledby="activeMediaTab === 'backdrops' ? 'tab-backdrops' : undefined"
        class="media__panel"
      >
        <div class="media__grid">
          <figure class="media__item" @click="openMediaModal(getTmdbImageUrl(series.backdrop_path ?? '', 'original'))">
            <img
              :src="getTmdbImageUrl(series.backdrop_path, 'w1280')"
              :alt="series.name"
              class="media__image"
              loading="lazy"
            />
            <figcaption class="media__caption">{{ series.name }} - Backdrop</figcaption>
          </figure>
        </div>
      </div>

      <p v-else class="media__empty">{{ t('tvShow.media.no_media') }}</p>
    </div>
  </section>

  <!-- Related Shows Section -->
  <section v-if="series" class="tv-show-page__related section">
    <div class="container">
      <h2 class="section__title">{{ t('tvShow.related.title') }}</h2>

      <div v-if="isLoadingRelated" class="related__loading">
        <div class="spinner"></div>
        <p>{{ t('common.loading') }}...</p>
      </div>

      <div v-else-if="relatedError" class="related__error">
        <p>{{ relatedError }}</p>
      </div>

      <div v-else-if="relatedShows.length > 0" class="related__carousel">
        <div class="related__scroll" ref="relatedScroll">
          <div class="related__track" :style="{ transform: `translateX(-${relatedScrollX}px)` }">
            <div
              v-for="show in relatedShows"
              :key="show.id"
              class="related__card"
            >
              <a :href="`/tv-shows/${show.id}-${slugify(show.name)}-${show.first_air_date ? new Date(show.first_air_date).getFullYear() : ''}`" class="related__link">
                <div class="related__poster">
                  <img
                    v-if="show.poster_path"
                    :src="getTmdbImageUrl(show.poster_path, 'w342')"
                    :alt="show.name"
                    class="related__image"
                    loading="lazy"
                  />
                  <div v-else class="related__placeholder">
                    <span>📺</span>
                  </div>
                </div>
                <div class="related__info">
                  <h3 class="related__title">{{ show.name }}</h3>
                  <p v-if="show.vote_average !== undefined && show.vote_average !== null" class="related__rating">
                    <span aria-hidden="true">★</span>
                    {{ show.vote_average.toFixed(1) }}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <!-- Scroll buttons -->
        <button
          class="related__nav related__nav--prev"
          :aria-label="t('tvShow.related.prev')"
          @click="scrollRelated(-1)"
          :disabled="relatedScrollX <= 0"
        >
          ‹
        </button>
        <button
          class="related__nav related__nav--next"
          :aria-label="t('tvShow.related.next')"
          @click="scrollRelated(1)"
          :disabled="relatedScrollX >= relatedMaxScroll"
        >
          ›
        </button>
      </div>

      <p v-else class="related__empty">{{ t('tvShow.related.no_related') }}</p>
    </div>
  </section>

  <!-- Media Modal -->
  <div v-if="showMediaModal" class="media-modal-overlay" role="dialog" aria-modal="true" aria-label="{{ t('tvShow.media.title') }}" @click="closeMediaModal" @keydown.esc="closeMediaModal">
    <div class="media-modal" @click.stop>
      <button class="media-modal__close" :aria-label="t('tvShow.watch_dialog.close')" @click="closeMediaModal">
        ×
      </button>
      <img
        v-if="selectedMediaImage"
        :src="selectedMediaImage"
        :alt="series?.name || ''"
        class="media-modal__image"
      />
    </div>
  </div>

  <div v-else-if="isLoading" class="container tv-show-page__loading">
    <div class="tv-show-page__skeleton">
      <div class="tv-show-page__skeleton-poster"></div>
      <div class="tv-show-page__skeleton-info">
        <div class="tv-show-page__skeleton-title"></div>
        <div class="tv-show-page__skeleton-meta"></div>
        <div class="tv-show-page__skeleton-overview"></div>
      </div>
    </div>
  </div>

  <div v-else-if="error" class="container tv-show-page__error">
    <p>{{ error === 404 ? t('tvShow.not_found') : t('common.error') }}</p>
  </div>

  <!-- Watch Dialog: platform choice + streaming providers -->
  <div v-if="showWatchModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="watch-modal-title"
    @click="showWatchModal = false" @keydown.esc="showWatchModal = false">
    <div class="modal modal--watch" @click.stop>
      <div class="modal__header">
        <div>
          <h2 id="watch-modal-title">{{ t('tvShow.watch_dialog.title') }}</h2>
          <p class="modal__subtitle">{{ t('tvShow.watch_dialog.subtitle') }}</p>
        </div>
        <button class="modal__close" :aria-label="t('tvShow.watch_dialog.close')" @click="showWatchModal = false">
          ×
        </button>
      </div>

      <div class="modal__content">
        <!-- Platform choice -->
        <div class="watch-platforms">
          <a v-if="downloadWeb" :href="downloadWeb" target="_blank" rel="noopener noreferrer"
            class="watch-platform watch-platform--web">
            <span class="watch-platform__icon" aria-hidden="true">🌐</span>
            <span class="watch-platform__body">
              <span class="watch-platform__title">{{ t('tvShow.watch_dialog.web_app') }}</span>
              <span class="watch-platform__desc">{{ t('tvShow.watch_dialog.web_app_desc') }}</span>
            </span>
          </a>

          <a v-if="downloadAndroid" :href="downloadAndroid" target="_blank" rel="noopener noreferrer"
            class="watch-platform watch-platform--android">
            <span class="watch-platform__icon" aria-hidden="true">▶</span>
            <span class="watch-platform__body">
              <span class="watch-platform__title">{{ t('tvShow.watch_dialog.android_app') }}</span>
              <span class="watch-platform__desc">{{ t('tvShow.watch_dialog.android_app_desc') }}</span>
            </span>
          </a>
        </div>

        <!-- Streaming providers (collapsible) -->
        <div class="watch-streams">
          <button type="button" class="watch-streams__toggle" :aria-expanded="showStreams"
            @click="showStreams = !showStreams">
            <span>{{ t('watch.stream_label') }}</span>
            <span class="watch-streams__chevron" aria-hidden="true">{{ showStreams ? '▲' : '▼' }}</span>
          </button>

          <div v-show="showStreams">
            <div v-if="isLoadingProviders" class="providers__loading">
              <p>{{ t('common.loading') }}...</p>
            </div>

            <div v-else-if="!hasProviders" class="providers__empty">
              <p>{{ t('tvShow.no_providers') }}</p>
            </div>

            <div v-else class="providers">
              <section v-for="section in providerSections" :key="section.key" class="providers__category">
                <h3>{{ t(section.label) }}</h3>
                <div class="providers__grid">
                  <div v-for="provider in section.providers" :key="provider.id" class="provider__card"
                    @click="onProviderCardClick">
                    <img v-if="provider.logo_path" :src="getProviderImageUrl(provider.logo_path)" :alt="provider.name"
                      class="provider__logo" />
                    <span class="provider__name">{{ provider.name }}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <AdsterraNative class="tv-show-page__adsterra-native" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { generateMovieSchema } from '@/lib/seo'
import { useSeo } from '@/composables/useSeo'
import { useWatchProviders } from '@/composables/useWatchProviders'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import Chip from '@/components/Chip.vue'
import AdSenseAd from '@/components/ads/AdSenseAd.vue'
import AdsterraBanner from '@/components/ads/AdsterraBanner.vue'
import { getSeriesBySlug } from '@/lib/content/SeriesRepository'
import { loadDownloadConfig } from '@/services/downloads'
import AdsterraNative from '@/components/ads/AdsterraNative.vue'
import { getTmdbImageUrl } from '@/services/movie.service'
import { useAdsterraPopunder } from '@/composables/useAdsterraPopunder'
import { fetchSeasonDetails, fetchSimilarShows } from '@/lib/api/tvDataSource'
import { slugify } from '@/lib/content/slugify'
import type { SeasonDetail, TVShowDetail } from '@/lib/tmdb/types'

const { t } = useI18n()
const route = useRoute()

// Watch dialog state: platform choice first, streaming providers below (collapsible)
const showStreams = ref(true)
const downloadWeb = ref('')
const downloadAndroid = ref('')
loadDownloadConfig().then((cfg) => {
  downloadWeb.value = cfg.web || ''
  downloadAndroid.value = cfg.android || ''
})

// Composable para watch providers
const {
  providers,
  isLoading: isLoadingProviders,
  hasProviders,
  providerSections,
  loadedMovieId,
  loadProviders,
} = useWatchProviders()

const { maybeTriggerPopunder } = useAdsterraPopunder()

// Provider-card click: keep the card's default behavior intact; a single
// session-capped popunder may fire alongside it (premium users excluded).
function onProviderCardClick() {
  void maybeTriggerPopunder()
}

// Route uses :slug param containing series ID in format: {id}-{title-slugified}
const tmdbId = computed(() => {
  const slug = String(route.params.slug || '')
  // Extract TMDB ID (numeric) from the beginning of the slug
  const match = slug.match(/^(\d+)-/)
  return match ? parseInt(match[1], 10) : null
})

const series = ref<Awaited<ReturnType<typeof getSeriesBySlug>> | null>(null)
const isLoading = ref(true)
const showWatchModal = ref(false)
const error = ref<number | string | null>(null)

// providers, isLoadingProviders, loadedMovieId já vêm do composable

const breadcrumbItems = computed(() => [
  { label: t('common.home'), to: '/' },
  { label: t('tvShows.title'), to: '/tv-shows' },
  { label: series.value?.name || tmdbId.value },
])

const canonicalUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://watchnext.app'
  return `${baseUrl}/tv-shows/${tmdbId.value}`
})

const posterUrl = computed(() => {
  return getTmdbImageUrl(series.value?.poster_path ?? null, 'w500')
})

const backdropUrl = computed(() => {
  return getTmdbImageUrl(series.value?.backdrop_path ?? null, 'original')
})

const firstAirYear = computed(() => {
  if (!series.value?.first_air_date) return ''
  return new Date(series.value.first_air_date).getFullYear().toString()
})

const lastAirYear = computed(() => {
  if (!series.value?.last_air_date) return ''
  return new Date(series.value.last_air_date).getFullYear().toString()
})

const numberOfSeasons = computed(() => series.value?.number_of_seasons || 0)

const ratingPercentage = computed<number | null>(() => {
  const v = series.value?.vote_average

  if (typeof v !== 'number' || !Number.isFinite(v)) {
    return null
  }

  return Math.min(100, Math.max(0, Math.round(v * 10)))
})

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function formatMoney(amount: number | null): string {
  if (!amount) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch (e) {
    return ''
  }
}

function getProviderImageUrl(logoPath: string | null): string | undefined {
  return getTmdbImageUrl(logoPath, 'w92')
}

// Load series data and watch providers in parallel
onMounted(async () => {
  try {
    isLoading.value = true
    error.value = null
    const slug = String(route.params.slug || '')
    if (!slug) {
      throw new Error('Invalid slug')
    }

    // Load series details and watch providers in parallel
    console.debug('[TvShow.vue] Attempting to load series with slug:', slug)
    await Promise.all([
      (async () => {
        series.value = await getSeriesBySlug(slug)
        console.debug('[TvShow.vue] Series loaded successfully:', series.value?.name || 'unknown')
        if (!series.value) {
          throw new Error('Series not found')
        }
      })(),
      (async () => {
        // For watch providers, we need to pass the series ID (TMDB ID)
        // We assume the watchProviders composable works with TMDB ID
        const id = tmdbId.value
        if (id) {
          await loadProviders(id)
        }
      })(),
    ])
  } catch (err: any) {
    console.error('[TvShow.vue] Error fetching series:', {
      message: err?.message,
      isAxiosError: !!err?.isAxiosError,
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      url: err?.config?.url,
      slug: route.params.slug,
      tmdbId: tmdbId.value
    })
    error.value = err?.response?.status === 404 ? 404 : 'unknown'
    series.value = null
  } finally {
    isLoading.value = false
  }
})

// Rating animation state
const ratingAnimated = ref(false)
const animatedRatingPercentage = ref<number | null>(null)

// Check if reduced motion is preferred
const prefersReducedMotion = ref(false)
onMounted(() => {
  if (window.matchMedia) {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
})

// Watch for series data changes to trigger rating animation
watch(series, (newSeries) => {
  if (newSeries && !ratingAnimated.value) {
    // If reduced motion is preferred, show immediately without animation
    if (prefersReducedMotion.value) {
      animatedRatingPercentage.value = ratingPercentage.value
      ratingAnimated.value = true
      return
    }

    // Start animation from 0% to actual rating percentage
    const actualRating = ratingPercentage.value
    if (actualRating !== null) {
      animatedRatingPercentage.value = 0
      ratingAnimated.value = true

      // Animate the percentage value
      const duration = 800 // ms
      const startTime = performance.now()

      function animatePercentage(currentTime: number) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Use ease-out cubic for smooth animation
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        animatedRatingPercentage.value = Math.round(easedProgress * actualRating!)

        if (progress < 1) {
          requestAnimationFrame(animatePercentage)
        } else {
          // Ensure we end at exact value
          animatedRatingPercentage.value = actualRating
        }
      }

      requestAnimationFrame(animatePercentage)
    } else {
      // For N/A ratings, just show immediately
      animatedRatingPercentage.value = null
      ratingAnimated.value = true
    }
  }
})

// Fallback: carrega providers apenas se necessário (não foi carregado no onMounted)
watchEffect(() => {
  const currentSeriesId = series.value?.id
  // Só carrega se: modal aberto, não carregado para este series, e não está carregando
  if (showWatchModal.value && currentSeriesId && loadedMovieId.value !== currentSeriesId && !isLoadingProviders.value) {
    loadProviders(currentSeriesId)
  }
})

// Independent visual toggle state for the three action buttons (UI-only, no persistence)
const activeActions = ref<{ watchlist: boolean; favorite: boolean; interest: boolean }>({
  watchlist: false,
  favorite: false,
  interest: false,
})

// Current Season state
const currentSeason = ref<SeasonDetail | null>(null)
const isLoadingSeason = ref(false)
const seasonError = ref<string | null>(null)

// Media tabs state
const activeMediaTab = ref<'posters' | 'backdrops'>('posters')
const showMediaModal = ref(false)
const selectedMediaImage = ref<string | null>(null)

// Related shows state
const relatedShows = ref<TVShowDetail[]>([])
const isLoadingRelated = ref(false)
const relatedError = ref<string | null>(null)

function toggleAction(action: 'watchlist' | 'favorite' | 'interest') {
  activeActions.value[action] = !activeActions.value[action]
}

// Fetch current season (latest season based on number_of_seasons)
async function loadCurrentSeason() {
  // Use the TMDB ID from the route (already computed from slug)
  const id = tmdbId.value
  const seasonNumber = series.value?.number_of_seasons

  // Log before early-return condition
  console.log('[TvShow][SeasonDebug] loadCurrentSeason called:', {
    tmdbId: id,
    seasonNumber: series.value?.number_of_seasons,
    earlyReturnCondition: !id || !seasonNumber || seasonNumber <= 0
  })

  // If we don't have a valid ID or season number, we can't proceed
  if (!id || !seasonNumber || seasonNumber <= 0) {
    console.log('[TvShow][SeasonDebug] Early return: invalid id or seasonNumber')
    return
  }

  isLoadingSeason.value = true
  seasonError.value = null

  try {
    console.log('[TvShow][SeasonDebug] Calling fetchSeasonDetails with:', {
      tmdbId: id,
      seasonNumber: seasonNumber
    })
    const season = await fetchSeasonDetails(id, seasonNumber)
    console.log('[TvShow][SeasonDebug] fetchSeasonDetails resolved:', {
      season: season ? 'Season object received' : 'null/undefined'
    })
    currentSeason.value = season
  } catch (err) {
    console.log('[TvShow][SeasonDebug] fetchSeasonDetails failed:', err)
    seasonError.value = t('tvShow.season.error')
    console.log('Failed to load season:', err)
  } finally {
    isLoadingSeason.value = false
  }
}

// Fetch related shows
async function loadRelatedShows() {
  if (!series.value) return

  isLoadingRelated.value = true
  relatedError.value = null

  try {
    const response = await fetchSimilarShows(series.value.id, 10)
    relatedShows.value = response.results
  } catch (err) {
    relatedError.value = t('tvShow.related.no_related')
    console.error('Failed to load related shows:', err)
  } finally {
    isLoadingRelated.value = false
  }
}

// Media modal handlers
function openMediaModal(imageUrl: string) {
  selectedMediaImage.value = imageUrl
  showMediaModal.value = true
  document.body.style.overflow = 'hidden'
}

function closeMediaModal() {
  showMediaModal.value = false
  selectedMediaImage.value = null
  document.body.style.overflow = ''
}

// Related carousel state
const relatedScrollX = ref(0)
const relatedScroll = ref<HTMLElement | null>(null)
const cardWidth = 230 // card width + gap (220px + 10px)

// Related carousel computed
const relatedMaxScroll = computed(() => {
  if (!relatedScroll.value) return 0
  const containerWidth = relatedScroll.value.clientWidth
  const trackWidth = relatedShows.value.length * cardWidth
  return Math.max(0, trackWidth - containerWidth)
})

function scrollRelated(direction: -1 | 1) {
  if (!relatedScroll.value) return
  const newScrollX = relatedScrollX.value + direction * cardWidth * 2
  relatedScrollX.value = Math.max(0, Math.min(newScrollX, relatedMaxScroll.value))
  relatedScroll.value.scrollTo({ left: relatedScrollX.value, behavior: 'smooth' })
}

// Load additional data when series is loaded
watch(series, (newSeries) => {
  if (newSeries) {
    loadCurrentSeason()
    loadRelatedShows()
  }
})

// Setup SEO
const seoTitle = computed(() => series.value ? `${series.value.name} | SeeUs` : 'TV Shows | SeeUs')
const seoDescription = computed(() => series.value?.overview || 'Discover our curated collection of TV shows')
const seoImage = computed(() => getTmdbImageUrl(series.value?.poster_path ?? null))
const ogType = computed(() => 'video.tv_show')

// TV Show JSON-LD structured data
const seriesJsonLd = computed(() => {
  if (!series.value) return {}
  return {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: series.value.name,
    description: series.value.overview || '',
    image: getTmdbImageUrl(series.value.poster_path),
    datePublished: series.value.first_air_date,
    creator: [] // TODO: add creator if available
  } as any
})

useSeo({
  title: seoTitle,
  description: seoDescription,
  url: canonicalUrl,
  image: seoImage,
  type: ogType,
  jsonLd: seriesJsonLd,
})
</script>

<style lang="scss" scoped>
.tv-show-page {
  padding: 2rem 0 4rem;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__loading {
    padding: 4rem 0;
    text-align: center;
    color: var(--text-secondary);
  }

  &__header {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    margin-bottom: 3rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.5rem;

      .tv-show-page__poster {
        max-width: 300px;
        margin: 0 auto;
      }
    }
  }

  &__media {
    position: relative;
  }

  &__backdrop {
    margin-top: 1.5rem;
    border-radius: 8px;
    overflow: hidden;

    &-img {
      width: 100%;
      height: auto;
      display: block;
    }
  }

  &__poster {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

    &-img {
      width: 100%;
      aspect-ratio: 2 / 3;
      object-fit: cover;
      display: block;
    }

    &-placeholder {
      width: 100%;
      aspect-ratio: 2 / 3;
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      font-size: 3rem;

      span {
        font-size: 4rem;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 0.875rem;
        margin: 0;
      }
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
  }

  &__title {
    font-size: clamp(1.9rem, 1.5vw + 1.4rem, 2.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.15;
  }

  &__original-title {
    color: var(--text-secondary);
    font-size: 1.125rem;
    margin: 0;

    .label {
      font-weight: 600;
      color: var(--text-tertiary);
    }
  }

  &__tagline {
    font-style: italic;
    color: var(--text-secondary);
    font-size: 1rem;
    margin: 0;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin: 0.5rem 0 1rem;

    span {
      font-size: 0.875rem;
      color: var(--text-secondary);
      background: transparent;
      padding: 0;
      border-radius: 0;
    }

    span::after {
      content: "•";
      margin: 0 0.5rem;
      color: var(--border);
    }

    span:last-child::after {
      content: "";
      margin: 0;
    }
  }


  &__genres {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem 0;

    .chip {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);

      &:hover {
        background: var(--bg-secondary);
        border-color: var(--border);
      }
    }
  }

  &__synopsis {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);

    &__title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }

    &__content {
      color: var(--text-secondary);
      line-height: 1.7;
      margin: 0;
    }

    &__empty {
      color: var(--text-tertiary);
      font-style: italic;
    }
  }

  &__homepage {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--brand-primary);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
    margin-top: 1rem;

    &:hover {
      background: var(--brand-primary-hover, var(--brand-primary));
      transform: translateY(-2px);
    }

    .external-link-icon {
      font-size: 1rem;
    }
  }

  &__actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      flex-direction: column;
    }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9375rem;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    &--homepage {
      background: var(--brand-primary);
      color: white;

      &:hover {
        background: var(--brand-primary-hover, var(--brand-primary));
        transform: translateY(-2px);
      }

      .external-link-icon {
        font-size: 1rem;
      }
    }

    &--watch {
      flex: 1;
      min-width: 200px;
      background: var(--brand-accent);
      color: white;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--brand-accent-rgb), 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  &__loading {
    padding: 4rem 0;
    text-align: center;
    color: var(--text-secondary);
  }

  &__error {
    padding: 4rem 0;
    text-align: center;
    color: var(--text-error, #ef4444);
  }

  &__skeleton {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    &-poster {
      width: 100%;
      aspect-ratio: 2 / 3;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 200% 100%;
      border-radius: 8px;
      animation: shimmer 1.5s infinite;
    }

    &-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    &-title {
      height: 3rem;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      animation: shimmer 1.5s infinite;
    }

    &-meta {
      height: 1.5rem;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      animation: shimmer 1.5s infinite;
    }

    &-overview {
      height: 6rem;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      animation: shimmer 1.5s infinite;
    }
  }
}

.tv-show-page__ratings {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.5rem 0;
  overflow: visible;
}

.tv-show-page__rating-circle {
  width: 72px;
  height: 72px;
  min-width: 72px;
  min-height: 72px;
  max-width: 72px;
  max-height: 72px;
  flex: 0 0 72px;
  display: grid;
  place-items: center;
  position: relative;
  box-sizing: border-box;
  border-radius: 50%;
  overflow: visible;
}

.tv-show-page__rating-circle__inner {
  width: 62px;
  height: 62px;
  min-width: 62px;
  min-height: 62px;
  border-radius: 50%;
  background: var(--bg-primary);
  display: grid;
  place-items: center;
  box-sizing: border-box;
}

.tv-show-page__rating-circle__rating-value {
  display: block;
  margin: 0;
  padding: 0;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1rem;
}

.tv-show-page__ratings__count {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 400;
  margin: 0;
  padding: 0;
  white-space: nowrap;
}

/* Action Buttons */
.tv-show-page__action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.tv-show-page__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tv-show-page__action-btn .action-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tv-show-page__action-btn .action-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* Tint icon to SeeUs primary color */
  filter: brightness(0) saturate(100%) invert(22%) sepia(11%) saturate(449%) hue-rotate(190deg) brightness(95%) contrast(102%);
  transition: filter 0.2s ease;
}

.tv-show-page__action-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent);
}

.tv-show-page__action-btn:hover .action-icon img {
  /* Lighter icon on hover */
  filter: brightness(0) saturate(100%) invert(22%) sepia(11%) saturate(449%) hue-rotate(190deg) brightness(105%) contrast(102%);
}

.tv-show-page__action-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent);
  transform: translateY(-1px);
}

.tv-show-page__action-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.tv-show-page__action-btn:active {
  transform: translateY(0);
}

.tv-show-page__action-btn--active {
  background: var(--bg-tertiary);
  border-color: var(--accent);
  color: var(--brand-accent);
  box-shadow: 0 0 0 1px inset var(--accent);
}

.tv-show-page__action-btn--active .action-icon img {
  filter: brightness(0) saturate(100%) invert(43%) sepia(81%) saturate(2061%) hue-rotate(210deg) brightness(100%) contrast(101%);
}

@media (prefers-reduced-motion: reduce) {
  .tv-show-page__action-btn {
    transition: none;
  }
}

@media (max-width: 480px) {
  .tv-show-page__action-buttons {
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .tv-show-page__action-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.85rem;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-primary);
    }
  }

  &__close {
    background: transparent;
    border: none;
    font-size: 2rem;
    color: var(--text-secondary);
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }

  &__content {
    padding: 2rem;
  }
}

.providers {
  display: flex;
  flex-direction: column;
  gap: 2rem;

  &__category {
    h3 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: var(--text-primary);
      font-weight: 600;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
  }

  &__loading,
  &__empty {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }
}

.provider {
  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--bg-tertiary);
      transform: translateY(-2px);
    }
  }

  &__logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
  }

  &__name {
    font-size: 0.85rem;
    color: var(--text-primary);
    text-align: center;
    font-weight: 500;
    line-height: 1.3;
  }
}

// Watch dialog: platform-first layout
.modal--watch {
  max-width: 560px;
}

.modal__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.watch-platforms {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.watch-platform {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:hover {
    transform: translateY(-2px);
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    font-size: 1.25rem;
    flex-shrink: 0;
    background: var(--bg-tertiary);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  &__title {
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__desc {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  &--web {
    background: var(--brand-accent);
    box-shadow: 0 6px 18px rgba(var(--brand-accent-rgb), 0.25);

    &:hover {
      box-shadow: 0 8px 22px rgba(var(--brand-accent-rgb), 0.4);
    }

    .watch-platform__title {
      color: #fff;
    }

    .watch-platform__desc {
      color: rgba(255, 255, 255, 0.85);
    }

    .watch-platform__icon {
      background: rgba(255, 255, 255, 0.18);
    }
  }

  &--android {
    background: var(--bg-secondary);
    border: 1px solid var(--border);

    &:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
  }
}

.watch-streams {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.625rem 0;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-secondary);
    transition: color 0.2s ease;

    &:hover {
      color: var(--text-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }

  &__chevron {
    font-size: 0.75rem;
  }
}

// Mobile dialog: near full width, bottom sheet feel
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.75rem;
    align-items: flex-end;
  }

  .modal {
    max-height: 92vh;
    overflow-y: auto;
    border-radius: 16px 16px 0 0;
  }

  .modal__header {
    padding: 1.25rem 1.25rem 1rem;
  }

  .modal__content {
    padding: 1.25rem;
  }

  .watch-platform {
    padding: 0.875rem 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .watch-platform,
  .watch-streams__toggle,
  .provider__card,
  .tv-show-page__btn {
    transition: none;
  }
}

/* Genres chips */
.tv-show-page__genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0;

  /* We'll rely on the Chip component's existing styles, but we can adjust if needed */
  /* Ensure chips don't grow too large */
  >* {
    /* Override any Chip styles if necessary, but we prefer not to modify Chip globally */
    /* We'll just ensure they are not too big */
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }
}

/* Synopsis */
.tv-show-page__synopsis {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;

    &::after {
      content: "";
      flex-grow: 1;
      height: 1px;
      background: var(--bg-secondary);
    }
  }

  &__content {
    color: var(--text-secondary);
    line-height: 1.7;
    font-size: 1rem;
    max-width: 60ch;
    /* For readability */
    margin: 0;
  }

  &__empty {
    color: var(--text-tertiary);
    font-style: italic;
    max-width: 60ch;
  }
}

.cinematic-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 2rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.9) 25%,
      rgba(0, 0, 0, 0.7) 90%,
      rgba(0, 0, 0, 0.4) 100%,
      transparent 80%
    );
    pointer-events: none;
    z-index: 1;
  }

  & > .container {
    position: relative;
    z-index: 2;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .tv-show-page__genres>* {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .tv-show-page__synopsis {
    &__title {
      font-size: 1.125rem;
    }

    &__content,
    &__empty {
      font-size: 0.875rem;
    }
  }
}
@media (prefers-reduced-motion: reduce) {
  .watch-platform,
  .watch-streams__toggle,
  .provider__card,
  .tv-show-page__btn {
    transition: none;
  }
}

/* Section base styles */
.section {
  padding: 3rem 0;

  &__title {
    font-size: clamp(1.5rem, 1.25vw + 1.25rem, 1.875rem);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 1.5rem 0;
    letter-spacing: -0.01em;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

/* Current Season Section */
.tv-show-page__season {
  .season__loading,
  .season__error,
  .season__empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-secondary);
  }

  .season__card {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 2rem;
    align-items: start;
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid var(--border);

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  .season__media {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .season__poster {
    width: 240px;
    aspect-ratio: 2 / 3;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

    @media (max-width: 768px) {
      width: 100%;
      max-width: 280px;
      margin: 0 auto;
    }
  }

  .season__poster-placeholder {
    width: 240px;
    aspect-ratio: 2 / 3;
    border-radius: 12px;
    background: var(--bg-tertiary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: 3rem;
    border: 1px dashed var(--border);

    @media (max-width: 768px) {
      width: 100%;
      max-width: 280px;
      margin: 0 auto;
    }

    span {
      font-size: 4rem;
      margin-bottom: 0.5rem;
    }

    p {
      font-size: 0.875rem;
      margin: 0;
    }
  }

  .season__info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .season__name {
    font-size: clamp(1.25rem, 1vw + 1rem, 1.5rem);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
  }

  .season__air-date,
  .season__episodes,
  .season__rating,
  .season__overview {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.5;

    .label {
      font-weight: 600;
      color: var(--text-primary);
      min-width: fit-content;
      flex-shrink: 0;
    }
  }

  .season__rating {
    .rating {
      font-weight: 700;
      color: var(--accent);
    }

    .rating__stars {
      color: var(--accent);
      margin-left: 0.25rem;
    }
  }

  .season__overview {
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border);
  }
}

/* Media Section */
.tv-show-page__media-section {
  .media__tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--border);
    padding-bottom: 0.5rem;
    flex-wrap: wrap;

    @media (max-width: 480px) {
      gap: 0.25rem;
    }
  }

  .media__tab {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      color: var(--text-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      border-radius: 4px;
    }

    &--active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
  }

  .media__panel {
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .media__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;

    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.75rem;
    }

    @media (max-width: 480px) {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.5rem;
    }
  }

  .media__item {
    margin: 0;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  }

  .media__image {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 12px;
    object-fit: cover;
    aspect-ratio: 2 / 3;
  }

  .media__caption {
    display: none; /* Hidden by default, shown on hover if needed */
  }

  .media__empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-secondary);
  }
}

/* Related Shows Section */
.tv-show-page__related {
  .related__loading,
  .related__error,
  .related__empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-secondary);
  }

  .related__carousel {
    position: relative;
    padding: 0 4rem;

    @media (max-width: 768px) {
      padding: 0 3rem;
    }

    @media (max-width: 480px) {
      padding: 0 2.5rem;
    }
  }

  .related__scroll {
    overflow-x: auto;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .related__track {
    display: flex;
    gap: 1rem;
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
  }

  .related__card {
    flex: 0 0 220px;
    scroll-snap-align: start;

    @media (max-width: 768px) {
      flex: 0 0 180px;
    }

    @media (max-width: 480px) {
      flex: 0 0 150px;
    }
  }

  .related__link {
    text-decoration: none;
    color: inherit;
    display: block;
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-4px);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  }

  .related__poster {
    position: relative;
    aspect-ratio: 2 / 3;
    border-radius: 12px;
    overflow: hidden;
    background: var(--bg-tertiary);
  }

  .related__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .related__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    color: var(--text-tertiary);
  }

  .related__info {
    padding: 0.75rem 0.25rem 0;
    text-align: center;
  }

  .related__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.25rem 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .related__rating {
    font-size: 0.8125rem;
    color: var(--accent);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    margin: 0;
  }

  .related__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    color: var(--text-primary);
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;

    &:hover:not(:disabled) {
      background: var(--bg-tertiary);
      border-color: var(--accent);
      color: var(--accent);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &--prev {
      left: 0;

      @media (max-width: 480px) {
        left: -1rem;
      }
    }

    &--next {
      right: 0;

      @media (max-width: 480px) {
        right: -1rem;
      }
    }
  }
}

/* Media Modal */
.media-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
  animation: fadeIn 0.2s ease;

  @media (max-width: 480px) {
    padding: 0.5rem;
    align-items: center;
  }
}

.media-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}

.media-modal__close {
  position: absolute;
  top: -50px;
  right: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--accent);
    color: var(--accent);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    top: -45px;
    right: -5px;
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
}

.media-modal__image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);

  @media (max-width: 480px) {
    border-radius: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .media__tab,
  .media__item,
  .related__link,
  .related__nav,
  .media-modal,
  .media-modal__close {
    transition: none;
    animation: none;
  }
}
</style>
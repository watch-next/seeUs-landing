<template>
  <div class="about-page">
    <section class="about-hero">
      <div class="container">
        <h1 class="about-hero__title">{{ t('about.hero.title') }}</h1>
        <p class="about-hero__subtitle">{{ t('about.hero.subtitle') }}</p>
      </div>
    </section>

    <section
      v-for="section in bodySections"
      :id="section.id"
      :key="section.key"
      :class="section.className"
    >
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">{{ t(`about.${section.key}.title`) }}</h2>
          <p v-if="hasSubtitle(section.key)" class="about-section__subtitle" v-html="t(`about.${section.key}.subtitle`)"></p>
        </div>

        <div v-if="section.key === 'technologies'" class="about-technologies__grid">
          <div
            v-for="tech in technologies"
            :key="tech.name"
            class="about-tech-card"
          >
            <h3 class="about-tech-card__name">{{ tech.name }}</h3>
            <p class="about-tech-card__description">{{ tech.description }}</p>
          </div>
        </div>

        <div v-else class="about-section__body">
          <template v-for="(block, index) in sectionBlocks(section.key)" :key="index">
            <h3 v-if="block.heading" :class="`${section.className}__heading`">{{ block.heading }}</h3>
            <p :class="block.statement ? `${section.className}__statement` : undefined" v-html="block.body"></p>
          </template>
        </div>
      </div>
    </section>

    <section id="about-faq" class="about-faq">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">{{ t('about.faq.title') }}</h2>
          <p class="about-section__subtitle">{{ t('about.faq.subtitle') }}</p>
        </div>
        <div class="about-faq__items">
          <details
            v-for="item in faqItems"
            :key="item.question"
            class="about-faq__item"
          >
            <summary class="about-faq__question">{{ item.question }}</summary>
            <p class="about-faq__answer" v-html="item.answer"></p>
          </details>
        </div>
      </div>
    </section>

    <section class="about-cta">
      <div class="container">
        <h2 class="about-cta__title">{{ t('about.download.title') }}</h2>
        <p class="about-cta__subtitle">{{ t('about.download.subtitle') }}</p>
        <div class="about-cta__actions">
          <router-link to="/" class="about-cta__button about-cta__button--primary">
            {{ t('about.download.cta') }}
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useSeo } from '@/composables/useSeo'

type SectionKey = 'story' | 'why' | 'mission' | 'vision' | 'technologies' | 'how' | 'roadmap' | 'privacy' | 'community'

type ContentBlock = {
  heading?: string
  body: string
  statement?: boolean
}

const { t, tm, te } = useI18n()
const route = useRoute()

const bodySections: Array<{ key: SectionKey; className: string; id?: string }> = [
  { key: 'story', className: 'about-story' },
  { key: 'why', className: 'about-why' },
  { key: 'mission', className: 'about-mission' },
  { key: 'vision', className: 'about-vision', id: 'about-vision' },
  { key: 'technologies', className: 'about-technologies', id: 'about-technologies' },
  { key: 'how', className: 'about-how', id: 'about-how' },
  { key: 'roadmap', className: 'about-roadmap', id: 'about-roadmap' },
  { key: 'privacy', className: 'about-privacy', id: 'about-privacy' },
  { key: 'community', className: 'about-community', id: 'about-community' },
]

const hasSubtitle = (key: SectionKey) => te(`about.${key}.subtitle`)

const sectionBlocks = (key: SectionKey): ContentBlock[] => {
  const blocks = tm(`about.${key}.blocks`)
  return Array.isArray(blocks) ? (blocks as ContentBlock[]) : []
}

const technologies = computed(() => tm('about.technologies.items') as Array<{ name: string; description: string }>)
const faqItems = computed(() => tm('about.faq.items') as Array<{ question: string; answer: string }>)

const scrollToHash = async (hash: string) => {
  if (!hash) return
  await nextTick()
  document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  scrollToHash(route.hash)
})

watch(() => route.hash, scrollToHash)

useSeo({
  title: computed(() => t('about.seo.title')),
  description: computed(() => t('about.seo.description')),
  url: 'https://watchnext.app/about',
  canonical: 'https://watchnext.app/about',
})
</script>

<style scoped lang="scss">
@use '@/style/variables' as *;

.about-page {
  background: $color-background;
  color: $color-text;
  min-height: 100vh;
}

/* Shared section header */
.about-section__header {
  text-align: center;
  margin-bottom: $space-8;

  .about-section__title {
    font-size: $text-3xl;
    font-weight: $weight-bold;
    color: $color-text;
    margin-bottom: $space-3;
  }

  .about-section__subtitle {
    font-size: $text-lg;
    color: $color-text-muted;
    max-width: 720px;
    margin: 0 auto;
  }
}

.about-section__body {
  max-width: 800px;
  margin: 0 auto;
  font-size: $text-base;
  line-height: $leading-relaxed;
  color: $color-text-secondary;
}

/* 1. Hero */
.about-hero {
  padding: $space-20 0 $space-16;
  background: $gradient-hero;
  color: $color-text;
  text-align: center;

  &__title {
    font-size: $text-4xl;
    font-weight: $weight-extrabold;
    color: $color-text;
    margin-bottom: $space-4;
  }

  &__subtitle {
    font-size: $text-xl;
    color: $color-text;
    opacity: 0.9;
    max-width: 720px;
    margin: 0 auto;
  }
}

/* 2. Our Story */
.about-story {
  padding: $space-16 0;
}

.about-story__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;

  &:first-of-type {
    margin-top: 0;
  }
}

/* 3. Why SeeUs Exists */
.about-why {
  padding: $space-16 0;
  background: $gradient-section;
}

.about-why__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;
}

/* 4. Mission */
.about-mission {
  padding: $space-16 0;

  &__statement {
    font-size: $text-xl;
    font-weight: $weight-medium;
    color: $color-text;
    text-align: center;
    font-style: italic;
  }

  &__heading {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-top: $space-6;
    margin-bottom: $space-2;
  }
}

/* 5. Vision */
.about-vision {
  padding: $space-16 0;
  background: $gradient-section;

  &__heading {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-top: $space-6;
    margin-bottom: $space-2;
  }
}

/* 6. Technologies */
.about-technologies {
  padding: $space-16 0;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: $space-6;
  }
}

.about-tech-card {
  padding: $space-6;
  border-radius: $radius-card;
  background: $gradient-surface;
  border: 1px solid $color-border;
  transition: $transition-card;

  &:hover {
    border-color: $color-border-hover;
  }

  &__name {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-bottom: $space-2;
  }

  &__description {
    font-size: $text-sm;
    color: $color-text-secondary;
    line-height: $leading-relaxed;
  }
}

/* 7. How SeeUs Works */
.about-how {
  padding: $space-16 0;
  background: $gradient-section;

  &__heading {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-top: $space-6;
    margin-bottom: $space-2;
  }

  &__steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: $space-6;
  }

  &__step {
    text-align: center;
    padding: $space-6;
  }

  &__step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: $radius-full;
    background: $gradient-btn-primary;
    color: $color-text;
    font-size: $text-xl;
    font-weight: $weight-bold;
    margin-bottom: $space-3;
  }

  &__step-title {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-bottom: $space-2;
  }

  &__step-description {
    font-size: $text-sm;
    color: $color-text-secondary;
  }
}

.about-how__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;
}

/* 8. Development Roadmap */
.about-roadmap {
  padding: $space-16 0;

  &__timeline {
    display: grid;
    gap: $space-4;
    max-width: 800px;
    margin: 0 auto;
  }

  &__item {
    padding: $space-6;
    border-left: 4px solid $color-border;
    background: $color-surface;

    &--current {
      border-left-color: $color-primary;
    }
  }

  &__phase {
    display: inline-block;
    font-size: $text-xs;
    font-weight: $weight-semibold;
    color: $color-primary;
    text-transform: uppercase;
    letter-spacing: $tracking-wider;
    margin-bottom: $space-2;
  }

  &__title {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-bottom: $space-2;
  }

  &__description {
    font-size: $text-sm;
    color: $color-text-secondary;
  }
}

.about-roadmap__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;
}

/* 9. Privacy & Security */
.about-privacy {
  padding: $space-16 0;
  background: $gradient-section;
}

.about-privacy__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;
}

/* 10. Community */
.about-community {
  padding: $space-16 0;
}

.about-community__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;

  &:first-of-type {
    margin-top: 0;
  }
}

/* 11. FAQ */
.about-faq {
  padding: $space-16 0;
  background: $gradient-section;

  &__items {
    max-width: 800px;
    margin: 0 auto;
    display: grid;
    gap: $space-3;
  }

  &__item {
    background: $color-background;
    border-radius: $radius-card;
    padding: $space-4 $space-5;
    border: 1px solid $color-border;
    transition: border-color $transition-fast;

    &[open],
    &:hover {
      border-color: $color-border-hover;
    }
  }

  &__question {
    cursor: pointer;
    font-weight: $weight-semibold;
    font-size: $text-base;
    color: $color-text;
  }

  &__answer {
    margin-top: $space-3;
    color: $color-text-secondary;
    line-height: $leading-relaxed;
  }
}

/* 12. Download CTA */
.about-cta {
  padding: $space-20 0;
  background: $gradient-hero;
  color: $color-text;
  text-align: center;

  &__title {
    font-size: $text-3xl;
    font-weight: $weight-bold;
    color: $color-text;
    margin-bottom: $space-3;
  }

  &__subtitle {
    font-size: $text-lg;
    color: $color-text;
    opacity: 0.9;
    margin-bottom: $space-6;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: $space-4;
  }

  &__button {
    display: inline-block;
    padding: $space-3 $space-6;
    border-radius: $radius-button;
    font-weight: $weight-semibold;
    text-decoration: none;
    box-shadow: $shadow-card;
    transition: transform $duration-fast $ease-in-out,
                background-color $duration-fast $ease-in-out,
                border-color $duration-fast $ease-in-out;
    will-change: transform;

    &:hover {
      transform: translateY(-2px);
    }

    &--primary {
      background: $color-surface-light;
      color: $color-text;
      border: 1px solid $color-border;

      &:hover {
        background: $color-surface-hover;
        border-color: $color-primary;
        box-shadow: $shadow-card-hover;
      }
    }
  }
}
</style>

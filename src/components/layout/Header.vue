<template>
  <header class="header" :data-scrolled="scrolled" role="banner">
    <div class="container header__inner">
      <div class="header__brand">
        <button class="header__menu-toggle" aria-label="Toggle menu" :aria-expanded="menuOpen" aria-controls="main-nav"
          @click="toggleMenu">
          <span class="header__menu-bar"></span>
          <span class="header__menu-bar"></span>
          <span class="header__menu-bar"></span>
        </button>

        <div class="header__logo">
          <a href="/"><img class="header__logo-image" src="@/images/logo/favicon.ico" alt="SeeUs" /></a>
        </div>
        <nav class="header__nav" role="navigation" aria-label="Main navigation">
          <ul class="header__nav-list">
            <li v-for="link in headerNavigation" :key="link.href" class="header__nav-item">
              <router-link v-if="!link.isRoute" :to="{ path: '/', hash: link.href }" class="header__nav-link link-hover"
                @click="handleNavClick(link)">{{ link.label }}</router-link>
              <router-link v-else :to="link.href" class="header__nav-link link-hover" @click="handleNavClick(link)">{{
                link.label }}</router-link>
            </li>
          </ul>
        </nav>
      </div>
      <div class="header__actions">
        <div class="header__lang-switcher">
          <button class="header__lang-btn" @click="toggleLangMenu" aria-label="Select language">
            {{languages.find(l => l.code === currentLang)?.label}}
          </button>
          <ul v-if="showLangMenu" class="header__lang-dropdown">
            <li v-for="lang in languages" :key="lang.code">
              <button @click="selectLang(lang.code)">{{ lang.label }}</button>
            </li>
          </ul>
        </div>
      </div>

      <aside class="header__drawer" :class="{ 'header__drawer--open': menuOpen }" role="navigation"
        aria-label="Drawer navigation" id="main-nav">
        <ul class="header__drawer-list">
          <li v-if="isPremiumActive && !isCheckingPremium" class="header__drawer-item header__drawer-item--premium">
            <div class="header__premium-badge">
              <span class="badge">
                <span class="badge__status-dot" aria-hidden="true"></span>
                {{ t('header.premium') }}
              </span>
            </div>
          </li>
          <li v-for="link in drawerNavigation" :key="link.key" class="header__drawer-item">
            <router-link v-if="!link.isRoute" :to="{ path: '/', hash: link.href }" class="header__drawer-link"
              @click="handleNavClick(link)">
              <span class="drawer-item-icon" aria-hidden="true" v-html="iconMap[link.key]"></span>
              <span class="drawer-item-label">{{ link.label }}</span>
            </router-link>
            <router-link v-else :to="link.href" class="header__drawer-link" @click="handleNavClick(link)">
              <span class="drawer-item-icon" aria-hidden="true" v-html="iconMap[link.key]"></span>
              <span class="drawer-item-label">{{ link.label }}</span>
            </router-link>
          </li>
          
        </ul>
        <button class="header__login-btn" @click="handleLoginClick">
          <span class="drawer-item-icon" aria-hidden="true" v-html="iconMap.login"></span>
          <span class="drawer-item-label">{{ t('navigation.login') }}</span>
        </button>
      </aside>

      <div v-if="menuOpen" class="header__overlay" @click="closeMenu"></div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSupabaseAppAuth } from '@/composables/useSupabaseAppAuth'
import { usePremiumService } from '@/composables/usePremiumService'
import { trackEvent, trackNavigation, trackLanguageChange } from '@/services/analytics'

const { t, locale } = useI18n()
const { isAuthenticated, isLoadingAuth } = useSupabaseAppAuth()
const { hasActiveSubscription } = usePremiumService()

const menuOpen = ref(false)
const scrolled = ref(false)
const showLangMenu = ref(false)
const isPremiumActive = ref(false)
const isCheckingPremium = ref(false)

// Removed drawer-open emit as content shifting functionality was removed

const headerNavigation = computed(() => [
  { label: t('navigation.blog'), href: '/blog', isRoute: true },
  { label: t('navigation.movies'), href: '/movies', isRoute: true },
  { label: t('navigation.tvShows'), href: '/tv-shows', isRoute: true },
])

type IconKey = 'home' | 'platforms' | 'premium' | 'roadmap' | 'about' | 'login'

const drawerNavigation = computed<Array<{ key: IconKey; label: string; href: string; isRoute?: boolean }>>(() => [
  { key: 'home', label: t('navigation.home'), href: '' },
  { key: 'platforms', label: t('navigation.platforms'), href: '#platforms', isRoute: false },
  { key: 'premium', label: t('navigation.premium'), href: '#premium', isRoute: false },
  { key: 'roadmap', label: t('navigation.roadmap'), href: '#roadmap', isRoute: false },
  { key: 'about', label: t('navigation.about'), href: '/about', isRoute: true },
])

const iconMap: Record<IconKey, string> = {
  home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  platforms: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>',
  premium: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  roadmap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 12 8 12 8 18 10 18 10 12 16 12"></polyline></svg>',
  about: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  login: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><line x1="12" y1="16" x2="12.01" y2="16"/><path d="M12 8a4 4 0 0 0 0 8"></path></svg>'
}

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'pt-BR', label: 'PT' },
  { code: 'es', label: 'ESP' },
]

const currentLang = ref(locale.value)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function handleNavClick(link: { label?: string; href: string }) {
  trackEvent(trackNavigation(link.label ?? link.href, 'header'))
  closeMenu()
}

function handleLoginClick() {
  trackEvent(trackNavigation(t('navigation.login'), 'header'))
  closeMenu()
}

function toggleLangMenu() {
  showLangMenu.value = !showLangMenu.value
}

function selectLang(code: string) {
  const from = locale.value
  locale.value = code
  currentLang.value = code
  showLangMenu.value = false
  localStorage.setItem('watchnext-locale', code)
  trackEvent(trackLanguageChange(from, code))
}

// Premium badge logic
async function checkPremiumStatus() {
  if (!isAuthenticated.value || isLoadingAuth.value) {
    isPremiumActive.value = false
    return
  }

  isCheckingPremium.value = true
  try {
    isPremiumActive.value = await hasActiveSubscription()
  } catch (error) {
    console.error('[Header] Error checking premium status:', error)
    isPremiumActive.value = false
  } finally {
    isCheckingPremium.value = false
  }
}

watch([isAuthenticated, isLoadingAuth], () => {
  checkPremiumStatus()
})

onMounted(() => {
  const savedLang = localStorage.getItem('watchnext-locale')
  if (savedLang && ['en', 'pt-BR', 'es'].includes(savedLang)) {
    locale.value = savedLang
    currentLang.value = savedLang
  }
  checkPremiumStatus()
})

// Scroll detection for header animation
const handleScroll = () => {
  scrolled.value = window.scrollY > 10
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
@use '@/style/variables' as *;

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: $z-sticky;
  background-color: $color-overlay-darker;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid $color-border;
  transition: background-color $transition-base, backdrop-filter $transition-base, box-shadow $transition-base;
  will-change: background-color, backdrop-filter;

  &[data-scrolled="true"] {
    background-color: rgba(2, 3, 26, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }



  &__inner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 70px;
  }

  &__brand {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $space-8;
  }

  &__logo {
    display: flex;
    align-items: center;
  }

  &__logo-image {
    display: block;
    height: 60px;
    width: auto;
    object-fit: contain;
  }

  &__nav {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: $space-4;

    @media (max-width: 1100px) {
      gap: $space-2;
    }

    @media (max-width: 900px) {
      gap: $space-1;
    }

  }

  &__nav-list {
    display: flex;
    gap: $space-3;
  }

  &__nav-link {
    position: relative;
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $color-text-secondary;
    transition: color $transition-fast;

    &::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background: $gradient-btn-primary;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform $transition-base;
    }

    &:hover {
      color: $color-text;

      &::after {
        transform: scaleX(1);
      }
    }

    &.active::after {
      transform: scaleX(1);
      animation: indicatorGrow $transition-base ease-out;
    }
  }

  &__login-btn {
    padding: $space-2 $space-5;
    font-size: $text-sm;
    font-weight: $weight-semibold;
    color: $color-text;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-full;
    transition: all $transition-base;

    &:hover {
      background: $color-surface-hover;
      border-color: $color-primary;
    }
  }

  &__menu-toggle {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: $space-1;
    background: none;
    border: none;
  }

  &__menu-bar {
    display: block;
    width: 20px;
    height: 2px;
    background: $color-text;
    border-radius: $radius-full;
    transition: transform $transition-base, opacity $transition-base;
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba($color-background, 0.35);
    z-index: $z-sticky;
  }

  &__drawer {
    position: fixed;
    top: 70px;
    left: 0;
    width: min(max(250px, 250px + (100vw - 320px) * 0.4167), 84vw, 320px);
    display: flex;
    flex-direction: column;
    gap: $space-6;
    padding: $space-8 $space-6;
    background: $color-surface;
    border-right: 1px solid $color-border;
    box-shadow: 8px 0 24px rgba(0, 0, 0, 0.3);
    transform: translateX(-100%);
    pointer-events: none;
    transition: transform $transition-base;
    z-index: $z-sticky + 1;

    &__drawer-list {
      display: flex;
      flex-direction: column;
      gap: $space-4;
      flex: 1;
      min-height: 0;

      & > .header__drawer-item + .header__drawer-item {
        border-top: 1px solid $color-border;
        margin-top: $space-4;
        padding-top: $space-4;
      }
    }

    &__drawer-link {
      display: flex;
      align-items: center;
      width: 100%;
      padding: $space-4 $space-6;
      gap: $space-4;
      font-size: $text-sm;
      font-weight: $weight-medium;
      color: $color-text-secondary;
      transition: all $transition-fast;
      border-radius: $radius-sm;

      .drawer-item-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
      }

      &:hover {
        color: $color-text;
        background: rgba($color-primary, 0.05);
      }

      &:focus-visible {
        outline: 2px solid $color-primary;
        outline-offset: 2px;
      }

      &[aria-current="page"] {
        color: $color-primary;
        font-weight: $weight-semibold;
        background: rgba($color-primary, 0.1);

        .drawer-item-icon {
          /* Icon color will inherit */
        }
      }
    }

    &__drawer-item--premium {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

  
    @media (max-width: 399px) {
      top: 56px;
      width: min(180px, 84vw);
      padding: $space-6 $space-4;

      &__drawer-link {
        padding: $space-3 $space-4;
        gap: $space-3;

        .drawer-item-icon {
          width: 18px;
          height: 18px;
        }
      }

      &__drawer-list {
        gap: $space-3;

        & > .header__drawer-item + .header__drawer-item {
          margin-top: $space-3;
          padding-top: $space-3;
        }
      }

      &__login-btn {
        padding: $space-2 $space-4;
      }
    }

    &--open {
      transform: translateX(0);
      pointer-events: all;
    }
  }

  &__drawer-list {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    flex: 1;
    min-height: 0;

    & > .header__drawer-item + .header__drawer-item {
      border-top: 1px solid $color-border;
      margin-top: $space-4;
      padding-top: $space-4;
    }
  }

  &__drawer-link {
    display: flex;
    align-items: center;
    width: 100%;
    padding: $space-4 $space-6;
    gap: $space-4;
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $color-text-secondary;
    transition: all $transition-fast;
    border-radius: $radius-sm;

    .drawer-item-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    &:hover {
      color: $color-text;
      background: rgba($color-primary, 0.05);
    }

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: 2px;
    }

    &[aria-current="page"] {
      color: $color-primary;
      font-weight: $weight-semibold;
      background: rgba($color-primary, 0.1);

      .drawer-item-icon {
        /* Icon color will inherit from text color */
      }
    }
  }

  &__lang-switcher {
    position: relative;
    z-index: $z-dropdown;
  }

  &__lang-btn {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-4;
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $color-text;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    cursor: pointer;
    transition: all $transition-fast;

    &::after {
      content: '';
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 4px solid currentColor;
    }

    &:hover {
      border-color: $color-primary;
    }
  }

  @media (max-width: 359px) {
    &__inner {
      gap: $space-2;
      height: 56px;
    }

    &__brand {
      gap: $space-2;
      flex-shrink: 1;
      min-width: 0;
    }

    &__logo-image {
      height: 48px;
    }

    &__actions {
      gap: $space-2;
    }

    &__lang-btn {
      padding: $space-2 $space-3;
      font-size: $text-xs;
      white-space: nowrap;
      overflow-wrap: anywhere;
    }

    &__lang-dropdown {
      min-width: 0;
    }
  }

  @media (min-width: 360px) and (max-width: 374px) {
    &__inner {
      gap: $space-2;
      height: 56px;
    }

    &__brand {
      gap: $space-2;
    }

    &__logo-image {
      height: 48px;
    }

    &__actions {
      gap: $space-2;
    }

    &__lang-btn {
      padding: $space-2 $space-3;
      font-size: $text-xs;
      white-space: nowrap;
      overflow-wrap: anywhere;
    }

    &__drawer {
      width: min(180px, 84vw);
    }
  }

  &__lang-dropdown {
    position: absolute;
    top: calc(100% + #{$space-2});
    right: 0;
    min-width: 160px;
    padding: $space-2;
    list-style: none;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: $z-dropdown;

    li {
      button {
        width: 100%;
        padding: $space-2 $space-4;
        font-size: $text-sm;
        color: $color-text;
        text-align: left;
        background: none;
        border: none;
        border-radius: $radius-sm;
        cursor: pointer;
        transition: background $transition-fast;
        white-space: nowrap;

        &:hover {
          background: rgba($color-primary, 0.1);
        }
      }
    }
  }

&__premium-badge {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $text-sm;
  font-weight: $weight-medium;

  .badge {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    padding: $space-1 $space-2;
    background: transparent;
    color: $color-text;
    border-radius: $radius-sm;
    font-size: $text-sm;
    font-weight: $weight-medium;
    white-space: nowrap;
  }
}

  @media (max-width: 359px) {
    &__brand {
      gap: $space-2;
    }

    &__logo-image {
      height: 48px;
    }

    &__actions {
      gap: $space-3;
    }

    &__lang-btn {
      padding: $space-2 $space-3;
    }
  }
}
</style>
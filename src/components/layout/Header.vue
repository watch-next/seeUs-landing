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
          <img class="header__logo-image" src="@/images/logo/favicon.ico" alt="SeeUs" />
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
          <li v-for="link in drawerNavigation" :key="link.href" class="header__drawer-item">
            <router-link v-if="!link.isRoute" :to="{ path: '/', hash: link.href }" class="header__drawer-link"
              @click="handleNavClick(link)">{{ link.label }}</router-link>
            <router-link v-else :to="link.href" class="header__drawer-link" @click="handleNavClick(link)">{{ link.label
            }}</router-link>
          </li>
        </ul>
        <button class="header__login-btn" @click="handleLoginClick">{{ t('navigation.login') }}</button>
      </aside>

      <div v-if="menuOpen" class="header__overlay" @click="closeMenu"></div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { trackEvent, trackNavigation, trackLanguageChange } from '@/services/analytics'

const { t, locale } = useI18n()

const menuOpen = ref(false)
const scrolled = ref(false)
const showLangMenu = ref(false)

const headerNavigation = [
  { label: t('navigation.home'), href: '#hero' },
  { label: t('navigation.blog'), href: '/blog', isRoute: true },
  { label: t('navigation.about'), href: '/about', isRoute: true },
]

const drawerNavigation = [
  { label: t('navigation.platforms'), href: '#platforms', isRoute: false },
  { label: t('navigation.premium'), href: '#premium', isRoute: false },
  { label: t('navigation.roadmap'), href: '#roadmap', isRoute: false },
]

const languages = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'es', label: 'Español' },
]

const currentLang = ref(locale.value)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function handleNavClick(link: { label: string; href: string }) {
  trackEvent(trackNavigation(link.label, 'header'))
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

onMounted(() => {
  const savedLang = localStorage.getItem('watchnext-locale')
  if (savedLang && ['en', 'pt-BR', 'es'].includes(savedLang)) {
    locale.value = savedLang
    currentLang.value = savedLang
  }
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
    height: 64px;
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
    height: 72px;
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
    gap: 5px;
    padding: $space-2;
    background: none;
    border: none;
  }

  &__menu-bar {
    display: block;
    width: 24px;
    height: 2px;
    background: $color-text;
    border-radius: $radius-full;
    transition: transform $transition-base, opacity $transition-base;
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba($color-background, 0.5);
    z-index: $z-sticky;
  }

  &__drawer {
    position: fixed;
    top: 64px;
    left: 0;
    bottom: 0;
    width: min(280px, 84vw);
    display: flex;
    flex-direction: column;
    gap: $space-6;
    padding: $space-8;
    background: $color-surface;
    border-right: 1px solid $color-border;
    box-shadow: 8px 0 24px rgba(0, 0, 0, 0.3);
    transform: translateX(-100%);
    pointer-events: none;
    transition: transform $transition-base;
    z-index: $z-sticky + 1;

    &--open {
      transform: translateX(0);
      pointer-events: all;
    }
  }

  &__drawer-list {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__drawer-link {
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $color-text-secondary;
    transition: color $transition-fast;

    &:hover {
      color: $color-text;
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
    }
  }

  @media (max-width: 359px) {
    &__brand {
      gap: $space-2;
    }

    &__logo-image {
      height: 40px;
    }

    &__actions {
      gap: $space-2;
    }

    &__lang-btn {
      padding: $space-2;
    }

    &__lang-dropdown {
      min-width: 0;
    }
  }

  @media (max-width: 359px) {
    &__inner {
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
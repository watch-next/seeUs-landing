<template>
  <div id="app" :class="{ 'app--drawer-open': isDrawerOpen }">
    <Header @drawer-open="onDrawerOpen" />
    <main>
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'

const isDrawerOpen = ref(false)

function onDrawerOpen(isOpen) {
  isDrawerOpen.value = isOpen
}
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: transform $transition-base;
}

#app.app--drawer-open {
  transform: translateX(60px);
}

main {
  flex: 1;
}
</style>
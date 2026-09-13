<template>
  <div id="app">
    <Header />
    <main>
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: transform $transition-base;
}

#app.main--drawer-open {
  transform: translateX(60px);
}

main {
  flex: 1;
  transition: transform $transition-base;
}

@media (prefers-reduced-motion: reduce) {
  #app,
  #app.main--drawer-open,
  main {
    transition: none;
  }
}
</style>
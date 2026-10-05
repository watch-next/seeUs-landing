<template>
  <div class="home-page">
    <HeroSection />
    <AdsterraBanner />
    <FeaturesSection />
    <AdsterraNative class="home-page__adsterra-native" />
    <PlatformsSection />
    <PremiumSection />
    <RoadmapSection />
    <NewsletterSection />
    <FaqSection />
  </div>
</template>

<script setup lang="ts">
import HeroSection from '@/sections/HeroSection.vue'
import FaqSection from '@/sections/FaqSection.vue'
import FeaturesSection from '@/sections/FeaturesSection.vue'
import PlatformsSection from '@/sections/PlatformsSection.vue'
import PremiumSection from '@/sections/PremiumSection.vue'
import RoadmapSection from '@/sections/RoadmapSection.vue'
import NewsletterSection from '@/sections/NewsletterSection.vue'
import AdsterraNative from '@/components/ads/AdsterraNative.vue'
import AdsterraBanner from './components/ads/AdsterraBanner.vue'
</script>
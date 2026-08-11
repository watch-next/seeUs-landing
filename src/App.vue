<template>
  <div class="home-page">
    <HeroSection />
    <FeaturesSection />
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
</script>
<template>
  <div class="skeleton-comment" aria-hidden="true">
    <div class="skeleton-comment__avatar" />
    <div class="skeleton-comment__body">
      <div class="skeleton-comment__line skeleton-comment__line--short" />
      <div class="skeleton-comment__line skeleton-comment__line--medium" />
      <div class="skeleton-comment__line skeleton-comment__line--long" />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.skeleton-comment {
  display: flex;
  gap: $space-3;
  padding: $space-4 0;
  opacity: 0.6;

  .avatar-skeleton {
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: linear-gradient(
      90deg,
      $color-surface 25%,
      $color-surface-light 50%,
      $color-surface 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    flex: 1;
  }

  &__line {
    height: 12px;
    border-radius: $radius-sm;
    background: linear-gradient(
      90deg,
      $color-surface 25%,
      $color-surface-light 50%,
      $color-surface 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;

    &--short {
      width: 30%;
    }

    &--medium {
      width: 60%;
    }

    &--long {
      width: 100%;
    }
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
</style>
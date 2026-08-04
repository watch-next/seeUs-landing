<template>
  <BottomDialog
    v-model="visible"
    title="Report Comment"
    @close="reset"
  >
    <form class="report-form" @submit.prevent="submitReport">
      <p class="report-form__intro">Why are you reporting this comment?</p>
      <fieldset class="report-form__options">
        <label
          v-for="option in categoryOptions"
          :key="option.value"
          class="report-form__option"
        >
          <input
            type="radio"
            name="report-category"
            :value="option.value"
            v-model="selectedCategory"
            class="report-form__radio"
          />
          <span class="report-form__label">{{ option.label }}</span>
        </label>
      </fieldset>
      <div class="report-form__actions">
        <button type="button" class="btn btn-ghost btn-sm" @click="visible = false">Cancel</button>
        <button
          type="submit"
          class="btn btn-error btn-sm"
          :disabled="!selectedCategory || submitting"
        >
          {{ submitting ? 'Reporting…' : 'Submit Report' }}
        </button>
      </div>
      <p v-if="success" class="report-form__success" role="status">Report submitted. Thank you.</p>
    </form>
  </BottomDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ReportCategory } from '@/types/comments'
import BottomDialog from '@/components/BottomDialog.vue'

const props = defineProps<{
  modelValue: boolean
  commentId: string
  submitting?: boolean
  success?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  report: [payload: { commentId: string; category: ReportCategory }]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    if (!value) reset()
  },
})

const selectedCategory = ref<ReportCategory | null>(null)

const categoryOptions: { label: string; value: ReportCategory }[] = [
  { label: 'Spam', value: 'spam' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Offensive Language', value: 'offensive_language' },
  { label: 'Other', value: 'other' },
]

function submitReport() {
  if (!selectedCategory.value) return
  emit('report', { commentId: props.commentId, category: selectedCategory.value })
}

function reset() {
  selectedCategory.value = null
}
</script>

<style lang="scss" scoped>
.report-form {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__intro {
    color: $color-text;
    font-size: $text-sm;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    border: none;
    padding: 0;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-3;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    cursor: pointer;
    transition: border-color $transition-fast;

    &:hover {
      border-color: $color-primary;
    }
  }

  &__radio {
    accent-color: $color-primary;
  }

  &__label {
    font-size: $text-sm;
    color: $color-text;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $space-3;
  }

  &__success {
    color: $color-success;
    font-size: $text-sm;
  }
}
</style>

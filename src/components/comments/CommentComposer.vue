<template>
  <form class="composer" @submit.prevent="onSubmit">
    <textarea
      ref="textareaRef"
      v-model="content"
      class="composer__textarea textarea"
      :placeholder="placeholder"
      :disabled="submitting"
      rows="3"
      @input="onInput"
      @keydown="onKeydown"
    />

    <MentionAutocomplete
      v-if="autocomplete.active"
      :candidates="autocomplete.candidates"
      :active-index="autocomplete.activeIndex"
      @select="applyMention"
    />

    <div class="composer__actions">
      <button
        type="submit"
        class="btn btn-primary btn-sm"
        :disabled="content.trim().length === 0 || submitting"
      >
        {{ submitting ? 'Posting…' : submitLabel }}
      </button>
      <button
        v-if="canCancel"
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="submitting"
        @click="reset"
      >
        Cancel
      </button>
      <span class="composer__hint">Press Enter to post · @ to mention · Shift+Enter for newline</span>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { searchCommenters } from '@/services/comments/mentions.service'
import type { CommenterSearchRow, CommentMentionDraft } from '@/types/comments'
import MentionAutocomplete from './MentionAutocomplete.vue'

const props = withDefaults(
  defineProps<{
    postSlug: string
    displayName?: string
    submitting?: boolean
    placeholder?: string
    submitLabel?: string
    canCancel?: boolean
    initialValue?: string
  }>(),
  {
    displayName: '',
    submitting: false,
    placeholder: 'Write a comment...',
    submitLabel: 'Post',
    canCancel: false,
    initialValue: '',
  },
)

const emit = defineEmits<{
  submit: [payload: { content: string; mentions: CommentMentionDraft[] }]
  cancel: []
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const content = ref(props.initialValue)

interface AutocompleteState {
  active: boolean
  candidates: CommenterSearchRow[]
  activeIndex: number
  queryStart: number
}

const autocomplete = reactive<AutocompleteState>({
  active: false,
  candidates: [],
  activeIndex: 0,
  queryStart: 0,
})

let debounceId: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (debounceId) clearTimeout(debounceId)
  debounceId = setTimeout(tryMention, 80)
}

function tryMention() {
  if (!textareaRef.value) return
  const el = textareaRef.value
  const caret = el.selectionStart ?? content.value.length
  const before = content.value.slice(0, caret)
  const match = /@([\w .-]*)$/.exec(before)
  if (!match) {
    autocomplete.active = false
    return
  }
  autocomplete.queryStart = match.index
  autocomplete.active = true
  autocomplete.activeIndex = 0
  void runSearch(match[1])
}

async function runSearch(query: string) {
  try {
    autocomplete.candidates = await searchCommenters(props.postSlug, query)
    autocomplete.activeIndex = 0
    if (autocomplete.candidates.length === 0) autocomplete.active = false
  } catch {
    autocomplete.active = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!autocomplete.active || autocomplete.candidates.length === 0) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSubmit()
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    autocomplete.activeIndex = (autocomplete.activeIndex + 1) % autocomplete.candidates.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    const len = autocomplete.candidates.length
    autocomplete.activeIndex = (autocomplete.activeIndex - 1 + len) % len
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault()
    applyMention(autocomplete.candidates[autocomplete.activeIndex])
  } else if (e.key === 'Escape') {
    autocomplete.active = false
  }
}

function applyMention(candidate: CommenterSearchRow) {
  if (!textareaRef.value) return
  const el = textareaRef.value
  const before = content.value.slice(0, autocomplete.queryStart)
  const caret = el.selectionStart ?? content.value.length
  const after = content.value.slice(caret)
  const mentionText = `@${candidate.display_name} `
  content.value = before + mentionText + after
  const newCaret = before.length + mentionText.length
  autocomplete.active = false
  autocomplete.candidates = []
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(newCaret, newCaret)
  })
}

function extractMentions(): CommentMentionDraft[] {
  const re = /@([\w][\w$.-]*[\w.])/g
  const out: CommentMentionDraft[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(content.value)) !== null) {
    out.push({
      mentionedUserId: null,
      mentionedDisplayName: m[1],
      startIndex: m.index,
      endIndex: m.index + m[0].length,
    })
  }
  return out
}

async function onSubmit() {
  if (content.value.trim().length === 0 || props.submitting) return
  emit('submit', { content: content.value, mentions: extractMentions() })
}

function reset() {
  content.value = ''
  autocomplete.active = false
  autocomplete.candidates = []
  emit('cancel')
}

defineExpose({ reset })
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.composer {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  position: relative;

  &__textarea {
    min-height: 96px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $space-3;
    flex-wrap: wrap;
  }

  &__hint {
    color: $color-text-muted;
    font-size: $text-xs;
    margin-left: auto;
  }
}
</style>
<template>
  <Teleport to="body">
    <div
      v-if="card"
      class="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50"
      @click="handleCancel"
      @keydown="blockKeyboard"
    >
      <div
        class="bg-gray-800 rounded-lg w-full max-w-2xl px-6 py-5"
        @click.stop
      >
        <!-- Status -->
        <div class="text-sm font-semibold tracking-wide text-gray-300 mb-3">{{ columnTitle }}</div>

        <!-- Editor with autocomplete -->
        <div class="relative">
          <textarea
            ref="textareaRef"
            v-model="tempContent"
            class="w-full bg-gray-700 text-white rounded p-3 pr-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-600 custom-scrollbar"
            rows="12"
            @keydown="handleKeyDown"
            @input="handleInput"
            @click="closeAutocomplete"
          />

          <!-- Tag autocomplete dropdown -->
          <div
            v-if="acActive && acFilteredTags.length > 0"
            ref="dropdownRef"
            class="absolute left-0 bottom-0 translate-y-full z-10 bg-gray-700 border border-gray-600 rounded shadow-lg max-h-40 overflow-y-auto w-48"
          >
            <div
              v-for="(tag, index) in acFilteredTags"
              :key="tag"
              :data-ac-index="index"
              class="px-3 py-1.5 text-sm cursor-pointer"
              :class="index === acSelectedIndex ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'"
              @mousedown.prevent="insertCompletion(tag)"
            >
              {{ tag }}
            </div>
          </div>
        </div>

        <!-- Tags + Save -->
        <div class="flex items-center mt-3">
          <div class="flex flex-wrap gap-1 flex-1">
            <span
              v-for="tag in tags"
              :key="tag"
              class="text-xs px-2 py-1 rounded text-gray-300"
              :style="{ background: getTagColor(tag) }"
            >
              {{ tag }}
            </span>
          </div>
          <button
            class="ml-4 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
            @click="handleSave"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { extractTags, getTagColor } from '../utils';
import type { Card } from '../types';

interface Props {
  card: Card | null;
  columnTitle: string;
  allTags: string[];
}

interface Emits {
  (e: 'save', cardId: string, content: string): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const tempContent = ref('');

const tags = computed(() => extractTags(tempContent.value));

// Autocomplete state
const acActive = ref(false);
const acHashPos = ref(-1);
const acSelectedIndex = ref(0);
const acPrefix = ref('');

const acFilteredTags = computed(() => {
  if (!acActive.value) return [];
  const prefix = acPrefix.value.toLowerCase();
  if (prefix === '') {
    return props.allTags.slice(0, 5);
  }
  return props.allTags.filter(tag =>
    tag.slice(1).toLowerCase().startsWith(prefix)
  );
});

const closeAutocomplete = () => {
  acActive.value = false;
  acHashPos.value = -1;
  acSelectedIndex.value = 0;
  acPrefix.value = '';
};

const insertCompletion = (tag: string) => {
  if (!textareaRef.value) return;
  const cursor = textareaRef.value.selectionStart;
  const before = tempContent.value.substring(0, acHashPos.value);
  const after = tempContent.value.substring(cursor);
  tempContent.value = before + tag + after;
  closeAutocomplete();
  nextTick(() => {
    const newPos = before.length + tag.length;
    textareaRef.value?.setSelectionRange(newPos, newPos);
    textareaRef.value?.focus();
  });
};

const scrollSelectedIntoView = () => {
  nextTick(() => {
    const el = dropdownRef.value?.querySelector(`[data-ac-index="${acSelectedIndex.value}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  });
};

const handleInput = () => {
  if (!textareaRef.value) return;
  const cursor = textareaRef.value.selectionStart;

  if (acActive.value) {
    // Check hash still exists
    if (tempContent.value[acHashPos.value] !== '#') {
      closeAutocomplete();
      return;
    }
    // Check cursor is after hash
    if (cursor <= acHashPos.value) {
      closeAutocomplete();
      return;
    }
    const prefix = tempContent.value.substring(acHashPos.value + 1, cursor);
    // Close if non-word character (space, punctuation, etc.)
    if (/[^\w]/.test(prefix)) {
      closeAutocomplete();
      return;
    }
    acPrefix.value = prefix;
    acSelectedIndex.value = 0;
    return;
  }

  // Detect new # typed
  if (cursor > 0 && tempContent.value[cursor - 1] === '#') {
    const charBefore = cursor > 1 ? tempContent.value[cursor - 2] : null;
    if (charBefore === null || /[\s]/.test(charBefore)) {
      acHashPos.value = cursor - 1;
      acActive.value = true;
      acSelectedIndex.value = 0;
      acPrefix.value = '';
    }
  }
};

watch(() => props.card, async (card) => {
  closeAutocomplete();
  if (card) {
    tempContent.value = card.content;
    await nextTick();
    textareaRef.value?.focus();
    const len = textareaRef.value?.value.length ?? 0;
    textareaRef.value?.setSelectionRange(len, len);
  }
});

const handleKeyDown = (e: KeyboardEvent) => {
  e.stopPropagation();

  // Autocomplete key handling
  if (acActive.value && acFilteredTags.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      acSelectedIndex.value = (acSelectedIndex.value + 1) % acFilteredTags.value.length;
      scrollSelectedIntoView();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      acSelectedIndex.value = (acSelectedIndex.value - 1 + acFilteredTags.value.length) % acFilteredTags.value.length;
      scrollSelectedIntoView();
      return;
    }
    if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      insertCompletion(acFilteredTags.value[acSelectedIndex.value]);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeAutocomplete();
      return;
    }
    // Space and other keys fall through to normal handling
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSave();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    handleCancel();
  }
};

const blockKeyboard = (e: KeyboardEvent) => {
  e.stopPropagation();
  if (e.key === 'Escape') {
    handleCancel();
  }
};

const handleSave = () => {
  if (props.card) {
    emit('save', props.card.id, tempContent.value);
  }
};

const handleCancel = () => {
  emit('close');
};
</script>

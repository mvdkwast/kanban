<template>
  <div class="relative w-full max-w-xs">
    <input
      ref="inputRef"
      v-model="localSearchText"
      type="text"
      placeholder="Search cards..."
      class="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
      style="min-width: 200px"
      @keydown="handleKeyDown"
    />
    <button
      v-if="localSearchText"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-lg"
      style="background: none; border: none; padding: 0; cursor: pointer"
      @click="clearSearch"
      tabindex="0"
      aria-label="Clear search"
      type="button"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { emitter } from '../services/events';
import { useKeyboardManager } from '../services/KeyboardManager';
import { createSearchKeyboardHandler } from '../services/SearchKeyboardHandler';

const inputRef = ref<HTMLInputElement>();
const localSearchText = ref<string>("");
let savedSearchText = "";

watch(localSearchText, (newValue) => {
  emitter.emit('filter:search', newValue);
});

emitter.on('mode:enter', (mode) => {
  if (mode === 'search') {
    savedSearchText = localSearchText.value;
    focusSearch();
  }
});

emitter.on('filter:reset', () => {
  localSearchText.value = "";
});

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    exitSearchMode();
    // Emit navigation mode to trigger smart focus
    emitter.emit('mode:enter', 'navigation');
  } else if (e.key === 'Escape') {
    localSearchText.value = savedSearchText;
    exitSearchMode();
  }
  // Don't stop propagation - let KeyboardManager handle it
};

const exitSearchMode = () => {
  emitter.emit('mode:exit', 'search');
  inputRef.value?.blur();
};

const clearSearch = () => {
  localSearchText.value = "";
  inputRef.value?.focus();
};

// Function to focus the search input
const focusSearch = () => {
  inputRef.value?.focus();
  inputRef.value?.select();
};

defineExpose({
  focusSearch
});

onMounted(() => {
  const keyboardManager = useKeyboardManager();
  keyboardManager.registerModeHandler('search', createSearchKeyboardHandler(handleKeyDown));
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showHelp"
      class="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50"
      @click="$emit('close')"
      @keydown.esc="$emit('close')"
      tabindex="0"
      ref="modalRef"
    >
      <div
        class="bg-gray-700 text-gray-400 rounded-lg max-w-4xl w-full relative"
        @click.stop
      >
        <!-- Close button -->
        <button
          @click="$emit('close')"
          class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
          title="Close help (Esc)"
        >
          ×
        </button>

        <div class="p-6">
          <h1 class="text-2xl font-bold mb-6 text-center">Keyboard Shortcuts</h1>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Navigation -->
            <div>
              <h2 class="text-lg font-semibold mb-3 text-blue-400">Navigation</h2>
              <ul class="space-y-2 text-sm">
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">↑↓</kbd> Navigate cards vertically</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">←→</kbd> Navigate cards horizontally</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Home</kbd> First card in column</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">End</kbd> Last card in column</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">/</kbd> Focus search</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">#</kbd> Focus tags / Start tag typing</li>
              </ul>
            </div>

            <!-- Card Actions -->
            <div>
              <h2 class="text-lg font-semibold mb-3 text-green-400">Card Actions</h2>
              <ul class="space-y-2 text-sm">
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Enter</kbd> Edit focused card</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Space</kbd> Edit focused card</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">F2</kbd> Edit focused card</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Insert</kbd> Insert card above</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Delete</kbd> Delete focused card</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+Enter</kbd> Complete card (move to next column)</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Double Click</kbd> Edit card / Add card to column</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Alt+Click</kbd> Delete card</li>
              </ul>
            </div>

            <!-- Moving Cards -->
            <div>
              <h2 class="text-lg font-semibold mb-3 text-yellow-400">Moving Cards</h2>
              <ul class="space-y-2 text-sm">
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+↑</kbd> Move card up in column</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+↓</kbd> Move card down in column</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+←</kbd> Move card to left column</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+→</kbd> Move card to right column</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+Home</kbd> Move card to top of column</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+End</kbd> Move card to bottom of column</li>
              </ul>
            </div>

            <!-- Board Management -->
            <div>
              <h2 class="text-lg font-semibold mb-3 text-purple-400">Board Management</h2>
              <ul class="space-y-2 text-sm">
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+B</kbd> Create new board</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Alt+T</kbd> Focus board title</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+[</kbd> Previous board</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+]</kbd> Next board</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+E</kbd> Export current board</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+I</kbd> Import board</li>
              </ul>
            </div>

            <!-- Filtering & Tags -->
            <div>
              <h2 class="text-lg font-semibold mb-3 text-orange-400">Filtering & Tags</h2>
              <ul class="space-y-2 text-sm">
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">#bug</kbd> Type to filter by tag</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">←→</kbd> Navigate matching tags</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Space</kbd> Toggle tag (manual mode)</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Shift+Space</kbd> Multi-select tag</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Shift+Click</kbd> Multi-select tag</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Enter</kbd> Apply filter & focus first card</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+K</kbd> Clear all filters</li>
              </ul>
            </div>

            <!-- General -->
            <div>
              <h2 class="text-lg font-semibold mb-3 text-gray-400">General</h2>
              <ul class="space-y-2 text-sm">
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+H</kbd> Toggle this help</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Esc</kbd> Cancel edit / Exit typing / Close help</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Enter</kbd> Save card (when editing)</li>
                <li><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Backspace</kbd> Delete character (tag typing)</li>
              </ul>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-gray-600 text-center text-sm text-gray-400">
            <p>Drag and drop cards between columns • Use # for tags in card content • Type after # to filter tags quickly</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  showHelp: boolean;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalRef = ref<HTMLElement | null>(null);

// Focus the modal when it becomes visible
watch(() => props.showHelp, (visible) => {
  if (visible) {
    setTimeout(() => {
      modalRef.value?.focus();
    }, 50);
  }
});
</script>

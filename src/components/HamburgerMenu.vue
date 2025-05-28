<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="p-2 hover:bg-gray-700 rounded transition-colors"
      title="Menu"
    >
      <GlHamburger class="h-6 w-6"/>
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[200px]"
    >
      <div
        class="flex items-center justify-between px-3 py-2 hover:bg-gray-700 cursor-pointer rounded-t-lg"
        @click="handleImport"
      >
        <span class="flex-1 text-sm font-medium">Import</span>
        <kbd class="text-xs bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+I</kbd>
      </div>
      <div
        class="flex items-center justify-between px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700"
        @click="handleExport"
      >
        <span class="flex-1 text-sm font-medium">Export</span>
        <kbd class="text-xs bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+E</kbd>
      </div>
      <div
        class="flex items-center justify-between px-3 py-2 hover:bg-gray-700 cursor-pointer rounded-b-lg"
        @click="handleHelp"
      >
        <span class="flex-1 text-sm font-medium">Help</span>
        <kbd class="text-xs bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+H</kbd>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { GlHamburger } from '@kalimahapps/vue-icons';

interface Emits {
  (e: 'import'): void;
  (e: 'export'): void;
  (e: 'help'): void;
}

const emit = defineEmits<Emits>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLDivElement>();

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

const handleImport = () => {
  emit('import');
  isOpen.value = false;
};

const handleExport = () => {
  emit('export');
  isOpen.value = false;
};

const handleHelp = () => {
  emit('help');
  isOpen.value = false;
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>
<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="ml-1 px-2 py-1 text-gray-400 hover:text-white transition-colors text-sm"
      title="Switch board (Ctrl+[ / Ctrl+])"
    >
      ▼
    </button>
    
    <div
      v-if="isOpen"
      class="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[250px]"
    >
      <div
        class="flex items-center justify-between px-3 py-2 hover:bg-gray-700 cursor-pointer rounded-t-lg border-b border-gray-700"
        @click="handleNewBoard"
      >
        <span class="flex-1 text-sm font-medium">+ New Board</span>
        <kbd class="text-xs bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+B</kbd>
      </div>
      <div
        v-for="board in boards"
        :key="board.id"
        class="flex items-center justify-between px-3 py-2 hover:bg-gray-700 cursor-pointer last:rounded-b-lg"
        :class="{ 'bg-gray-700': board.id === currentBoardId }"
        @click="selectBoard(board.id)"
      >
        <span class="truncate flex-1 text-sm">
          {{ board.title }}
        </span>
        <button
          v-if="board.id !== currentBoardId"
          @click.stop="handleDeleteBoard(board.id)"
          class="ml-2 text-gray-500 hover:text-red-400 transition-colors text-xs px-1"
          title="Delete board"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { BoardData } from '../types';

interface Props {
  boards: BoardData[];
  currentBoardId: string;
}

interface Emits {
  (e: 'selectBoard', boardId: string): void;
  (e: 'deleteBoard', boardId: string): void;
  (e: 'newBoard'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLDivElement>();

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

const selectBoard = (boardId: string) => {
  emit('selectBoard', boardId);
  isOpen.value = false;
};

const handleDeleteBoard = (boardId: string) => {
  if (confirm('Are you sure you want to delete this board?')) {
    emit('deleteBoard', boardId);
    isOpen.value = false;
  }
};

const handleNewBoard = () => {
  emit('newBoard');
  isOpen.value = false;
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<template>
  <div
      ref="columnRef"
      class="rounded-lg p-4 min-h-[400px] transition-all duration-200"
      :class="[
        getColumnClasses(),
        isColumnDragOver && !isLast ? 'ring-2 ring-blue-500' : ''
      ]"
      @dblclick="handleDoubleClick"
      @dragover="handleColumnDragOver"
      @drop="handleColumnDrop"
      @dragenter="handleColumnDragEnter"
      @dragleave="handleColumnDragLeave"
  >
    <div
        class="flex items-center justify-between mb-4"
        @dragover="handleHeaderDragOver"
        @drop="handleHeaderDrop"
        @dragenter="handleHeaderDragEnter"
        @dragleave="handleHeaderDragLeave"
    >
      <h3 class="text-lg font-semibold text-gray-100 capitalize">{{ column.title }}</h3>
      <div class="flex">
        <!-- Clear button for done column -->
        <button
            v-if="column.id === 'done' && localCards.length > 0"
            @click="$emit('clearColumn', column.id)"
            class="text-gray-400 hover:text-white hover:bg-gray-600 text-sm px-2 py-1 rounded transition-colors"
            title="Clear done cards"
        >
          <FlBinRecycle class="h-5 w-5 mb-0"/>
        </button>
        <!-- Add button for non-delete columns -->
        <button
            v-if="!isLast && column.id !== 'done'"
            @click="$emit('addCard', column.id)"
            class="text-gray-400 hover:text-white hover:bg-gray-600 text-xl leading-none pb-1 px-2 py-1 rounded transition-colors"
            title="Add card"
        >
          +
        </button>
      </div>
    </div>

    <div class="column-content relative" :data-column-id="column.id">
      <div
          class="overflow-hidden transition-all duration-200 ease-out"
          :class="isHeaderDragOver && localCards.length > 0 ? 'h-3 mb-2' : 'h-0'"
      >
        <div class="relative h-3">
          <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-blue-500">
            <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
            <div class="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>
      <template v-for="card in localCards" :key="card.id">
        <div
            class="kanban-card"
            :data-card-id="card.id"
        >
          <KanbanCard
              :key="card.id"
              :card="card"
              :column-id="column.id"
              :is-focused="focusedCardId === card.id"
              @focus="handleFocusCard"
              @update="handleUpdateCard"
              @delete="handleDeleteCard"
              @report-position="handleReportPosition"
              @drop="handleCardDrop"
          />
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { FlBinRecycle } from '@kalimahapps/vue-icons';
import {computed, ref, onMounted, onUnmounted} from 'vue';
import type {Card, Column} from '../types';
import KanbanCard from './KanbanCard.vue';

interface Props {
  column: Column;
  cards: Card[];
  focusedCardId: string | null;
  isLast: boolean;
}

interface Emits {
  (e: 'addCard', columnId: string, beforeIndex?: number | null): void;

  (e: 'focusCard', cardId: string): void;

  (e: 'updateCard', cardId: string, content: string): void;

  (e: 'deleteCard', cardId: string): void;

  (e: 'dropCard', cardId: string, sourceColumnId: string, targetColumnId: string, targetCardId?: string | null): void;

  (e: 'clearColumn', columnId: string): void;

  (e: 'reportCardPosition', id: string, pos: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const columnRef = ref<HTMLDivElement>();
const isColumnDragOver = ref(false);
const isHeaderDragOver = ref(false);
const dragOverTimeout = ref<number | null>(null);

const localCards = computed(() => {
  // Cards are already filtered by column in parent component
  return props.cards;
});

// Event handlers to properly emit events
const handleFocusCard = (cardId: string) => {
  emit('focusCard', cardId);
};

const handleUpdateCard = (cardId: string, content: string) => {
  emit('updateCard', cardId, content);
};

const handleDeleteCard = (cardId: string) => {
  emit('deleteCard', cardId);
};

const handleReportPosition = (id: string, pos: any) => {
  emit('reportCardPosition', id, pos);
};

const handleDoubleClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('column-content')) {
    emit('addCard', props.column.id);
  }
};

const getColumnClasses = () => {
  if (props.isLast) {
    // Delete column
    const baseClasses = "w-[100px] flex-shrink-0 transition-colors duration-200";
    if (isColumnDragOver.value) {
      return `${baseClasses} bg-red-950`;
    }
    return `${baseClasses} bg-gray-950 hover:bg-red-950`;
  } else {
    // Regular column
    return "bg-gray-900 flex-1 min-w-[220px] basis-0";
  }
};

// Drag and drop handlers
const handleCardDrop = (draggedCardId: string, sourceColumnId: string, targetColumnId: string, targetCardId: string) => {
  emit('dropCard', draggedCardId, sourceColumnId, targetColumnId, targetCardId);
};

const handleColumnDragOver = (e: DragEvent) => {
  if (!e.dataTransfer) return;

  const draggedCardId = (window as any).__draggedCardId;
  if (!draggedCardId) return;

  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const handleColumnDragEnter = (e: DragEvent) => {
  const target = e.target as HTMLElement;
  const draggedCardId = (window as any).__draggedCardId;

  if (!draggedCardId) return;

  // For delete column, always show drag over state
  if (props.isLast) {
    isColumnDragOver.value = true;
    if (dragOverTimeout.value) {
      clearTimeout(dragOverTimeout.value);
      dragOverTimeout.value = null;
    }
    return;
  }

  // Only show column highlight if dragging over empty area (not cards or header)
  const isOnCard = target.closest('.kanban-card');
  const isOnHeader = !!target.closest('.flex.items-center.justify-between');

  if (!isOnCard && !isOnHeader) {
    isColumnDragOver.value = true;

    // Clear any existing timeout
    if (dragOverTimeout.value) {
      clearTimeout(dragOverTimeout.value);
      dragOverTimeout.value = null;
    }
  }
};

const handleColumnDragLeave = (e: DragEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement;

  // Set a timeout to prevent flicker when moving between elements
  if (dragOverTimeout.value) {
    clearTimeout(dragOverTimeout.value);
  }

  dragOverTimeout.value = window.setTimeout(() => {
    if (!columnRef.value?.contains(relatedTarget)) {
      isColumnDragOver.value = false;
    }
  }, 50);
};

const handleColumnDrop = (e: DragEvent) => {
  const draggedCardId = (window as any).__draggedCardId;
  const sourceColumnId = (window as any).__sourceColumnId;

  if (!draggedCardId) return;

  e.preventDefault();
  e.stopPropagation();

  // For delete column, always handle the drop
  if (props.isLast) {
    emit('dropCard', draggedCardId, sourceColumnId, props.column.id, null);
    isColumnDragOver.value = false;
    return;
  }

  const target = e.target as HTMLElement;

  // Check if we're dropping on a card or header (they handle their own drops)
  const isOnCard = target.closest('.kanban-card');
  const isOnHeader = !!target.closest('.flex.items-center.justify-between');

  if (!isOnCard && !isOnHeader) {
    emit('dropCard', draggedCardId, sourceColumnId, props.column.id, null);
  }

  isColumnDragOver.value = false;
};

// Header drag handlers
const handleHeaderDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (!e.dataTransfer) return;
  e.dataTransfer.dropEffect = 'move';
};

const handleHeaderDragEnter = (e: DragEvent) => {
  e.stopPropagation();
  const draggedCardId = (window as any).__draggedCardId;
  if (draggedCardId) {
    isHeaderDragOver.value = true;
  }
};

const handleHeaderDragLeave = (e: DragEvent) => {
  e.stopPropagation();
  isHeaderDragOver.value = false;
};

const handleHeaderDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const draggedCardId = (window as any).__draggedCardId;
  const sourceColumnId = (window as any).__sourceColumnId;

  if (draggedCardId) {
    // Get first card in column to insert before it
    const firstCard = localCards.value[0];
    emit('dropCard', draggedCardId, sourceColumnId, props.column.id, firstCard?.id || null);
  }

  isHeaderDragOver.value = false;
};

// Clean up drag states when drag ends
const handleDragEnded = () => {
  isColumnDragOver.value = false;
  isHeaderDragOver.value = false;
  if (dragOverTimeout.value) {
    clearTimeout(dragOverTimeout.value);
    dragOverTimeout.value = null;
  }
};

onMounted(() => {
  window.addEventListener('drag-ended', handleDragEnded);
});

onUnmounted(() => {
  window.removeEventListener('drag-ended', handleDragEnded);
});

</script>

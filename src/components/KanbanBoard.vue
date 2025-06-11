<template>
  <div class="flex gap-4 overflow-x-auto p-2">
    <KanbanColumn
        v-for="(column, i) in columns"
        :key="column.id"
        :column="column"
        :cards="getColumnCards(column.id)"
        :focused-card-id="focusedCardId"
        :selected-card-ids="selectedCardIds"
        :is-last="i === columns.length - 1"
        @add-card="handleAddCard"
        @focus-card="handleFocusCard"
        @update-card="handleUpdateCard"
        @delete-card="handleDeleteCard"
        @drop-card="handleDropCard"
        @clear-column="handleClearColumn"
        @report-card-position="handleReportCardPosition"
        @select-card="handleSelectCard"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick } from 'vue';
import type { Card, Column } from '../types';
import KanbanColumn from './KanbanColumn.vue';

interface Props {
  columns: Column[];
  visibleCards: Card[];
  focusedCardId: string | null;
  selectedCardIds?: string[];
}

interface Emits {
  (e: 'addCard', columnId: string, beforeIndex?: number | null): void;
  (e: 'focusCard', cardId: string): void;
  (e: 'updateCard', cardId: string, content: string): void;
  (e: 'deleteCard', cardId: string): void;
  (e: 'dropCard', cardId: string, sourceColumnId: string, targetColumnId: string, targetCardId?: string | null): void;
  (e: 'clearColumn', columnId: string): void;
  (e: 'reportCardPosition', id: string, pos: any): void;
  (e: 'selectCard', cardId: string, ctrlKey: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const getColumnCards = (columnId: string): Card[] => {
  return props.visibleCards.filter(card => card.columnId === columnId);
};

// Event handlers
const handleAddCard = (columnId: string, beforeIndex?: number | null) => {
  emit('addCard', columnId, beforeIndex);
};

const handleFocusCard = (cardId: string) => {
  emit('focusCard', cardId);
};

const handleUpdateCard = (cardId: string, content: string) => {
  emit('updateCard', cardId, content);
};

const handleDeleteCard = (cardId: string) => {
  emit('deleteCard', cardId);
};

const handleDropCard = (cardId: string, sourceColumnId: string, targetColumnId: string, targetCardId?: string | null) => {
  emit('dropCard', cardId, sourceColumnId, targetColumnId, targetCardId);
};

const handleClearColumn = (columnId: string) => {
  emit('clearColumn', columnId);
};

const handleReportCardPosition = (id: string, pos: any) => {
  emit('reportCardPosition', id, pos);
};

const handleSelectCard = (cardId: string, ctrlKey: boolean) => {
  emit('selectCard', cardId, ctrlKey);
};

// Watch for changes in visible cards and request position updates
watch(() => props.visibleCards.map(c => c.id).join(','), async () => {
  // Wait for DOM updates
  await nextTick();

  // Trigger a re-render to update positions
  setTimeout(() => {
    // Force position reporting by dispatching a custom event
    window.dispatchEvent(new CustomEvent('update-card-positions'));
  }, 100);
});
</script>

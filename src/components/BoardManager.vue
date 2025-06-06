<template>
  <div class="flex items-center">
    <input
      v-if="isEditingTitle"
      ref="titleInputRef"
      v-model="localTitle"
      type="text"
      class="text-2xl font-bold bg-gray-800 text-white rounded px-2 py-1 focus:outline-none"
      style="min-width: 150px"
      @blur="stopEditing"
      @keydown="handleTitleKeyDown"
    />
    <h1
      v-else
      class="text-2xl font-bold cursor-pointer hover:bg-gray-800 rounded px-2 py-1"
      title="Click to edit board title (Alt+T)"
      @click="startEditing"
    >
      {{ title }}
    </h1>

    <BoardSelector
      :boards="boards"
      :current-board-id="currentBoardId"
      @select-board="$emit('selectBoard', $event)"
      @delete-board="$emit('deleteBoard', $event)"
      @new-board="$emit('newBoard')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { BoardData } from '../types';
import BoardSelector from './BoardSelector.vue';

interface Props {
  title: string;
  boards: BoardData[];
  currentBoardId: string;
  hasMultipleBoards: boolean;
}

interface Emits {
  (e: 'update:title', title: string): void;
  (e: 'newBoard'): void;
  (e: 'selectBoard', boardId: string): void;
  (e: 'deleteBoard', boardId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEditingTitle = ref(false);
const titleInputRef = ref<HTMLInputElement>();
const localTitle = ref(props.title);

// Only watch for external title changes, don't create circular updates
watch(() => props.title, (newTitle) => {
  if (newTitle !== localTitle.value) {
    localTitle.value = newTitle;
  }
});

// Emit title changes but prevent circular updates
const updateTitle = (newTitle: string) => {
  if (newTitle !== props.title) {
    emit('update:title', newTitle);
  }
};

const startEditing = async () => {
  isEditingTitle.value = true;
  await nextTick();
  titleInputRef.value?.focus();
  titleInputRef.value?.select();
};

const stopEditing = () => {
  updateTitle(localTitle.value);
  isEditingTitle.value = false;
};

const handleTitleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    stopEditing();
  } else if (e.key === 'Escape') {
    localTitle.value = props.title;
    isEditingTitle.value = false;
  }
};

const focusTitle = () => {
  if (!isEditingTitle.value) {
    startEditing();
  }
};

defineExpose({
  focusTitle
});
</script>

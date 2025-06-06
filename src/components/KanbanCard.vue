<template>
  <div 
    class="relative mb-2"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  >
    <div
      class="overflow-hidden transition-all duration-200 ease-out"
      :class="isDragOver ? 'h-3 mb-2' : 'h-0'"
    >
      <div class="relative h-3">
        <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-blue-500">
          <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
          <div class="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
        </div>
      </div>
    </div>
    <div
      ref="cardRef"
      class="bg-gray-800 outline-none rounded-lg p-3 cursor-move transition-all duration-200 select-none"
      :class="[
        isFocused ? 'ring-2 ring-blue-500 focused-card' : '',
        isDragging ? 'opacity-50' : '',
      ]"
      :tabindex="isFocused ? 0 : -1"
      :draggable="!isEditing"
      :data-testid="`card-${card.id}`"
      :data-card-id="card.id"
      :data-focused="isFocused"
      :data-editing="isEditing"
      @click="handleCardClick"
      @dblclick="handleCardDoubleClick"
      @keydown="handleCardKeyDown"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
    >
    <textarea
      v-if="isEditing"
      ref="textareaRef"
      v-model="tempContent"
      class="w-full bg-transparent text-white p-0 resize-none focus:outline-none custom-scrollbar"
      rows="7"
      @blur="handleSave"
      @keydown="handleKeyDown"
      @click.stop
    />
    <div v-else>
      <div class="text-gray-200 prose prose-invert prose-sm max-w-none hyphenated">
        <div v-html="processedMarkdown"></div>
      </div>
      <div v-if="tags.length > 0" class="flex flex-wrap gap-1 mt-2">
        <span
          v-for="tag in tags"
          :key="tag"
          class="text-xs px-2 py-1 rounded text-gray-300"
          :style="{ background: getTagColor(tag) }"
        >
          {{ tag }}
        </span>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { extractTags, getTagColor, processContent } from '../utils';
import type { Card, CardPosition } from '../types';
import { processMarkdown } from '../util/markdown';

interface Props {
  card: Card;
  columnId: string;
  isFocused: boolean;
}

interface Emits {
  (e: 'focus', cardId: string): void;
  (e: 'update', cardId: string, content: string): void;
  (e: 'delete', cardId: string): void;
  (e: 'reportPosition', id: string, pos: CardPosition): void;
  (e: 'drop', draggedCardId: string, sourceColumnId: string, targetColumnId: string, targetCardId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
});

const emit = defineEmits<Emits>();

const isEditing = ref(props.card.isNew || false);
const tempContent = ref(props.card.content);
const textareaRef = ref<HTMLTextAreaElement>();
const cardRef = ref<HTMLDivElement>();
const isDragging = ref(false);
const isDragOver = ref(false);

const tags = computed(() => extractTags(props.card.content));
const processedContent = computed(() => processContent(props.card.content));

// Process markdown content
const processedMarkdown = computed(() => {
  try {
    // Simple markdown processing for Vue
    const content = processedContent.value;
    return processMarkdown(content);
  } catch (error) {
    return processedContent.value;
  }
});


// Listen for edit-card events
onMounted(() => {
  const handleEditEvent = (e: CustomEvent) => {
    if (e.detail.cardId === props.card.id) {
      startEditing();
    }
  };
  document.addEventListener('edit-card', handleEditEvent as EventListener);
  
  onUnmounted(() => {
    document.removeEventListener('edit-card', handleEditEvent as EventListener);
  });
});

// Focus the textarea when editing starts or when card is new
watch([isEditing], async ([editing]) => {
  if (editing) {
    await nextTick();
    if (textareaRef.value) {
      textareaRef.value.focus();
      if (props.card.isNew) {
        // newline indicates that tags were added
        const startsWithNewline = tempContent.value.startsWith('\n');
        if (startsWithNewline) {
          // Move cursor to the end if new card
          textareaRef.value.setSelectionRange(tempContent.value.length, tempContent.value.length);
        } else {
          // Move cursor to start for existing cards
          textareaRef.value?.select();
        }
      }
    }
  }
}, { immediate: true }); // Run immediately on mount

// When card becomes focused, ensure keyboard focus is applied
watch(() => props.isFocused, async (focused) => {
  if (focused && !isEditing.value) {
    await nextTick();
    cardRef.value?.focus();
  }
});

// Report position after layout changes
const reportPosition = () => {
  // Get the parent element which includes the drop indicator space
  const parentElement = cardRef.value?.parentElement;
  if (parentElement) {
    const rect = parentElement.getBoundingClientRect();
    emit('reportPosition', props.card.id, {
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
      columnId: props.columnId,
    });
  }
};

// Report position when visibility changes
watch(() => props.card.id, () => {
  nextTick(() => {
    reportPosition();
  });
});

let observer: ResizeObserver | null = null;

onMounted(() => {
  // Report initial position after a small delay to ensure layout is complete
  nextTick(() => {
    setTimeout(() => {
      reportPosition();
    }, 50);
  });

  // Set up observer for position changes on the parent element
  observer = new ResizeObserver(() => {
    reportPosition();
  });

  const parentElement = cardRef.value?.parentElement;
  if (parentElement) {
    observer.observe(parentElement);
  }

  // Listen for position update requests
  const handleUpdatePositions = () => {
    reportPosition();
  };
  window.addEventListener('update-card-positions', handleUpdatePositions);

  // Cleanup
  return () => {
    observer?.disconnect();
    window.removeEventListener('update-card-positions', handleUpdatePositions);
  };
});

const handleSave = () => {
  emit('update', props.card.id, tempContent.value);
  isEditing.value = false;
};

const handleKeyDown = (e: KeyboardEvent) => {
  e.stopPropagation(); // Prevent event from bubbling to global handlers

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSave();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    if (props.card.isNew) {
      emit('delete', props.card.id);
    } else {
      tempContent.value = props.card.content;
      isEditing.value = false;
    }
  }
};

const handleCardClick = (e: MouseEvent) => {
  e.stopPropagation();
  if (e.altKey) {
    if (confirm('Are you sure you want to delete this card?')) {
      emit('delete', props.card.id);
    }
  } else {
    emit('focus', props.card.id);
  }
};

const startEditing = () => {
  isEditing.value = true;
};

const handleCardDoubleClick = (e: MouseEvent) => {
  e.stopPropagation();
  startEditing();
};

const handleCardKeyDown = (e: KeyboardEvent) => {
  // Handle Enter to edit when card is focused
  if ((e.key === 'Enter' || e.key === ' ' || e.key === 'F2') && 
      !e.ctrlKey && !e.altKey && !e.shiftKey && !isEditing.value) {
    e.preventDefault();
    startEditing();
  }
};

// Drag and drop handlers
const handleDragStart = (e: DragEvent) => {
  if (!e.dataTransfer) return;
  
  isDragging.value = true;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('cardId', props.card.id);
  e.dataTransfer.setData('sourceColumnId', props.columnId);
  
  // Store globally for cross-component access
  (window as any).__draggedCardId = props.card.id;
  (window as any).__sourceColumnId = props.columnId;
};

const handleDragEnd = () => {
  isDragging.value = false;
  // Clean up global state
  delete (window as any).__draggedCardId;
  delete (window as any).__sourceColumnId;
  
  // Dispatch event to clean up any stuck drag states
  window.dispatchEvent(new CustomEvent('drag-ended'));
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  if (!e.dataTransfer) return;
  e.dataTransfer.dropEffect = 'move';
};

const handleDragEnter = (_e: DragEvent) => {
  const draggedCardId = (window as any).__draggedCardId;
  if (draggedCardId && draggedCardId !== props.card.id) {
    isDragOver.value = true;
  }
};

const handleDragLeave = (e: DragEvent) => {
  // Check if we're leaving the entire card container (including indicator space)
  const relatedTarget = e.relatedTarget as HTMLElement;
  const container = cardRef.value?.parentElement;
  if (container && !container.contains(relatedTarget)) {
    isDragOver.value = false;
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  isDragOver.value = false;
  
  const draggedCardId = (window as any).__draggedCardId;
  const sourceColumnId = (window as any).__sourceColumnId;
  
  if (draggedCardId && draggedCardId !== props.card.id) {
    emit('drop', draggedCardId, sourceColumnId, props.columnId, props.card.id);
  }
};

// Expose methods for external use
defineExpose({
  startEditing
});
</script>
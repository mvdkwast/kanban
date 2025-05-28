<template>
  <div class="mb-4" data-testid="tag-selector">
    <!-- Tags -->
    <div class="flex flex-wrap gap-2" data-testid="tag-list">
      <button
        v-for="state in tagStates"
        :key="state.tag"
        class="px-3 py-1 rounded text-sm font-medium transition-all outline-none tag-button"
        :class="getTagClasses(state)"
        :style="getTagStyle(state)"
        :data-testid="`tag-${state.tag.replace('#', '')}`"
        :data-tag="state.tag"
        :data-selected="state.isSelected"
        :data-focused="state.isFocused"
        :data-darkened="state.isDarkened"
        :data-glowing="state.isGlowing"
        @click="$emit('tagClick', state.tag, $event.shiftKey)"
      >
        {{ state.tag }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTagColor } from '../utils';
import type { TagVisualState } from '../composables/useTagSelection';

interface Props {
  tagStates: TagVisualState[];
  isActive: boolean;
  prefix: string;
  hasNoMatches: boolean;
}

interface Emits {
  (e: 'tagClick', tag: string, withShift: boolean): void;
}

defineProps<Props>();
defineEmits<Emits>();

const getTagClasses = (state: TagVisualState) => {
  const classes = [];
  
  if (state.isDarkened) {
    classes.push('opacity-30 cursor-not-allowed');
  } else {
    classes.push('cursor-pointer');
    if (!state.isSelected) {
      classes.push('hover:bg-gray-800 hover:text-white');
    }
  }
  
  if (state.isFocused) {
    classes.push('ring-2 ring-white');
  }
  
  if (state.isGlowing) {
    classes.push('animate-pulse');
  }
  
  return classes;
};

const getTagStyle = (state: TagVisualState) => {
  const color = getTagColor(state.tag);
  
  if (state.isSelected) {
    return {
      background: color,
      border: '2px solid #fff',
      color: '#fff',
      boxShadow: state.isGlowing ? `0 0 12px ${color}` : undefined
    };
  } else {
    return {
      background: 'transparent',
      border: `2px solid ${color}`,
      color: state.isDarkened ? '#666' : undefined
    };
  }
};
</script>

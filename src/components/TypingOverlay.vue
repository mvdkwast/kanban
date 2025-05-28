<template>
  <Teleport to="body">
    <div 
      v-if="isVisible" 
      class="fixed top-4 right-4 z-50 bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-600"
      data-testid="tag-prefix"
    >
      <span class="text-sm font-mono" :class="hasNoMatches ? 'text-red-400' : 'text-gray-400'">
        {{ prefix }}
      </span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isVisible: boolean;
  prefix: string;
  hasNoMatches: boolean;
}

defineProps<Props>();
</script>

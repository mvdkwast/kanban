<template>
  <MainView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import MainView from './components/MainView.vue';
import { useKeyboardManager } from './services/KeyboardManager';
import { createNavigationKeyboardHandler } from './services/NavigationKeyboardHandler';

onMounted(() => {
  const keyboardManager = useKeyboardManager();
  keyboardManager.registerModeHandler('navigation', createNavigationKeyboardHandler());
});
</script>

<style>
@import './assets/styles.css';
</style>

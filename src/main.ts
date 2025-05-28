import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { useModeManager } from './services/ModeManager';
import { useKeyboardManager } from './services/KeyboardManager';

const app = createApp(App);
const pinia = createPinia();

// Initialize managers
useModeManager();
useKeyboardManager();

app.use(pinia);
app.mount('#app');

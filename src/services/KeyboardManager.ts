import { useModeManager } from './ModeManager';
import { emitter } from './events';
import { Modes } from '../types';

type KeyboardHandler = (e: KeyboardEvent) => boolean | void;

class KeyboardManager {
  private modeHandlers = new Map<Modes, KeyboardHandler>();
  private globalHandlers = new Map<string, () => void>();
  private modeManager = useModeManager();
  
  constructor() {
    
    // Register global handlers
    this.setupGlobalHandlers();
    
    // Start listening to keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  private setupGlobalHandlers() {
    // These shortcuts work regardless of mode
    this.globalHandlers.set('ctrl+h', () => {
      emitter.emit('global:toggleHelp');
    });
    
    this.globalHandlers.set('ctrl+e', () => {
      emitter.emit('global:export');
    });
    
    this.globalHandlers.set('ctrl+shift+e', () => {
      emitter.emit('global:exportAll');
    });
    
    this.globalHandlers.set('ctrl+i', () => {
      emitter.emit('global:import');
    });
    
    this.globalHandlers.set('ctrl+shift+i', () => {
      emitter.emit('global:importAll');
    });
    
    this.globalHandlers.set('ctrl+k', () => {
      emitter.emit('filter:reset');
    });
    
    this.globalHandlers.set('ctrl+b', () => {
      emitter.emit('global:newBoard');
    });
    
    this.globalHandlers.set('alt+t', () => {
      emitter.emit('global:focusTitle');
    });
    
    this.globalHandlers.set('ctrl+[', () => {
      emitter.emit('global:prevBoard');
    });
    
    this.globalHandlers.set('ctrl+]', () => {
      emitter.emit('global:nextBoard');
    });
  }
  
  registerModeHandler(mode: Modes, handler: KeyboardHandler) {
    this.modeHandlers.set(mode, handler);
  }
  
  private handleKeyDown(e: KeyboardEvent) {
    // Skip if we're in an input element (unless it's a global shortcut)
    const isInInputField = e.target instanceof HTMLElement &&
      (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON');
    
    // Build key combination string
    const keyCombo = [
      e.ctrlKey && 'ctrl',
      e.altKey && 'alt',
      e.shiftKey && 'shift',
      e.key.toLowerCase()
    ].filter(Boolean).join('+');
    
    // Check global handlers first
    if (this.globalHandlers.has(keyCombo)) {
      e.preventDefault();
      this.globalHandlers.get(keyCombo)!();
      return;
    }
    
    // If in input and not a global shortcut, let it through
    if (isInInputField) {
      return;
    }
    
    // Get current mode and delegate to mode handler
    const currentMode = this.modeManager.getCurrentMode();
    const handler = this.modeHandlers.get(currentMode);
    
    if (handler) {
      const handled = handler(e);
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }
  
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}

// Singleton instance
let keyboardManagerInstance: KeyboardManager | null = null;

export function useKeyboardManager(): KeyboardManager {
  if (!keyboardManagerInstance) {
    keyboardManagerInstance = new KeyboardManager();
  }
  return keyboardManagerInstance;
}
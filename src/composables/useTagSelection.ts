import { ref, computed, onMounted, onUnmounted } from 'vue';
import { TagSelectionManager } from '../services/TagSelectionManager';
import { emitter } from '../services/events';
import { useKeyboardManager } from '../services/KeyboardManager';
import { createTagSelectionKeyboardHandler } from '../services/TagSelectionKeyboardHandler';
import type { Modes } from '../types';

export interface TagVisualState {
  tag: string;
  isSelected: boolean;
  isFocused: boolean;
  isDarkened: boolean;
  isGlowing: boolean;
}

export function useTagSelection() {
  // Internal state
  const manager = ref<TagSelectionManager | null>(null);
  const isActive = ref(false);
  const allTags = ref<string[]>([]);
  const currentSelection = ref<string[]>([]);
  
  // Reactive state exposed to components
  const prefix = ref('#');
  const focusedTag = ref<string | null>(null);
  const selection = ref<string[]>([]);
  const hasNoMatches = ref(false);
  
  // Update reactive state from manager
  const updateState = () => {
    if (!manager.value) return;
    
    prefix.value = manager.value.getPrefix();
    focusedTag.value = manager.value.getFocusedTag();
    selection.value = manager.value.getSelection();
    hasNoMatches.value = manager.value.getMatchingTags().length === 0 && prefix.value.length > 1;
    
    // Emit filter update with active tags
    emitter.emit('filter:tags', manager.value.getActiveFilterTags());
  };
  
  // Computed visual states for tags
  const tagStates = computed<TagVisualState[]>(() => {
    if (!manager.value || !isActive.value) {
      return allTags.value.map(tag => ({
        tag,
        isSelected: currentSelection.value.includes(tag),
        isFocused: false,
        isDarkened: false,
        isGlowing: false
      }));
    }
    
    const matchingTags = manager.value.getMatchingTags();
    const isPreviewMode = manager.value.isInPreviewMode();
    
    return allTags.value.map(tag => ({
      tag,
      isSelected: selection.value.includes(tag),
      isFocused: tag === focusedTag.value,
      isDarkened: !matchingTags.includes(tag),
      isGlowing: isPreviewMode && matchingTags.includes(tag)
    }));
  });
  
  // Leave tag mode - centralized function
  const leaveTagMode = () => {
    if (!manager.value) return;
    
    // Clear any preview state
    manager.value.exitMode();
    
    // Update current selection to final selection
    currentSelection.value = selection.value;
    
    // Emit final selection
    emitter.emit('filter:tags', currentSelection.value);
    
    // Clear internal state
    isActive.value = false;
    manager.value = null;
    prefix.value = '#';
    focusedTag.value = null;
    
    // Emit mode exit
    emitter.emit('mode:exit', 'tag-selection');
  };
  
  // Keyboard handling
  const handleKeyDown = (e: KeyboardEvent): boolean => {
    if (!manager.value || !isActive.value) return false;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        manager.value.moveFocus('left');
        updateState();
        return true;
        
      case 'ArrowRight':
        e.preventDefault();
        manager.value.moveFocus('right');
        updateState();
        return true;
        
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        const enterResult = manager.value.handleEnter(e.shiftKey);
        updateState();
        if (enterResult.shouldExit) {
          leaveTagMode();
        }
        return true;
        
      case ' ':
        e.preventDefault();
        e.stopPropagation();
        manager.value.handleSpace(e.shiftKey);
        updateState();
        return true;
        
      case 'Escape':
        e.preventDefault();
        const escapeResult = manager.value.handleEscape();
        updateState();
        if (escapeResult.shouldExit) {
          leaveTagMode();
        }
        return true;
        
      case 'Backspace':
        e.preventDefault();
        const continueMode = manager.value.removeLastCharacter();
        if (!continueMode) {
          leaveTagMode();
        } else {
          updateState();
        }
        return true;
        
      default:
        // Handle character input
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          manager.value.addCharacter(e.key);
          updateState();
          return true;
        }
        return false;
    }
  };
  
  // Click handling
  const handleTagClick = (tag: string, withShift: boolean) => {
    if (!isActive.value) {
      // Not in tag mode, just update selection directly
      let newSelection: string[];
      if (withShift) {
        // Toggle the tag
        newSelection = [...currentSelection.value];
        const index = newSelection.indexOf(tag);
        if (index >= 0) {
          newSelection.splice(index, 1);
        } else {
          newSelection.push(tag);
        }
      } else {
        // Smart toggle
        if (currentSelection.value.length > 1 && currentSelection.value.includes(tag)) {
          // Multiple selected, clicking selected one: select only this
          newSelection = [tag];
        } else if (currentSelection.value.length === 1 && currentSelection.value.includes(tag)) {
          // Only this selected: deselect
          newSelection = [];
        } else {
          // Not selected or others selected: select only this
          newSelection = [tag];
        }
      }
      currentSelection.value = newSelection;
      emitter.emit('filter:tags', newSelection);
      
      // Remember last focused tag
      if (manager.value) {
        manager.value.lastFocusedTag = tag;
      }
      return;
    }
    
    // In tag mode
    manager.value!.handleClick(tag, withShift);
    updateState();
    
    // Exit mode after click to focus card
    leaveTagMode();
  };
  
  // Event handlers
  const handleModeEnter = (mode?: Modes) => {
    if (mode !== 'tag-selection' || isActive.value) return;
    
    if (!allTags.value.length) return;
    
    manager.value = new TagSelectionManager(allTags.value, currentSelection.value);
    manager.value.enterMode(currentSelection.value);
    isActive.value = true;
    updateState();
  };
  
  const handleModeExit = (mode: Modes) => {
    if (mode === 'tag-selection' && isActive.value) {
      leaveTagMode();
    }
  };
  
  const handleTagsUpdated = (tags: string[]) => {
    allTags.value = tags;
    if (manager.value) {
      manager.value.updateTags(tags);
      updateState();
    }
  };
  
  const handleFilterTags = (tags: string[]) => {
    if (!isActive.value) {
      currentSelection.value = tags;
    }
  };
  
  // Set up event listeners
  onMounted(() => {
    emitter.on('mode:enter', handleModeEnter);
    emitter.on('mode:exit', handleModeExit);
    emitter.on('tags:updated', handleTagsUpdated);
    emitter.on('filter:tags', handleFilterTags);
    
    // Register keyboard handler with KeyboardManager
    const keyboardManager = useKeyboardManager();
    keyboardManager.registerModeHandler('tag-selection', createTagSelectionKeyboardHandler(handleKeyDown));
  });
  
  onUnmounted(() => {
    emitter.off('mode:enter', handleModeEnter);
    emitter.off('mode:exit', handleModeExit);
    emitter.off('tags:updated', handleTagsUpdated);
    emitter.off('filter:tags', handleFilterTags);
    
    // Clean up global keyboard handler
    if ((window as any).__tagSelectionCleanup) {
      (window as any).__tagSelectionCleanup();
      delete (window as any).__tagSelectionCleanup;
    }
  });
  
  return {
    // State
    isActive,
    prefix,
    focusedTag,
    selection: computed(() => isActive.value ? selection.value : currentSelection.value),
    hasNoMatches,
    tagStates,
    
    // Actions
    handleTagClick
  };
}
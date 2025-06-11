<template>
  <div class="min-h-screen bg-black text-white p-4">

    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <BoardManager
            v-model:title="kanbanStore.boardTitle"
            :boards="boardStore.boards"
            :current-board-id="boardStore.currentBoardId"
            :has-multiple-boards="boardStore.hasMultipleBoards"
            ref="boardManagerRef"
            @new-board="handleNewBoard"
            @select-board="handleSelectBoard"
            @delete-board="handleDeleteBoard"
        />

        <div class="flex-1 flex justify-center items-center gap-2">
          <SearchWidget
              ref="searchWidgetRef"
          />

          <button
              v-if="hasActiveFilters"
              @click="handleClearFilters"
              class="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm"
              title="Clear all filters (Ctrl+K)"
          >
            Clear
          </button>
        </div>

        <HamburgerMenu
            @import="handleImportClick"
            @import-all="handleImportAllClick"
            @export="handleExportClick"
            @export-all="handleExportAllClick"
            @help="handleHelpClick"
        />

        <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleImport"
        />

        <input
            ref="fileInputAllRef"
            type="file"
            accept=".json"
            multiple
            class="hidden"
            @change="handleImportAll"
        />
      </div>

      <!-- Tag Selector -->
      <TagSelector
          v-if="kanbanStore.allTags.length > 0"
          :tag-states="tagStates"
          :is-active="isTagSelectionActive"
          :prefix="tagPrefix"
          :has-no-matches="tagHasNoMatches"
          @tag-click="handleTagClick"
      />

      <!-- Typing Overlay -->
      <TypingOverlay
          :is-visible="isTagSelectionActive"
          :prefix="tagPrefix"
          :has-no-matches="tagHasNoMatches"
      />

      <!-- Kanban Board -->
      <KanbanBoard
          :columns="kanbanStore.columns"
          :visible-cards="kanbanStore.visibleCards"
          :focused-card-id="kanbanStore.focusedCardId"
          :selected-card-ids="kanbanStore.selectedCardIds"
          @add-card="handleAddCard"
          @focus-card="handleFocusCard"
          @update-card="handleUpdateCard"
          @delete-card="handleDeleteCard"
          @drop-card="handleDropCard"
          @clear-column="handleClearColumn"
          @report-card-position="handleReportCardPosition"
          @select-card="handleSelectCard"
      />

      <!-- Debug info -->
      <div class="mt-4 text-xs text-gray-500">
        <details>
          <summary>Debug Info</summary>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="font-semibold">Kanban Store:</h4>
              <div>Board title: "{{ kanbanStore.boardTitle }}"</div>
              <div>Total cards: {{ kanbanStore.cards.length }}</div>
              <div>Visible cards: {{ kanbanStore.visibleCards.length }}</div>
              <div>Selected cards: {{ kanbanStore.selectedCardIds.length > 0 ? kanbanStore.selectedCardIds.join(', ') : 'none' }}</div>
              <div>Selected tags: {{ filterSelectedTags }}</div>
              <div>Search text: "{{ filterSearchText }}"</div>
              <div>Focused card: {{ kanbanStore.focusedCardId }}</div>
            </div>
            <div>
              <h4 class="font-semibold">Board Store:</h4>
              <div>Current board ID: "{{ boardStore.currentBoardId }}"</div>
              <div>Is initialized: {{ boardStore.isInitialized }}</div>
              <div>Is loading: {{ boardStore.isLoadingBoard }}</div>
              <div>Boards count: {{ boardStore.boards.length }}</div>
              <div>Current path: "{{ currentPath }}"</div>
            </div>
          </div>
        </details>
      </div>
    </div>

    <!-- Help Modal -->
    <HelpModal
        :show-help="showHelp"
        @close="showHelp = false"
    />

    <!-- Save feedback toast -->
    <SaveToast :show="showSaveToast"/>

    <!-- Completion toast -->
    <CompletionToast :show="showCompletionToast" :target-column="completionTargetColumn"/>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {useKanbanStore} from '../stores/useKanbanStore';
import {useBoardStore} from '../stores/useBoardStore';
import {useRouter} from '../services/router';
import {useTagSelection} from '../composables/useTagSelection';
import {useFilter} from '../composables/useFilter';
import {emitter} from '../services/events';
import {useImportExportService} from '../services/ImportExportService';

// Components
import BoardManager from './BoardManager.vue';
import SearchWidget from './SearchWidget.vue';
import TagSelector from './TagSelector.vue';
import KanbanBoard from './KanbanBoard.vue';
import HelpModal from './HelpModal.vue';
import SaveToast from './SaveToast.vue';
import TypingOverlay from './TypingOverlay.vue';
import CompletionToast from './CompletionToast.vue';
import HamburgerMenu from './HamburgerMenu.vue';
import {BoardData} from "@/types.ts";

const kanbanStore = useKanbanStore();
const boardStore = useBoardStore();
const importExportService = useImportExportService();
const {currentPath} = useRouter();

// Local state
const showHelp = ref(false);
const showSaveToast = ref(false);
const showCompletionToast = ref(false);
const completionTargetColumn = ref('');

// Refs
const boardManagerRef = ref();
const searchWidgetRef = ref();
const fileInputRef = ref<HTMLInputElement>();
const fileInputAllRef = ref<HTMLInputElement>();


// Tag selection composable
const {
  isActive: isTagSelectionActive,
  prefix: tagPrefix,
  hasNoMatches: tagHasNoMatches,
  tagStates,
  handleTagClick
} = useTagSelection();

// Import useFilter
const {selectedTags: filterSelectedTags, searchText: filterSearchText} = useFilter();

// Computed
const hasActiveFilters = computed(() =>
    filterSelectedTags.value.length > 0 || filterSearchText.value
);

// Initialize application
onMounted(async () => {
  // Set up global event listeners
  setupGlobalEventListeners();

  // Set up store orchestration
  setupStoreOrchestration();

  try {
    const allBoards = await boardStore.initializeStorage();

    // Determine which board to load
    let targetBoardId: string | null = currentPath.value;

    if (allBoards.length === 0) {
      // No boards exist, create default
      targetBoardId = await boardStore.createNewBoard();
    }

    // Check if requested board exists
    const boardExists = allBoards.some(b => b.id === targetBoardId);
    if (!boardExists) {
      // Requested board doesn't exist, use most recent
      targetBoardId = allBoards[0].id || null;

      if (!targetBoardId) {
        // auto-create failed ?
        console.error('No boards available to load');
        return;
      }

      // Navigate to the correct board
      const {navigate} = useRouter();
      navigate(targetBoardId);
      return; // The route watcher will handle loading
    }

    // Set current board ID (this will trigger loading via watcher)
    await boardStore.setCurrentBoard(targetBoardId);
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});

/**
 * Set up orchestration between stores and route changes
 */
const setupStoreOrchestration = () => {
  // Watch route changes → update current board ID
  watch(currentPath, async (newPath) => {
    if (!boardStore.isInitialized) {
      console.warn('Skipping route change - not initialized');
      return;
    }

    if (newPath === boardStore.currentBoardId) {
      return;
    }

    await boardStore.setCurrentBoard(newPath);
  });

  // Watch current board data changes → initialize kanban store
  watch(() => boardStore.currentBoardData, async (newBoardData) => {
    // Skip if we're auto-saving (prevents infinite loop)
    if (boardStore.isAutoSaving) {
      console.log('Skipping board data change - auto-saving');
      return;
    }

    if (newBoardData) {
      kanbanStore.initializeBoard(newBoardData.title, newBoardData.cards || [], newBoardData.focusedCardId);
    } else if (boardStore.currentBoardId) {
      // Board data not found, try to load it
      const boardData = await boardStore.setCurrentBoard(boardStore.currentBoardId);
      if (!boardData) {
        // Board doesn't exist, redirect to first available board
        const allBoards = boardStore.boards;
        if (allBoards.length > 0) {
          const {navigate} = useRouter();
          navigate(allBoards[0].id!);
        }
      }
    }
  }, {immediate: true});

  // Listen to kanban store changes → save to board store
  emitter.on('board:changed', (boardData: BoardData) => {
    boardStore.setBoardData({
      ...boardData,
      id: boardStore.currentBoardId,
      lastModified: new Date()
    });
    boardStore.saveCurrentBoard();
  });
};

// Note: Auto-focus is now handled by initializeBoard with saved focus state

// Event handlers
const handleNewBoard = async () => {
  const newBoardId = await boardStore.createNewBoard();

  if (newBoardId) {
    // Navigate to the new board
    const {navigate} = useRouter();
    navigate(newBoardId);

    // Wait for UI to update then focus title
    setTimeout(() => {
      boardManagerRef.value?.focusTitle();
    }, 200);
  }
};

const handleSelectBoard = (boardId: string) => {
  const {navigate} = useRouter();
  navigate(boardId);
};

const handleDeleteBoard = async (boardId: string) => {
  await boardStore.deleteBoard(boardId);
  // If currentBoardId changed, navigate to it
  if (boardStore.currentBoardId !== currentPath.value) {
    const {navigate} = useRouter();
    navigate(boardStore.currentBoardId);
  }
};


const handleClearFilters = () => {
  emitter.emit('filter:reset');
};

const handleAddCard = (columnId: string, beforeIndex?: number | null) => {
  kanbanStore.addCard(columnId, beforeIndex);
};

const handleFocusCard = (cardId: string) => {
  kanbanStore.focusCard(cardId);
};

const handleUpdateCard = (cardId: string, content: string) => {
  // Check visibility before update
  const wasVisible = kanbanStore.visibleCards.some(c => c.id === cardId);

  kanbanStore.updateCard(cardId, content);

  // Only show toast if card was visible before update and is now hidden due to filters
  if (wasVisible) {
    const isCardVisible = kanbanStore.visibleCards.some(c => c.id === cardId);
    if (!isCardVisible && (filterSelectedTags.value.length > 0 || filterSearchText.value)) {
      showSaveToast.value = true;
      setTimeout(() => {
        showSaveToast.value = false;
      }, 3000);
    }
  }
};

const handleDeleteCard = (cardId: string) => {
  kanbanStore.deleteCard(cardId);
};

const handleClearColumn = (columnId: string) => {
  kanbanStore.clearColumn(columnId);
};

const handleReportCardPosition = (id: string, pos: any) => {
  kanbanStore.reportCardPosition(id, pos);
};

const handleSelectCard = (cardId: string, ctrlKey: boolean) => {
  kanbanStore.toggleCardSelection(cardId, ctrlKey);
};

const handleDropCard = (cardId: string, _sourceColumnId: string, targetColumnId: string, targetCardId?: string | null) => {
  // Check if this is a multi-drag operation
  const isMultiDrag = (window as any).__isMultiDrag;
  const selectedCardIds = (window as any).__selectedCardIds || [cardId];

  // Special case for delete column
  if (targetColumnId === 'delete') {
    if (isMultiDrag) {
      if (confirm(`Are you sure you want to delete ${selectedCardIds.length} cards?`)) {
        selectedCardIds.forEach(id => kanbanStore.deleteCard(id));
      }
    } else {
      if (confirm('Are you sure you want to delete this card?')) {
        kanbanStore.deleteCard(cardId);
      }
    }
    return;
  }

  // Handle multi-card move
  if (isMultiDrag) {
    // Move all selected cards to the target column
    selectedCardIds.forEach(id => {
      kanbanStore.moveCard(id, targetColumnId, targetCardId);
    });

    // Focus the primary dragged card
    kanbanStore.focusCard(cardId);
  } else {
    // Single card move
    kanbanStore.moveCard(cardId, targetColumnId, targetCardId);
    kanbanStore.focusCard(cardId);
  }
};

const handleExportClick = () => {
  importExportService.exportBoard();
};

const handleImportClick = () => {
  fileInputRef.value?.click();
};

const handleExportAllClick = () => {
  importExportService.exportAllBoards();
};

const handleImportAllClick = () => {
  fileInputAllRef.value?.click();
};

const handleHelpClick = () => {
  showHelp.value = true;
};

const handleImport = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const boardId = await importExportService.importBoard(file);
    if (boardId) {
      if (boardStore.currentBoardId !== boardId) {
        // Navigate to the newly imported board
        await boardStore.setCurrentBoard(boardId);
      } else {
        // If already on this board, just refresh
        kanbanStore.initializeBoard(
            boardStore.currentBoardData?.title ?? 'New Board',
            boardStore.currentBoardData?.cards || [],
            boardStore.currentBoardData?.focusedCardId
        );
      }
    }
  }

  // Reset the file input
  target.value = '';
};

const handleImportAll = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files;

  if (files && files.length > 0) {
    await importExportService.importMultipleBoards(files);
  }

  // Reset the file input
  target.value = '';
};

// Set up global event listeners in the existing onMounted
const setupGlobalEventListeners = () => {
  emitter.on('global:toggleHelp', () => {
    showHelp.value = !showHelp.value;
  });
  emitter.on('global:export', handleExportClick);
  emitter.on('global:exportAll', handleExportAllClick);
  emitter.on('global:import', () => {
    fileInputRef.value?.click();
  });
  emitter.on('global:importAll', () => {
    fileInputAllRef.value?.click();
  });
  emitter.on('global:focusTitle', () => {
    boardManagerRef.value?.focusTitle();
  });
  emitter.on('global:newBoard', handleNewBoard);
  emitter.on('global:prevBoard', () => {
    boardStore.switchToPreviousBoard();
  });
  emitter.on('global:nextBoard', () => {
    boardStore.switchToNextBoard();
  });

  // FIXME - we should refactor this so the event transmits a card ID instead of a column, then we should refactor
  //         the toast components to a single component that can display different messages
  emitter.on('card:completed', (targetColumn: string) => {
    completionTargetColumn.value = targetColumn;
    showCompletionToast.value = true;
    setTimeout(() => {
      showCompletionToast.value = false;
    }, 2000);
  });
};

onUnmounted(() => {
  emitter.off('global:toggleHelp');
  emitter.off('global:export');
  emitter.off('global:exportAll');
  emitter.off('global:import');
  emitter.off('global:importAll');
  emitter.off('global:focusTitle');
  emitter.off('global:newBoard');
  emitter.off('global:prevBoard');
  emitter.off('global:nextBoard');
  emitter.off('card:completed');
  emitter.off('board:changed');
});
</script>

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
          @export="handleExportClick"
          @help="handleHelpClick"
        />

        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleImport"
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
        @add-card="handleAddCard"
        @focus-card="handleFocusCard"
        @update-card="handleUpdateCard"
        @delete-card="handleDeleteCard"
        @drop-card="handleDropCard"
        @clear-column="handleClearColumn"
        @report-card-position="handleReportCardPosition"
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
    <SaveToast :show="showSaveToast" />

    <!-- Completion toast -->
    <CompletionToast :show="showCompletionToast" :target-column="completionTargetColumn" />
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

const kanbanStore = useKanbanStore();
const boardStore = useBoardStore();
const { currentPath } = useRouter();

// Local state
const showHelp = ref(false);
const showSaveToast = ref(false);
const showCompletionToast = ref(false);
const completionTargetColumn = ref('');

// Refs
const boardManagerRef = ref();
const searchWidgetRef = ref();
const fileInputRef = ref<HTMLInputElement>();


// Tag selection composable
const {
  isActive: isTagSelectionActive,
  prefix: tagPrefix,
  hasNoMatches: tagHasNoMatches,
  tagStates,
  handleTagClick
} = useTagSelection();

// Import useFilter
const { selectedTags: filterSelectedTags, searchText: filterSearchText } = useFilter();

// Computed
const hasActiveFilters = computed(() => 
  filterSelectedTags.value.length > 0 || filterSearchText.value
);

// Initialize application
onMounted(async () => {
  // Set up global event listeners
  setupGlobalEventListeners();

  try {
    const allBoards = await boardStore.initializeStorage();

    // Determine which board to load
    let targetBoardId = currentPath.value;

    if (allBoards.length === 0) {
      // No boards exist, create default
      targetBoardId = await boardStore.createNewBoard();
    }

    // Check if requested board exists
    const boardExists = allBoards.some(b => b.id === targetBoardId);
    if (!boardExists) {
      // Requested board doesn't exist, use most recent
      targetBoardId = allBoards[0].id;
      boardStore.switchToBoard(targetBoardId);
    }

    // Load the target board
    const boardData = await boardStore.loadBoard(targetBoardId);
    if (boardData) {
      kanbanStore.initializeBoard(boardData.title, boardData.cards || [], boardData.focusedCardId);
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});

// Watch for route changes to load different boards
watch(currentPath, async (newPath) => {
  console.log('Route changed to:', newPath);
  console.log('Current board ID:', boardStore.currentBoardId);

  if (!boardStore.isInitialized) {
    console.log('Skipping route change - not initialized');
    return;
  }

  if (newPath === boardStore.currentBoardId && !boardStore.isLoadingBoard) {
    console.log('Skipping route change - already on this board');
    return;
  }

  console.log('Loading board:', newPath);
  const boardData = await boardStore.loadBoard(newPath);
  console.log('Loaded board data:', boardData);

  if (boardData) {
    console.log('Initializing kanban store with board data:', boardData.title, boardData.cards?.length || 0, 'focused:', boardData.focusedCardId);
    kanbanStore.initializeBoard(boardData.title, boardData.cards || [], boardData.focusedCardId);
  }
});

// Note: Auto-focus is now handled by initializeBoard with saved focus state

// Event handlers
const handleNewBoard = async () => {
  console.log('handleNewBoard called');
  const newBoardId = await boardStore.createNewBoard();
  console.log('New board created, ID:', newBoardId);

  if (newBoardId) {
    console.log('Waiting for board to load before focusing title...');
    // Wait a bit for the board to load and UI to update
    setTimeout(() => {
      console.log('Attempting to focus title...');
      boardManagerRef.value?.focusTitle();
    }, 200);
  }
};

const handleSelectBoard = (boardId: string) => {
  boardStore.switchToBoard(boardId);
};

const handleDeleteBoard = (boardId: string) => {
  boardStore.deleteBoard(boardId);
};


const handleClearFilters = () => {
  emitter.emit('filter:reset');
};

const handleAddCard = (columnId: string, beforeIndex?: number | null) => {
  console.log('Adding card to column:', columnId, 'at index:', beforeIndex);
  kanbanStore.addCard(columnId, beforeIndex);
};

const handleFocusCard = (cardId: string) => {
  console.log('Focusing card:', cardId);
  kanbanStore.focusCard(cardId);
};

const handleUpdateCard = (cardId: string, content: string) => {
  console.log('Updating card:', cardId, 'with content:', content);

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
  console.log('Deleting card:', cardId);
  kanbanStore.deleteCard(cardId);
};

const handleClearColumn = (columnId: string) => {
  console.log('Clearing column:', columnId);
  kanbanStore.clearColumn(columnId);
};

const handleReportCardPosition = (id: string, pos: any) => {
  kanbanStore.reportCardPosition(id, pos);
};

const handleDropCard = (cardId: string, _sourceColumnId: string, targetColumnId: string, targetCardId?: string | null) => {
  // Special case for delete column
  if (targetColumnId === 'delete') {
    if (confirm('Are you sure you want to delete this card?')) {
      kanbanStore.deleteCard(cardId);
    }
    return;
  }

  kanbanStore.moveCard(cardId, targetColumnId, targetCardId);
  kanbanStore.focusCard(cardId);
};

const handleExport = () => {
  const data = JSON.stringify({
    title: kanbanStore.boardTitle,
    cards: kanbanStore.cards
  }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = kanbanStore.boardTitle ? `${kanbanStore.boardTitle}.json` : 'kanban-board.json';
  a.click();
  URL.revokeObjectURL(url);
};

const handleExportClick = () => {
  handleExport();
};

const handleImportClick = () => {
  fileInputRef.value?.click();
};

const handleHelpClick = () => {
  showHelp.value = true;
};

const handleImport = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const title = data.title || 'Imported Board';
        const importedCards = data.cards || [];

        // Save the imported board
        const newBoardId = await boardStore.saveBoard(title, importedCards);

        // Navigate to the imported board
        boardStore.switchToBoard(newBoardId);

        // Clear filters
        emitter.emit('filter:reset')
      } catch (err) {
        alert('Failed to import file');
      }
    };
    reader.readAsText(file);
  }

  // Reset the file input
  target.value = '';
};

// Set up global event listeners in the existing onMounted
const setupGlobalEventListeners = () => {
  emitter.on('global:toggleHelp', () => { showHelp.value = !showHelp.value; });
  emitter.on('global:export', handleExport);
  emitter.on('global:import', () => { fileInputRef.value?.click(); });
  emitter.on('global:focusTitle', () => { boardManagerRef.value?.focusTitle(); });
  emitter.on('global:newBoard', () => { boardStore.createNewBoard(); });
  emitter.on('global:prevBoard', () => {
    const prevBoard = boardStore.getPrevBoard();
    if (prevBoard) boardStore.switchToBoard(prevBoard);
  });
  emitter.on('global:nextBoard', () => {
    const nextBoard = boardStore.getNextBoard();
    if (nextBoard) boardStore.switchToBoard(nextBoard);
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
  emitter.off('global:import');
  emitter.off('global:focusTitle');
  emitter.off('global:newBoard');
  emitter.off('global:prevBoard');
  emitter.off('global:nextBoard');
  emitter.off('card:completed');
});
</script>

import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {watchDebounced} from '@vueuse/core';
import type {BoardData, Card} from '../types';
import {storage} from '../services/storage';

export const useBoardStore = defineStore('board', () => {
  
  // State
  const boards = ref<BoardData[]>([]);
  const currentBoardId = ref<string>('');
  const isInitialized = ref(false); // storage is initialized and boards are loaded
  const isLoadingBoard = ref(false);

  // Getters
  const currentBoardData = computed(() => 
    boards.value.find(board => board.id === currentBoardId.value) || null
  );

  const hasMultipleBoards = computed(() => boards.value.length > 1);

  // Pending save data for debounced persistence
  const pendingSaveData = ref<BoardData | null>(null);
  
  // Track when we're auto-saving to prevent reinitializing kanban store
  const isAutoSaving = ref(false);

  const initializeStorage = async () => {
    try {
      await storage.init();

      const allBoards = await storage.getAllBoards();
      boards.value = allBoards;

      isInitialized.value = true;
      return allBoards;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      isInitialized.value = true;
      throw error;
    }
  };

  // Actions

  /**
   * Set current board ID
   */
  const setCurrentBoard = async (boardId: string): Promise<BoardData | null> => {
    if (isLoadingBoard.value) {
      console.log('Already loading board, returning null');
      return null;
    }

    isLoadingBoard.value = true;

    try {
      const boardData = await storage.getBoard(boardId);

      if (boardData) {
        currentBoardId.value = boardData.id!;
        return boardData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to load board:', error);
      return null;
    } finally {
      isLoadingBoard.value = false;
    }
  };

  /**
   * Save current board data with debounced persistence
   */
  const saveCurrentBoard = () => {
    if (!currentBoardData.value) {
        console.warn('No current board data to save');
        return;
    }

    pendingSaveData.value = JSON.parse(JSON.stringify(currentBoardData.value));
  };

  // Debounced auto-save when board content changes
  watchDebounced(pendingSaveData, async (boardData: BoardData | null) => {
    if (boardData && isInitialized.value && !isLoadingBoard.value) {
      try {
        isAutoSaving.value = true;
        await saveBoard(boardData);
      } catch (error) {
        console.error('Failed to auto-save board:', error);
      } finally {
        isAutoSaving.value = false;
      }
    }
  }, {
    debounce: 300,
    deep: true
  });

  const setBoardData = async(boardData: BoardData): Promise<void> => {
    if (isLoadingBoard.value) {
      console.log('Already loading board, cannot replace');
      return;
    }

    isLoadingBoard.value = true;

    try {
      await saveBoard(boardData);
    } catch (error) {
      console.error('Failed to replace board:', error);
      throw error;
    } finally {
      isLoadingBoard.value = false;
    }
  }

  const saveBoard = async (boardData: BoardData): Promise<string> => {
    try {
      const newBoardId = await storage.saveBoard(boardData);

      if (boardData.id === null) {
        // This is a new board, add it to the boards list
        console.log('Adding new board to boards list:', newBoardId);
        boards.value.push({
          ...boardData,
          id: newBoardId,
          lastModified: new Date()
        });
      }
      else if (newBoardId !== boardData.id) {
        // update id in boards list
        boards.value.find(b => b.id === boardData.id)!.id = newBoardId;

        // if current board is the one being saved, update currentBoardId
        if (currentBoardId.value === boardData.id) {
          console.log('Updating currentBoardId to new ID:', newBoardId);
          currentBoardId.value = newBoardId;
        }
      }

      return newBoardId;

    } catch (error) {
      console.error('Failed to save board:', error);
      throw error;
    }
  };

  const createNewBoard = async (title: string = 'New Board', cards: Card[] = []): Promise<string> => {
    return saveBoard({
      id: null, // New board, no ID yet
      title,
      cards,
      lastModified: new Date()
    });
  };

  const deleteBoard = async (boardId: string): Promise<void> => {
    if (isLoadingBoard.value) return;
    
    try {
      isLoadingBoard.value = true;
      await storage.deleteBoard(boardId);
      
      // Refresh boards list
      boards.value = await storage.getAllBoards();
      
      // If we deleted the current board, set to the most recent one
      if (boardId === currentBoardId.value) {
        if (boards.value.length > 0) {
          currentBoardId.value = boards.value[0].id!;
        } else {
          // No boards left, create a new default one
          const newBoardId = await createNewBoard();
          boards.value = await storage.getAllBoards();
          currentBoardId.value = newBoardId;
        }
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
      throw error;
    } finally {
      isLoadingBoard.value = false;
    }
  };

  const switchToNextBoard = () => {
    if (boards.value.length <= 1) return null;
    const currentIndex = boards.value.findIndex(b => b.id === currentBoardId.value);
    const nextIndex = (currentIndex + 1) % boards.value.length;
    currentBoardId.value = boards.value[nextIndex].id!;
  };

  const switchToPreviousBoard = () => {
    if (boards.value.length <= 1) return null;
    const currentIndex = boards.value.findIndex(b => b.id === currentBoardId.value);
    const prevIndex = (currentIndex - 1 + boards.value.length) % boards.value.length;
    currentBoardId.value = boards.value[prevIndex].id!;
  };

  const refreshBoards = async () => {
    boards.value = await storage.getAllBoards();
  };

  return {
    // State
    boards,
    currentBoardId,
    isInitialized,
    isLoadingBoard,
    isAutoSaving,
    
    // Getters
    currentBoardData,
    hasMultipleBoards,
    
    // Actions
    initializeStorage,

    setCurrentBoard,
    switchToNextBoard,
    switchToPreviousBoard,

    saveCurrentBoard,
    saveBoard,
    createNewBoard,
    deleteBoard,
    setBoardData,

    refreshBoards,
  };
});

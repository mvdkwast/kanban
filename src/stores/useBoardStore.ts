import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { BoardData } from '../types';
import { storage } from '../services/storage';
import { useRouter } from '../services/router';

export const useBoardStore = defineStore('board', () => {
  const { navigate } = useRouter();
  
  // State
  const boards = ref<BoardData[]>([]);
  const currentBoardId = ref<string>('');
  const isInitialized = ref(false);
  const isLoadingBoard = ref(false);

  // Getters
  const currentBoard = computed(() => 
    boards.value.find(board => board.id === currentBoardId.value)
  );

  const hasMultipleBoards = computed(() => boards.value.length > 1);

  // Actions
  const initializeStorage = async () => {
    try {
      await storage.init();
      await storage.migrateFromLocalStorage();
      
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

  const loadBoard = async (boardId: string): Promise<BoardData | null> => {
    console.log('loadBoard called with:', boardId);
    console.log('Current isLoadingBoard:', isLoadingBoard.value);
    
    if (isLoadingBoard.value) {
      console.log('Already loading board, returning null');
      return null;
    }
    
    isLoadingBoard.value = true;
    
    try {
      console.log('Fetching board data from storage...');
      const boardData = await storage.getBoard(boardId);
      console.log('Board data retrieved:', boardData);
      
      if (boardData) {
        console.log('Setting currentBoardId from', currentBoardId.value, 'to', boardData.id);
        currentBoardId.value = boardData.id;
        return boardData;
      } else {
        console.log('Board not found, redirecting to first available board');
        // Board not found, redirect to first available board
        const allBoards = await storage.getAllBoards();
        if (allBoards.length > 0) {
          console.log('Navigating to first available board:', allBoards[0].id);
          navigate(allBoards[0].id);
          return allBoards[0];
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to load board:', error);
      return null;
    } finally {
      isLoadingBoard.value = false;
      console.log('loadBoard finished, isLoadingBoard:', isLoadingBoard.value);
    }
  };

  const saveBoard = async (title: string, cards: any[], focusedCardId?: string): Promise<string> => {
    try {
      const newBoardId = await storage.saveBoard(title, cards, currentBoardId.value, focusedCardId);
      
      // Update URL if board slug changed
      if (newBoardId !== currentBoardId.value) {
        currentBoardId.value = newBoardId;
        navigate(newBoardId);
      }
      
      // Refresh boards list
      if (!isLoadingBoard.value) {
        boards.value = await storage.getAllBoards();
      }
      
      return newBoardId;
    } catch (error) {
      console.error('Failed to save board:', error);
      throw error;
    }
  };

  const createNewBoard = async (): Promise<string> => {
    console.log('Creating new board...');
    
    try {
      // Create the board without setting isLoadingBoard
      const newBoardId = await storage.saveBoard('New Board', []);
      
      console.log('New board created with ID:', newBoardId);
      
      // Refresh boards list
      boards.value = await storage.getAllBoards();
      console.log('Refreshed boards list, count:', boards.value.length);
      
      // Navigate to the new board - this will trigger the route watcher
      navigate(newBoardId);
      console.log('Navigated to new board');
      
      return newBoardId;
    } catch (error) {
      console.error('Failed to create new board:', error);
      throw error;
    }
  };

  const deleteBoard = async (boardId: string): Promise<void> => {
    if (isLoadingBoard.value) return;
    
    try {
      isLoadingBoard.value = true;
      await storage.deleteBoard(boardId);
      
      // Refresh boards list
      boards.value = await storage.getAllBoards();
      
      // If we deleted the current board, switch to the most recent one
      if (boardId === currentBoardId.value) {
        if (boards.value.length > 0) {
          navigate(boards.value[0].id);
        } else {
          // No boards left, create a new default one
          const newBoardId = await storage.saveBoard('Kanban Board', []);
          boards.value = await storage.getAllBoards();
          navigate(newBoardId);
        }
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
      throw error;
    } finally {
      isLoadingBoard.value = false;
    }
  };

  const switchToBoard = (boardId: string) => {
    navigate(boardId);
  };

  const getNextBoard = (): string | null => {
    if (boards.value.length <= 1) return null;
    const currentIndex = boards.value.findIndex(b => b.id === currentBoardId.value);
    const nextIndex = (currentIndex + 1) % boards.value.length;
    return boards.value[nextIndex].id;
  };

  const getPrevBoard = (): string | null => {
    if (boards.value.length <= 1) return null;
    const currentIndex = boards.value.findIndex(b => b.id === currentBoardId.value);
    const prevIndex = (currentIndex - 1 + boards.value.length) % boards.value.length;
    return boards.value[prevIndex].id;
  };

  return {
    // State
    boards,
    currentBoardId,
    isInitialized,
    isLoadingBoard,
    
    // Getters
    currentBoard,
    hasMultipleBoards,
    
    // Actions
    initializeStorage,
    loadBoard,
    saveBoard,
    createNewBoard,
    deleteBoard,
    switchToBoard,
    getNextBoard,
    getPrevBoard,
  };
});

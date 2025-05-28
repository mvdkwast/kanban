import { defineStore } from 'pinia';
import { ref, computed, watch, nextTick } from 'vue';
import { watchDebounced } from '@vueuse/core';
import type { Card, Column, CardPosition } from '../types';
import { TaskManager } from '../services/TaskManager';
import { useBoardStore } from './useBoardStore';
import { useFilter } from '../composables/useFilter';
import { emitter } from '../services/events';

export const useKanbanStore = defineStore('kanban', () => {
  const boardStore = useBoardStore();
  const {searchText, selectedTags} = useFilter();
  
  // Define columns
  const columns: Column[] = [
    { id: 'idea', title: 'idea' },
    { id: 'todo', title: 'todo' },
    { id: 'doing', title: 'doing' },
    { id: 'done', title: 'done' },
    { id: 'delete', title: 'delete' }
  ];

  // State
  const boardTitle = ref('Kanban Board');
  const cards = ref<Card[]>([]);
  const focusedCardId = ref<string | null>(null);
  const temporaryVisibleCardId = ref<string | null>(null);
  const cardPositions = ref<Record<string, CardPosition>>({});

  // Getters
  const allTags = computed(() => TaskManager.getAllTags(cards.value));

  watch(allTags, (newTags) => {
    emitter.emit('tags:updated', newTags);
  }, { immediate: true });

  emitter.on('mode:enter', (mode) => {
    if (!mode || mode === 'navigation') {
      smartFocusCard();
    }
  });

  const visibleCards = computed(() => {
    const filtered = TaskManager.getVisibleCards(cards.value, selectedTags.value, searchText.value);

    console.log('visibleCards computed:', {
      totalCards: cards.value.length,
      filteredCards: filtered.length,
      selectedTags: selectedTags.value,
      searchText: searchText.value,
      temporaryVisibleCardId: temporaryVisibleCardId.value
    });

    // If there's a temporary card that should be visible, add it
    if (temporaryVisibleCardId.value) {
      const tempCard = cards.value.find(c => c.id === temporaryVisibleCardId.value);
      if (tempCard && !filtered.some(c => c.id === temporaryVisibleCardId.value)) {
        filtered.push(tempCard);
        console.log('Added temporary card to visible cards:', tempCard);
      }
    }

    return filtered;
  });

  const getColumnCards = (columnId: string) => {
    return TaskManager.getColumnCards(visibleCards.value, columnId);
  };

  // Actions
  const initializeBoard = (title: string, boardCards: Card[], savedFocusedCardId?: string) => {
    console.log('initializeBoard called with:', { title, cardCount: boardCards.length, savedFocusedCardId });
    
    boardTitle.value = title;
    cards.value = boardCards || [];
    temporaryVisibleCardId.value = null;
    cardPositions.value = {};
    
    // Reset filters when switching boards
    emitter.emit('filter:reset');
    
    // Reset scroll to top first
    window.scrollTo(0, 0);
    
    // Set focused card from saved state or find the best card to focus
    if (savedFocusedCardId && cards.value.some(c => c.id === savedFocusedCardId)) {
      focusedCardId.value = savedFocusedCardId;
    } else {
      // Fallback: focus the top card in the leftmost non-empty column
      let foundCard = false;
      for (const column of columns) {
        if (column.id === 'delete') continue; // Skip delete column
        const columnCards = TaskManager.getColumnCards(cards.value, column.id);
        if (columnCards.length > 0) {
          focusedCardId.value = columnCards[0].id;
          foundCard = true;
          break;
        }
      }
      if (!foundCard) {
        focusedCardId.value = null;
      }
    }
    
    // Scroll to focused card after DOM updates
    if (focusedCardId.value) {
      // long than usual delay to ensure DOM is fully rendered
      TaskManager.bringCardIntoView(focusedCardId.value, 100);
    }
    
    console.log('Board initialized. Cards in store:', cards.value.length, 'Focused card:', focusedCardId.value);
  };

  const addCard = (columnId: string, beforeIndex: number | null = null) => {
    console.log('addCard called with:', { columnId, beforeIndex, selectedTags: selectedTags.value });
    
    const initialContent = selectedTags.value.length > 0
      ? '\n' + selectedTags.value.join(' ')
      : 'New task';

    const newCard: Card = {
      id: Date.now().toString(),
      content: initialContent,
      columnId,
      isNew: true
    };

    const insertIndex = beforeIndex !== null ? beforeIndex : cards.value.length;
    cards.value.splice(insertIndex, 0, newCard);

    console.log('Card added:', newCard);
    console.log('Total cards after add:', cards.value.length);

    temporaryVisibleCardId.value = newCard.id;
    focusedCardId.value = newCard.id;
  };

  const updateCard = (cardId: string, content: string) => {
    const cardIndex = cards.value.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      cards.value[cardIndex] = {
        ...cards.value[cardIndex],
        content,
        isNew: false
      };
    }

    if (temporaryVisibleCardId.value === cardId) {
      temporaryVisibleCardId.value = null;
    }
  };

  const deleteCard = (cardId: string) => {
    const cardToDelete = cards.value.find(c => c.id === cardId);
    if (!cardToDelete) return;

    // Remove the card
    cards.value = cards.value.filter(c => c.id !== cardId);
    
    // Clear temporary visibility if this was the temporary card
    if (temporaryVisibleCardId.value === cardId) {
      temporaryVisibleCardId.value = null;
    }

    // Clean up card positions
    delete cardPositions.value[cardId];
    cleanupCardPositions();

    // Use smart focus to find the best card to focus
    smartFocusCard();
  };

  const wouldMoveCard = (cardId: string, targetColumnId: string, targetCardId: string | null = null): boolean => {
    const card = cards.value.find(c => c.id === cardId);
    if (!card) return false;
    
    // Different column = definitely a move
    if (card.columnId !== targetColumnId) return true;
    
    // Same column, check position
    const cardIndex = cards.value.findIndex(c => c.id === cardId);
    
    if (targetCardId) {
      const targetIndex = cards.value.findIndex(c => c.id === targetCardId);
      // Would insert before target, so it's not a move if:
      // - Card is already right before target (cardIndex + 1 === targetIndex)
      // - Card is the target itself (impossible due to UI logic but check anyway)
      return cardIndex + 1 !== targetIndex && cardId !== targetCardId;
    } else {
      // Append to end - check if already last in column
      const cardsInColumn = cards.value.filter(c => c.columnId === targetColumnId);
      const lastCardInColumn = cardsInColumn[cardsInColumn.length - 1];
      return !lastCardInColumn || lastCardInColumn.id !== cardId;
    }
  };
  
  const moveCard = (cardId: string, targetColumnId: string, targetCardId: string | null = null) => {
    const cardIndex = cards.value.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    
    // Check if this would actually move the card
    if (!wouldMoveCard(cardId, targetColumnId, targetCardId)) {
      return;
    }

    const [movedCard] = cards.value.splice(cardIndex, 1);
    movedCard.columnId = targetColumnId;

    if (targetCardId) {
      const insertIndex = cards.value.findIndex(c => c.id === targetCardId);
      cards.value.splice(insertIndex, 0, movedCard);
    } else {
      // Insert at end of target column
      let lastIndex = -1;
      for (let i = cards.value.length - 1; i >= 0; i--) {
        if (cards.value[i].columnId === targetColumnId) {
          lastIndex = i;
          break;
        }
      }
      if (lastIndex === -1) {
        cards.value.unshift(movedCard);
      } else {
        cards.value.splice(lastIndex + 1, 0, movedCard);
      }
    }
    
    // Force position updates after move
    nextTick(() => {
      cleanupCardPositions();
    });
  };

  const completeCard = (cardId: string) => {
    const currentCard = cards.value.find(c => c.id === cardId);
    if (!currentCard) return;

    const currentColumnId = currentCard.columnId;
    const currentColumnIndex = columns.findIndex(col => col.id === currentColumnId);
    const targetColumnIndex = Math.min(currentColumnIndex + 1, columns.length - 2);

    if (targetColumnIndex === currentColumnIndex) {
      return;
    }

    // Determine the card to focus after moving before moving
    const cardsInCurrentColumn = visibleCards.value.filter(c => c.columnId === currentColumnId);
    const currentCardIndex = cardsInCurrentColumn.findIndex(c => c.id === cardId);

    let nextCardId: string | null = null;

    // check if column is not empty after we're moving the card (at this time the card is still in the current column)
    if (cardsInCurrentColumn.length > 1) {
      console.log(`Current column "${currentColumnId}" has ${cardsInCurrentColumn.length} cards. Current card index: ${currentCardIndex}`);
      if (currentCardIndex < cardsInCurrentColumn.length - 2) {
        // Try to focus the card to the card after the current one
        nextCardId = cardsInCurrentColumn[currentCardIndex + 1].id;
      }
      else if (currentCardIndex > 0) {
        // If we're at the last card, focus the previous one
        nextCardId = cardsInCurrentColumn[currentCardIndex - 1].id;
      }
      else {
        console.error('The developer messed up its index calculations, please report this issue.');
      }
    } else {
      // No cards left in source column, find first non-empty column to the left
      let foundCard = false;
      for (let i = currentColumnIndex - 1; i >= 0; i--) {
        const columnCards = visibleCards.value.filter(c => c.columnId === columns[i].id);
        if (columnCards.length > 0) {
          nextCardId = columnCards[0].id;
          foundCard = true;
          break;
        }
      }

      // If no cards to the left, try columns to the right
      if (!foundCard) {
        for (let i = currentColumnIndex + 1; i < columns.length - 1; i++) {
          const columnCards = visibleCards.value.filter(c => c.columnId === columns[i].id);

          // special case for the directly next column : if it is empty, that means that our card will be the first
          // one there, so we can just focus the first card in the next column
          if (i === targetColumnIndex && columnCards.length === 0) {
              nextCardId = cardId;
              break;
          }

          if (columnCards.length > 0) {
            nextCardId = columnCards[0].id;
            break;
          }
        }
      }
    }


    // Move the card to the end of the next column
    const targetColumnId = columns[targetColumnIndex].id;
    const targetColumnTitle = columns[targetColumnIndex].title;
    moveCard(cardId, targetColumnId, null);

    // Emit completion event
    emitter.emit('card:completed', targetColumnTitle);

    // Handle focus after move
    focusCard(nextCardId);
  };

  const clearColumn = (columnId: string) => {
    if (!confirm(`Are you sure you want to clear all cards from the ${columnId} column?`)) {
      return;
    }

    cards.value = cards.value.filter(card => card.columnId !== columnId);

    const focusedCard = cards.value.find(c => c.id === focusedCardId.value);
    if (focusedCard && focusedCard.columnId === columnId) {
      const remainingVisibleCards = visibleCards.value.filter(c => c.columnId !== columnId);
      focusedCardId.value = remainingVisibleCards.length > 0 ? remainingVisibleCards[0].id : null;
    }
  };

  const reportCardPosition = (id: string, pos: CardPosition) => {
    cardPositions.value[id] = pos;
  };
  
  // Clean up positions for cards that no longer exist or are not visible
  const cleanupCardPositions = () => {
    const visibleIds = new Set(visibleCards.value.map(c => c.id));
    for (const id in cardPositions.value) {
      if (!visibleIds.has(id)) {
        delete cardPositions.value[id];
      }
    }
  };


  const focusCard = (cardId: string | null, scroll: boolean = true) => {
    if (cardId === null) {
      console.warn('focusCard called with null, clearing focus');
    }

    focusedCardId.value = cardId;
    if (scroll) {
      TaskManager.bringCardIntoView(cardId);
    }
  };

  const updateBoardTitle = (title: string) => {
    boardTitle.value = title;
  };
  
  const editCard = (cardId: string) => {
    // Emit a custom event that the card component can listen to
    const event = new CustomEvent('edit-card', { 
      detail: { cardId },
      bubbles: true 
    });
    document.dispatchEvent(event);
  };

  // smart focus logic to focus a card after focus is regained
  const smartFocusCard = () => {
    setTimeout(() => {
      const bestCardId = TaskManager.findBestCardToFocus(visibleCards.value, columns, focusedCardId.value);
      if (bestCardId) {
        focusedCardId.value = bestCardId;
        TaskManager.bringCardIntoView(focusedCardId.value);
      }
    }, 0);
  }

  const editFocusedCard = () => {
    if (focusedCardId.value) {
      editCard(focusedCardId.value);
    }
  };

  // Watch for visible cards changes to trigger position cleanup
  watch(visibleCards, () => {
    nextTick(() => {
      cleanupCardPositions();
    });
  });
  
  // Auto-save board when cards, title, or focus changes
  watchDebounced([cards, boardTitle, focusedCardId], async ([newCards, newTitle, newFocusedCardId]) => {
    if (boardStore.isInitialized && boardStore.currentBoardId && !boardStore.isLoadingBoard) {
      try {
        console.log('Auto-saving board:', newTitle, 'with', newCards.length, 'cards', 'focused:', newFocusedCardId);
        await boardStore.saveBoard(newTitle, newCards, newFocusedCardId || undefined);
      } catch (error) {
        console.error('Failed to save board:', error);
      }
    }
  }, { 
    debounce: 300,
    deep: true 
  });

  return {
    // Static data
    columns,
    
    // State
    boardTitle,
    cards,
    focusedCardId,
    temporaryVisibleCardId,
    cardPositions,

    // Getters
    allTags,
    visibleCards,
    getColumnCards,
    
    // Actions
    initializeBoard,
    addCard,
    updateCard,
    deleteCard,
    wouldMoveCard,
    moveCard,
    completeCard,
    clearColumn,
    reportCardPosition,
    focusCard,
    updateBoardTitle,
    editCard,
    editFocusedCard,
  };
});

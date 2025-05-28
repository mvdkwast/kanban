import { useKanbanStore } from '../stores/useKanbanStore';
import { TaskManager } from './TaskManager';
import { emitter } from './events';
import type {Card, Column} from '../types';

export function createNavigationKeyboardHandler() {
  return (e: KeyboardEvent): void => {
    const kanbanStore = useKanbanStore();

    // Mode switching keys (no modifiers)
    if (e.key === '/') {
      e.preventDefault();
      emitter.emit('mode:enter', 'search');
      return;
    } else if (e.key === '#') {
      e.preventDefault();
      emitter.emit('mode:enter', 'tag-selection');
      return;
    }

    // Insert: Add a new card
    if (e.key === 'Insert') {
      e.preventDefault();
      if (kanbanStore.focusedCardId) {
        const currentCard = kanbanStore.visibleCards.find((c: Card) => c.id === kanbanStore.focusedCardId);
        if (currentCard) {
          const cardIndex = kanbanStore.cards.findIndex(c => c.id === kanbanStore.focusedCardId);
          kanbanStore.addCard(currentCard.columnId, cardIndex);
        }
        else {
          console.warn(`Focused card with ID ${kanbanStore.focusedCardId} not found.`);
        }
      }
      else {
        // If no focused card, add to the first column
        const firstColumn = kanbanStore.columns[0];
        kanbanStore.addCard(firstColumn.id);
      }
    }

    // All actions below require a focused card

    if (!kanbanStore.focusedCardId) {
      return;
    }

    const currentCard = kanbanStore.visibleCards.find((c: Card) => c.id === kanbanStore.focusedCardId);
    if (!currentCard) return;

    const currentColumnIndex = kanbanStore.columns.findIndex((col: Column) => col.id === currentCard.columnId);
    const columnVisibleCards = kanbanStore.visibleCards.filter((c: Card) => c.columnId === currentCard.columnId);
    const currentIndex = columnVisibleCards.findIndex((c: Card) => c.id === kanbanStore.focusedCardId);

    // Left/Right: Navigate between columns
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.ctrlKey && !e.altKey) {
      e.preventDefault();

      const increment = (e.key === 'ArrowRight' ? 1 : -1);
      let targetColumnIndex = currentColumnIndex + increment;

      let targetColumnCards: any[] = [];
      let targetColumnId: string | undefined;

      for (; targetColumnIndex >= 0 && targetColumnIndex < kanbanStore.columns.length - 1; targetColumnIndex += increment) {
        const columnId = kanbanStore.columns[targetColumnIndex].id;
        const colCards = kanbanStore.visibleCards.filter(c => c.columnId === columnId);

        if (colCards.length) {
          targetColumnCards = colCards;
          targetColumnId = columnId;
          break;
        }
      }

      if (!targetColumnId || !targetColumnCards.length) return;

      // Wait for positions to be updated after any filtering changes
      const currentPos = kanbanStore.cardPositions[kanbanStore.focusedCardId!];

      if (currentPos) {
        const targetCard = TaskManager.findCardInColumnAtY(
            targetColumnCards,
            kanbanStore.cardPositions,
            currentPos.top,
            currentPos.bottom
        );

        if (targetCard) {
          kanbanStore.focusCard(targetCard.id);
        } else {
          // Fallback to closest index
          const targetIndex = Math.min(currentIndex, targetColumnCards.length - 1);
          kanbanStore.focusCard(targetColumnCards[targetIndex].id);
        }
      } else {
        // No position data, use index-based navigation
        const targetIndex = Math.min(currentIndex, targetColumnCards.length - 1);
        kanbanStore.focusCard(targetColumnCards[targetIndex].id);
      }
    }

    // Ctrl+Left/Right: Move card between columns
    else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.ctrlKey && !e.altKey) {
      e.preventDefault();

      const targetColumnIndex = currentColumnIndex + (e.key === 'ArrowRight' ? 1 : -1);
      if (targetColumnIndex < 0 || targetColumnIndex >= kanbanStore.columns.length - 1) return;

      const targetColumnId = kanbanStore.columns[targetColumnIndex].id;
      const visibleCardsInTarget = kanbanStore.visibleCards.filter(c => c.columnId === targetColumnId);

      // Get current position before move
      const currentPos = kanbanStore.cardPositions[kanbanStore.focusedCardId!];

      // Use position to determine where to insert
      if (currentPos && visibleCardsInTarget.length > 0) {
        // Wait a bit for positions to stabilize
        setTimeout(() => {
          // Find best card for insertion using overlap algorithm
          const targetCard = TaskManager.findCardInColumnAtY(
              visibleCardsInTarget,
              kanbanStore.cardPositions,
              currentPos.top,
              currentPos.bottom
          );

          let targetCardId: string | null = null;

          if (targetCard) {
            // Smart insertion logic:
            // - If source overlaps/is above target → insert before target
            // - If source is substantially below target → append to end
            const targetCardHeight = targetCard.bottom - targetCard.top;
            const threshold = targetCardHeight * 0.5;

            const sourceIsMostlyBelow = currentPos.bottom > targetCard.bottom + threshold;

            if (sourceIsMostlyBelow) {
              // Source card is mostly below the best match → append to end
              targetCardId = null;
            } else {
              // Source card overlaps or is above → insert before the match
              targetCardId = targetCard.id;
            }
          }

          kanbanStore.moveCard(kanbanStore.focusedCardId!, targetColumnId, targetCardId);
          TaskManager.bringCardIntoView(kanbanStore.focusedCardId);
        }, 100); // Increased timeout for position stability
      } else {
        // Fallback: move to end of column if no position data or empty column
        kanbanStore.moveCard(kanbanStore.focusedCardId!, targetColumnId, null);
        TaskManager.bringCardIntoView(kanbanStore.focusedCardId);
      }
    }

    // Up/Down: Navigate within column
    else if (e.key === 'ArrowUp' && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (currentIndex > 0) {
        kanbanStore.focusCard(columnVisibleCards[currentIndex - 1].id);
      }
    } else if (e.key === 'ArrowDown' && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (currentIndex < columnVisibleCards.length - 1) {
        kanbanStore.focusCard(columnVisibleCards[currentIndex + 1].id);
      }
    }

    // Ctrl+Up/Down: Move card within column
    else if (e.key === 'ArrowUp' && e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (currentIndex > 0) {
        const targetId = columnVisibleCards[currentIndex - 1].id;
        const cardIndex = kanbanStore.cards.findIndex(c => c.id === kanbanStore.focusedCardId);
        const targetIndex = kanbanStore.cards.findIndex(c => c.id === targetId);

        if (cardIndex !== -1 && targetIndex !== -1) {
          const [card] = kanbanStore.cards.splice(cardIndex, 1);
          kanbanStore.cards.splice(targetIndex, 0, card);
          TaskManager.bringCardIntoView(kanbanStore.focusedCardId);
        }
      }
    } else if (e.key === 'ArrowDown' && e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (currentIndex < columnVisibleCards.length - 1) {
        const targetId = columnVisibleCards[currentIndex + 1].id;
        const cardIndex = kanbanStore.cards.findIndex(c => c.id === kanbanStore.focusedCardId);
        const targetIndex = kanbanStore.cards.findIndex(c => c.id === targetId);

        if (cardIndex !== -1 && targetIndex !== -1) {
          const [card] = kanbanStore.cards.splice(cardIndex, 1);
          const insertAt = cardIndex < targetIndex ? targetIndex : targetIndex + 1;
          kanbanStore.cards.splice(insertAt, 0, card);
          TaskManager.bringCardIntoView(kanbanStore.focusedCardId);
        }
      }
    }

    // Home/End: Jump to first/last card in column
    else if (e.key === 'Home' && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      kanbanStore.focusCard(columnVisibleCards[0].id);
    } else if (e.key === 'End' && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      kanbanStore.focusCard(columnVisibleCards[columnVisibleCards.length - 1].id);
    }

    // Ctrl+Home/End: Move card to first/last position in column
    else if (e.key === 'Home' && e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (columnVisibleCards.length > 1) {
        const cardIndex = kanbanStore.cards.findIndex(c => c.id === kanbanStore.focusedCardId);
        if (cardIndex !== -1) {
          const [card] = kanbanStore.cards.splice(cardIndex, 1);

          // Find the first card in the column
          const firstCardInColumn = kanbanStore.cards.find(c => c.columnId === currentCard.columnId);
          const firstCardIndex = firstCardInColumn ? kanbanStore.cards.indexOf(firstCardInColumn) : -1;

          // Insert at the beginning of the column
          kanbanStore.cards.splice(firstCardIndex !== -1 ? firstCardIndex : 0, 0, card);
          TaskManager.bringCardIntoView(kanbanStore.focusedCardId);
        }
      }
    } else if (e.key === 'End' && e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (columnVisibleCards.length > 1) {
        const cardIndex = kanbanStore.cards.findIndex(c => c.id === kanbanStore.focusedCardId);
        if (cardIndex !== -1) {
          const [card] = kanbanStore.cards.splice(cardIndex, 1);

          // Find the last card in the column
          const columnCards = kanbanStore.cards.filter(c => c.columnId === currentCard.columnId);
          const lastCardInColumn = columnCards.length > 0 ? columnCards[columnCards.length - 1] : null;
          const lastCardIndex = lastCardInColumn ? kanbanStore.cards.indexOf(lastCardInColumn) : -1;

          // Insert at the end of the column
          kanbanStore.cards.splice(lastCardIndex !== -1 ? lastCardIndex + 1 : kanbanStore.cards.length, 0, card);
          TaskManager.bringCardIntoView(kanbanStore.focusedCardId);
        }
      }
    }

    // Enter/Space/F2: Edit the current card
    else if ((e.key === 'Enter' || e.key === ' ' || e.key === 'F2') &&
        !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      kanbanStore.editCard(currentCard.id);
    }

    // Delete: Delete the current card
    else if (e.key === 'Delete') {
      e.preventDefault();
      if (confirm('Are you sure you want to delete this card?')) {
        kanbanStore.deleteCard(kanbanStore.focusedCardId!);
      }
    }

    // Ctrl+Enter: Complete card
    else if (e.key === 'Enter' && e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      kanbanStore.completeCard(kanbanStore.focusedCardId!);
    }
  };
}
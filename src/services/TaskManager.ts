import type { Card, Column, CardPosition } from '../types';
import { extractTags } from '../utils';

export class TaskManager {
  /**
   * Filters cards based on tags and search text
   */
  static getVisibleCards(
    cards: Card[],
    selectedTags: string[],
    searchText: string
  ): Card[] {
    // First filter by tags
    const tagFilteredCards = cards.filter(card => {
      if (selectedTags.length === 0) return true;
      const cardTags = extractTags(card.content);
      return selectedTags.every(tag => cardTags.includes(tag));
    });

    // Then filter by search text
    if (!searchText) return tagFilteredCards;
    
    return tagFilteredCards.filter(card => 
      card.content.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  /**
   * Find the best card in a target column for horizontal navigation
   * Uses a 3-phase algorithm: overlap priority, center distance, edge cases
   */
  static findCardInColumnAtY(
    cardsInTargetColumn: Card[],
    cardPositions: Record<string, CardPosition>,
    sourceTop: number,
    sourceBottom: number
  ) {
    // Get positions only for cards in the target column
    const positions = cardsInTargetColumn
      .map(card => {
        const pos = cardPositions[card.id];
        return pos ? { id: card.id, ...pos } : null;
      })
      .filter(pos => pos !== null)
      .sort((a, b) => a!.top - b!.top);

    if (positions.length === 0) return null;
    
    const sourceCenter = (sourceTop + sourceBottom) / 2;
    
    // Phase 1: Find cards with vertical overlap
    const overlappingCards = positions
      .map(pos => {
        if (!pos) return null;
        // Calculate overlap: max(0, min(sourceBottom, targetBottom) - max(sourceTop, targetTop))
        const overlap = Math.max(0, Math.min(sourceBottom, pos.bottom) - Math.max(sourceTop, pos.top));
        return overlap > 0 ? { ...pos, overlap } : null;
      })
      .filter(card => card !== null)
      .sort((a, b) => b!.overlap - a!.overlap); // Sort by overlap amount, largest first
    
    // If we have overlapping cards, return the one with most overlap
    if (overlappingCards.length > 0) {
      return overlappingCards[0];
    }
    
    // Phase 2: No overlap, find card with center closest to source center
    let bestCard = positions[0];
    let minCenterDistance = Math.abs((bestCard!.top + bestCard!.bottom) / 2 - sourceCenter);
    
    for (const pos of positions) {
      if (!pos) continue;
      const targetCenter = (pos.top + pos.bottom) / 2;
      const centerDistance = Math.abs(targetCenter - sourceCenter);
      
      if (centerDistance < minCenterDistance) {
        bestCard = pos;
        minCenterDistance = centerDistance;
      }
    }
    
    return bestCard;
  }

  /**
   * Find the most appropriate card to focus after a filtering operation
   */
  static findBestCardToFocus(
    visibleCards: Card[],
    columns: Column[],
    currentFocusedCardId: string | null
  ): string | null {
    // If the currently focused card is still visible, keep it focused
    const currentlyFocusedCard = visibleCards.find(card => card.id === currentFocusedCardId);
    if (currentlyFocusedCard) {
      return currentlyFocusedCard.id;
    }
    
    // Otherwise, focus the first visible card in the first non-empty column
    for (const column of columns) {
      const cardsInColumn = visibleCards.filter(card => card.columnId === column.id);
      if (cardsInColumn.length > 0) {
        return cardsInColumn[0].id;
      }
    }
    
    return null;
  }

  /**
   * Scroll to a card element if it's not fully visible
   */
  static bringCardIntoView(cardId: string | null, timeout = 0): void {
    if (!cardId) {
      // can happen because we typically call this in a setTimeout, and reactive state may change
      return;
    }

    setTimeout(() => {

      const element = document.querySelector(`[data-card-id="${cardId}"]`);
      if (!element) {
        console.debug(`Could not scroll to card with ID ${cardId}: not found in DOM`);
        return;
      }

      // Get element and viewport rects
      const elRect = element.getBoundingClientRect();

      // Buffer values for top and bottom
      const headerHeight = 150;
      const footerBuffer = 100;

      // Only scroll if the card is out of view
      if (elRect.top < headerHeight) {
        window.scrollBy({top: elRect.top - headerHeight, behavior: 'smooth'});
      } else if (elRect.bottom > window.innerHeight - footerBuffer) {
        window.scrollBy({
          top: elRect.bottom - (window.innerHeight - footerBuffer),
          behavior: 'smooth'
        });
      }
    }, timeout);
  }

  /**
   * Get all unique tags from cards
   */
  static getAllTags(cards: Card[]): string[] {
    const tags = new Set<string>();
    cards.forEach(card => {
      extractTags(card.content).forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Get cards for a specific column after filtering
   */
  static getColumnCards(visibleCards: Card[], columnId: string): Card[] {
    return visibleCards.filter(card => card.columnId === columnId);
  }
}

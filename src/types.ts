export type Modes = 'search' | 'tag-selection' | 'navigation';

export interface Card {
  id: string;
  content: string;
  columnId: string;
  isNew?: boolean;
}

export interface Column {
  id: string;
  title: string;
}

export interface CardPosition {
  top: number;
  bottom: number;
  columnId: string;
}

export interface BoardData {
  id: string; // URL slug
  title: string;
  cards: Card[];
  lastModified: Date;
  focusedCardId?: string;
}

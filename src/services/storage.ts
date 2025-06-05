import type {BoardData} from '../types';
import {generateSlug} from "../services/slug.ts";

class StorageManager {
  private dbName = 'kanban-boards';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('boards')) {
          db.createObjectStore('boards', { keyPath: 'id' });
        }
      };
    });
  }


  async saveBoard(boardData: BoardData): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    let finalTitle = boardData.title;
    let newSlug = generateSlug(finalTitle);
    
    // Check for name conflicts (only if this is a new board or title changed)
    if (!boardData.id || boardData.id !== newSlug) {
      const existingBoard = await this.getBoard(newSlug);
      if (existingBoard) {
        // Find a unique name by adding numbers
        let counter = 2;
        while (true) {
          const testTitle = `${boardData.title} ${counter}`;
          const testSlug = generateSlug(testTitle);
          const testBoard = await this.getBoard(testSlug);
          if (!testBoard) {
            finalTitle = testTitle;
            newSlug = testSlug;
            break;
          }
          counter++;
        }
      }
    }
    
    // If slug changed and we're updating an existing board, delete old record
    if (boardData.id && boardData.id !== newSlug) {
      await this.deleteBoard(boardData.id);
    }

    // Ensure cards are plain objects that can be cloned
    const serializableCards = boardData.cards.map(card => ({
      id: card.id,
      content: card.content,
      columnId: card.columnId,
      isNew: card.isNew || false
    }));

    const serializableBoard: BoardData = {
      id: newSlug,
      title: finalTitle,
      cards: serializableCards,
      lastModified: new Date(),
      focusedCardId: boardData.focusedCardId
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boards'], 'readwrite');
      const store = transaction.objectStore('boards');
      const request = store.put(serializableBoard);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (boardData.title !== finalTitle) {
            console.warn(`Board title changed from "${boardData.title}" to "${finalTitle}" due to slug conflict.`);
        }
        resolve(newSlug);
      }
    });
  }

  async getBoard(id: string): Promise<BoardData | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boards'], 'readonly');
      const store = transaction.objectStore('boards');
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllBoards(): Promise<BoardData[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boards'], 'readonly');
      const store = transaction.objectStore('boards');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const boards = request.result || [];
        // Sort alphabetically by title for stable ordering
        boards.sort((a, b) => a.title.localeCompare(b.title));
        resolve(boards);
      };
    });
  }

  async deleteBoard(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boards'], 'readwrite');
      const store = transaction.objectStore('boards');
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

}

export const storage = new StorageManager();

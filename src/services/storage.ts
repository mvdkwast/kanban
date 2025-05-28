import type { Card, BoardData } from '../types';

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

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled';
  }

  async saveBoard(title: string, cards: Card[], currentId?: string, focusedCardId?: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    let finalTitle = title;
    let newSlug = this.generateSlug(finalTitle);
    
    // Check for name conflicts (only if this is a new board or title changed)
    if (!currentId || currentId !== newSlug) {
      const existingBoard = await this.getBoard(newSlug);
      if (existingBoard) {
        // Find a unique name by adding numbers
        let counter = 2;
        while (true) {
          const testTitle = `${title} ${counter}`;
          const testSlug = this.generateSlug(testTitle);
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
    if (currentId && currentId !== newSlug) {
      await this.deleteBoard(currentId);
    }

    // Ensure cards are plain objects that can be cloned
    const serializableCards = cards.map(card => ({
      id: card.id,
      content: card.content,
      columnId: card.columnId,
      isNew: card.isNew || false
    }));

    const boardData: BoardData = {
      id: newSlug,
      title: finalTitle,
      cards: serializableCards,
      lastModified: new Date(),
      focusedCardId
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boards'], 'readwrite');
      const store = transaction.objectStore('boards');
      const request = store.put(boardData);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(newSlug);
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

  // Migration from localStorage (called once on app start)
  async migrateFromLocalStorage(): Promise<void> {
    const oldData = localStorage.getItem('kanbanData');
    if (oldData) {
      try {
        const parsed = JSON.parse(oldData);
        const title = parsed.title || 'Kanban Board';
        const cards = parsed.cards || [];
        
        // Save as new board
        await this.saveBoard(title, cards);
        
        // Remove old localStorage data
        localStorage.removeItem('kanbanData');
      } catch (e) {
        console.error('Failed to migrate from localStorage:', e);
      }
    }
  }
}

export const storage = new StorageManager();

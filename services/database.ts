
import { Note, ThemeColor, Category, ViewMode } from '../types';

const DB_NAME = 'SmartNotesDB';
const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_SETTINGS = 'settings';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Práce', color: 'bg-indigo-500' },
  { id: '2', name: 'Osobní', color: 'bg-emerald-500' },
  { id: '3', name: 'Nápady', color: 'bg-amber-500' },
  { id: '4', name: 'Nákup', color: 'bg-rose-500' }
];

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NOTES)) {
          db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
      };
    });
  }

  async getAllNotes(): Promise<Note[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NOTES, 'readonly');
      const store = transaction.objectStore(STORE_NOTES);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveNotes(notes: Note[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NOTES, 'readwrite');
      const store = transaction.objectStore(STORE_NOTES);
      
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        notes.forEach(note => store.add(note));
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('categories');
      request.onsuccess = () => resolve(request.result || DEFAULT_CATEGORIES);
      request.onerror = () => resolve(DEFAULT_CATEGORIES);
    });
  }

  async saveCategories(categories: Category[]): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(STORE_SETTINGS, 'readwrite');
    transaction.objectStore(STORE_SETTINGS).put(categories, 'categories');
  }

  async getNickname(): Promise<string> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('nickname');
      request.onsuccess = () => resolve(request.result || '');
      request.onerror = () => resolve('');
    });
  }

  async saveNickname(nickname: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(STORE_SETTINGS, 'readwrite');
    transaction.objectStore(STORE_SETTINGS).put(nickname, 'nickname');
  }

  async getTheme(): Promise<ThemeColor> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('theme');
      request.onsuccess = () => resolve(request.result || 'blue');
      request.onerror = () => resolve('blue');
    });
  }

  async saveTheme(theme: ThemeColor): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(STORE_SETTINGS, 'readwrite');
    transaction.objectStore(STORE_SETTINGS).put(theme, 'theme');
  }

  async getViewMode(): Promise<ViewMode> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('viewMode');
      request.onsuccess = () => resolve(request.result || 'grid');
      request.onerror = () => resolve('grid');
    });
  }

  async saveViewMode(viewMode: ViewMode): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(STORE_SETTINGS, 'readwrite');
    transaction.objectStore(STORE_SETTINGS).put(viewMode, 'viewMode');
  }

  async getMicEnabled(): Promise<boolean> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('micEnabled');
      request.onsuccess = () => resolve(request.result === true);
      request.onerror = () => resolve(false);
    });
  }

  async saveMicEnabled(enabled: boolean): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(STORE_SETTINGS, 'readwrite');
    transaction.objectStore(STORE_SETTINGS).put(enabled, 'micEnabled');
  }

  async getAIEnabled(): Promise<boolean> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('aiEnabled');
      request.onsuccess = () => resolve(request.result === true);
      request.onerror = () => resolve(false);
    });
  }

  async saveAIEnabled(enabled: boolean): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(STORE_SETTINGS, 'readwrite');
    transaction.objectStore(STORE_SETTINGS).put(enabled, 'aiEnabled');
  }

  async getHideSystemNotes(): Promise<boolean> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('hideSystemNotes');
      request.onsuccess = () => resolve(request.result === true);
      request.onerror = () => resolve(false);
    });
  }

  async saveHideSystemNotes(hide: boolean): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(STORE_SETTINGS, 'readwrite');
    transaction.objectStore(STORE_SETTINGS).put(hide, 'hideSystemNotes');
  }
}

export const db = new DatabaseService();

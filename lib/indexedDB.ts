export interface DatabaseConfig {
  name: string;
  version: number;
  stores: {
    [key: string]: {
      keyPath: string;
      indices?: { [indexName: string]: string };
    };
  };
}

export class IndexedDBManager {
  private static instance: IndexedDBManager;
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig = {
    name: 'PhishsenseDB',
    version: 1,
    stores: {
      trainingSamples: {
        keyPath: 'id',
        indices: {
          label: 'label',
          timestamp: 'timestamp',
          userId: 'userId'
        }
      },
      patterns: {
        keyPath: 'id',
        indices: {
          category: 'category',
          severity: 'severity'
        }
      },
      analytics: {
        keyPath: 'id',
        indices: {
          type: 'type',
          date: 'date'
        }
      }
    }
  };

  private constructor() {}

  static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  // Initialize the database
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.entries(this.config.stores).forEach(([storeName, storeConfig]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });

            // Create indices
            if (storeConfig.indices) {
              Object.entries(storeConfig.indices).forEach(([indexName, indexKey]) => {
                store.createIndex(indexName, indexKey);
              });
            }
          }
        });
      };
    });
  }

  // Generic method to add data to a store
  async add<T>(storeName: string, data: T): Promise<string> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get data from a store
  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get all data from a store
  async getAll<T>(storeName: string): Promise<T[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to update data in a store
  async update<T>(storeName: string, data: T): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to delete data from a store
  async delete(storeName: string, key: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get data by index
  async getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey | IDBKeyRange): Promise<T[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data from a store
  async clear(storeName: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get database statistics
  async getStats(): Promise<{ [storeName: string]: number }> {
    await this.initialize();

    const stats: { [storeName: string]: number } = {};

    for (const storeName of Object.keys(this.config.stores)) {
      try {
        const count = await this.getCount(storeName);
        stats[storeName] = count;
      } catch {
        stats[storeName] = 0;
      }
    }

    return stats;
  }

  // Get count of records in a store
  private async getCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Close the database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Export all data for backup
  async exportData(): Promise<Record<string, unknown[]>> {
    const exportData: Record<string, unknown[]> = {};

    for (const storeName of Object.keys(this.config.stores)) {
      try {
        const data = await this.getAll<unknown>(storeName);
        exportData[storeName] = data;
      } catch (error) {
        console.error(`Error exporting ${storeName}:`, error);
        exportData[storeName] = [];
      }
    }

    return exportData;
  }

  // Import data from backup
  async importData(data: Record<string, unknown[]>): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const [storeName, items] of Object.entries(data)) {
      try {
        await this.clear(storeName);
        for (const item of items) {
          await this.add(storeName, item);
        }
      } catch (error) {
        errors.push(`Error importing ${storeName}: ${error}`);
      }
    }

    return { success: errors.length === 0, errors };
  }
}

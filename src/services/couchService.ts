import PouchDB from 'pouchdb';
import { graphql } from './apiClient';

interface SyncDoc {
  _id: string;
  _rev?: string;  // Required by PouchDB
  type: string;
  data: any;
  synced: boolean;
  lastUpdated: string;
}

class CouchService {
  private db: PouchDB.Database<SyncDoc>;

  constructor() {
    this.db = new PouchDB<SyncDoc>('optidb_local');
    this.listenForConnectivity();
  }

  /** Save a document locally */
  async saveDocument(type: string, data: any) {
    const doc: SyncDoc = {
      _id: `${type}_${new Date().getTime()}`,
      type,
      data,
      synced: false,
      lastUpdated: new Date().toISOString(),
    };

    await this.db.put(doc);
    console.log('� Saved locally:', doc);
  }

  /** Get all unsynced documents */
  private async getUnsyncedDocs(): Promise<PouchDB.Core.ExistingDocument<SyncDoc>[]> {
    const result = await this.db.allDocs({ include_docs: true });
    return result.rows
      .map((row) => row.doc)
      .filter((doc): doc is PouchDB.Core.ExistingDocument<SyncDoc> => !!doc && !doc.synced);
  }

  /** Mark document as synced */
  private async markAsSynced(id: string) {
    const doc = await this.db.get(id);
    if (!doc) return;
    doc.synced = true;
    await this.db.put(doc);
  }

  /** Get all documents of a specific type */
  async getDocuments(type: string): Promise<PouchDB.Core.ExistingDocument<SyncDoc>[]> {
    const result = await this.db.allDocs({
      include_docs: true,
      startkey: `${type}_`,
      endkey: `${type}_\ufff0`
    });
    
    return result.rows
      .map((row) => row.doc)
      .filter((doc): doc is PouchDB.Core.ExistingDocument<SyncDoc> => !!doc);
  }

  /** Delete a document */
  async deleteDocument(id: string) {
    try {
      const doc = await this.db.get(id);
      await this.db.remove(doc);
      console.log('🗑️ Document deleted:', id);
    } catch (err) {
      console.error('❌ Delete failed:', err);
      throw err;
    }
  }

  /** Sync unsynced docs with backend */
  async syncWithBackend() {
    const unsynced = await this.getUnsyncedDocs();
    if (unsynced.length === 0) {
      console.log('✅ No unsynced documents found');
      return;
    }

    console.log('🚀 Syncing', unsynced.length, 'documents...');

    try {
      const docsToSend = unsynced.map((doc) => ({
        id: doc._id,
        type: doc.type,
        data: JSON.stringify(doc.data),
        lastUpdated: doc.lastUpdated,
      }));

      // GraphQL mutation to backend
      const query = `
        mutation Sync($docs: [SyncDocumentInput!]!) {
          syncDocuments(docs: $docs)
        }
      `;

      const result = await graphql<{ syncDocuments: boolean }>(query, { docs: docsToSend });

      if (result.syncDocuments) {
        for (const doc of unsynced) {
          await this.markAsSynced(doc._id);
        }
        console.log('✅ Sync completed successfully');
      }
    } catch (err) {
      console.error('❌ Sync failed:', err);
    }
  }

  /** Automatically sync when the app comes back online */
  private listenForConnectivity() {
    window.addEventListener('online', async () => {
      console.log('🌐 Back online — starting sync...');
      await this.syncWithBackend();
    });
  }
}

export const couchService = new CouchService();

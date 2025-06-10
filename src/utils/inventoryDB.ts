import PouchDB from 'pouchdb-browser';

export interface InventoryRecord {
  _id?: string;
  product: string;
  quantity: number;
}

const localDB = new PouchDB<InventoryRecord>('inventory');
const remoteURL = 'http://localhost:5984/inventory';
let remoteDB: PouchDB.Database<InventoryRecord> | null = null;

export async function addRecord(record: Omit<InventoryRecord, '_id'>) {
  const doc: InventoryRecord = { ...record, _id: new Date().toISOString() };
  await localDB.put(doc);
}

export async function getAllRecords() {
  const res = await localDB.allDocs<InventoryRecord>({ include_docs: true });
  return res.rows.map(r => r.doc!) as InventoryRecord[];
}

export function sync() {
  if (!navigator.onLine) return;
  if (!remoteDB) {
    remoteDB = new PouchDB<InventoryRecord>(remoteURL);
  }
  localDB
    .sync(remoteDB, { retry: true })
    .on('error', (err) => console.error('sync error', err));
}


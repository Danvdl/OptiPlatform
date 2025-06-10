import { useEffect, useState } from 'react';
import { addRecord, getAllRecords, InventoryRecord, sync } from '../utils/inventoryDB';

export default function Inventory() {
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [records, setRecords] = useState<InventoryRecord[]>([]);

  const load = async () => {
    const docs = await getAllRecords();
    setRecords(docs);
  };

  useEffect(() => {
    load();
    sync();
  }, []);

  const add = async () => {
    if (!product) return;
    await addRecord({ product, quantity });
    setProduct('');
    setQuantity(0);
    await load();
  };

  return (
    <div>
      <h1>Inventory</h1>
      <div>
        <input
          placeholder="Product"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
        />
        <button onClick={add}>Add</button>
      </div>
      <ul>
        {records.map((r) => (
          <li key={r._id}>{r.product}: {r.quantity}</li>
        ))}
      </ul>
    </div>
  );
}

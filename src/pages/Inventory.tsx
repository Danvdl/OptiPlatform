import { useEffect, useState } from 'react';
import { fetchItems, addItem, updateItem, InventoryItem } from '../utils/hasuraInventory';

export default function Inventory() {
  const [productId, setProductId] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState<{ [id: number]: number }>({});

  const load = async () => {
    const docs = await fetchItems();
    setItems(docs);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!productId) return;
    await addItem(productId, quantity, 'add');
    setProductId(0);
    setQuantity(0);
    await load();
  };

  const save = async (id: number) => {
    const qty = editing[id];
    await updateItem(id, qty);
    setEditing((e) => ({ ...e, [id]: qty }));
    await load();
  };

  return (
    <div>
      <h1>Inventory</h1>
      <div>
        <input
          type="number"
          placeholder="Product ID"
          value={productId || ''}
          onChange={(e) => setProductId(parseInt(e.target.value, 10) || 0)}
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
        {items.map((r) => (
          <li key={r.id}>
            {r.product.name} - {r.quantity}
            <input
              type="number"
              value={editing[r.id] ?? r.quantity}
              onChange={(e) =>
                setEditing({ ...editing, [r.id]: parseInt(e.target.value, 10) || 0 })
              }
            />
            <button onClick={() => save(r.id)}>Save</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

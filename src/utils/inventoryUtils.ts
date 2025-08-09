// Normalization helpers for inventory across UI
export function isAdditionType(type: string): boolean {
  const t = String(type || '').toLowerCase();
  return (
    t === 'add' ||
    t === 'purchase' ||
    t === 'transfer_in' ||
    t === 'unreserve' ||
    t === 'return_from_customer'
  );
}

export function isRemovalType(type: string): boolean {
  return !isAdditionType(type);
}

// Canonical UI options for transaction type selects
export const TRANSACTION_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'add', label: 'Add Stock' },
  { value: 'remove', label: 'Remove Stock' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
];

// Normalize UI value to GraphQL enum string (e.g., add -> ADD)
export function toGraphQLEnum(value: string): string {
  return String(value || '').toUpperCase().replace(/-/g, '_');
}

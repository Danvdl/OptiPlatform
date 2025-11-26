import { describe, test, expect } from 'vitest';
import {
  isAdditionType,
  isRemovalType,
  toGraphQLEnum,
  TRANSACTION_TYPE_OPTIONS,
} from '../inventoryUtils';

describe('inventoryUtils', () => {
  describe('isAdditionType', () => {
    test('returns true for add type', () => {
      expect(isAdditionType('add')).toBe(true);
      expect(isAdditionType('ADD')).toBe(true);
    });

    test('returns true for purchase type', () => {
      expect(isAdditionType('purchase')).toBe(true);
      expect(isAdditionType('PURCHASE')).toBe(true);
    });

    test('returns true for transfer_in type', () => {
      expect(isAdditionType('transfer_in')).toBe(true);
      expect(isAdditionType('TRANSFER_IN')).toBe(true);
    });

    test('returns true for unreserve type', () => {
      expect(isAdditionType('unreserve')).toBe(true);
      expect(isAdditionType('UNRESERVE')).toBe(true);
    });

    test('returns true for return_from_customer type', () => {
      expect(isAdditionType('return_from_customer')).toBe(true);
      expect(isAdditionType('RETURN_FROM_CUSTOMER')).toBe(true);
    });

    test('returns false for removal types', () => {
      expect(isAdditionType('remove')).toBe(false);
      expect(isAdditionType('sale')).toBe(false);
      expect(isAdditionType('transfer_out')).toBe(false);
      expect(isAdditionType('waste')).toBe(false);
    });

    test('handles null and undefined gracefully', () => {
      expect(isAdditionType(null as any)).toBe(false);
      expect(isAdditionType(undefined as any)).toBe(false);
    });

    test('is case-insensitive', () => {
      expect(isAdditionType('AdD')).toBe(true);
      expect(isAdditionType('PuRcHaSe')).toBe(true);
    });
  });

  describe('isRemovalType', () => {
    test('returns true for removal types', () => {
      expect(isRemovalType('remove')).toBe(true);
      expect(isRemovalType('sale')).toBe(true);
      expect(isRemovalType('waste')).toBe(true);
      expect(isRemovalType('transfer_out')).toBe(true);
    });

    test('returns false for addition types', () => {
      expect(isRemovalType('add')).toBe(false);
      expect(isRemovalType('purchase')).toBe(false);
      expect(isRemovalType('transfer_in')).toBe(false);
    });

    test('is inverse of isAdditionType', () => {
      const types = ['add', 'purchase', 'remove', 'sale', 'transfer_in', 'transfer_out'];
      types.forEach((type) => {
        expect(isRemovalType(type)).toBe(!isAdditionType(type));
      });
    });
  });

  describe('toGraphQLEnum', () => {
    test('converts lowercase to uppercase', () => {
      expect(toGraphQLEnum('add')).toBe('ADD');
      expect(toGraphQLEnum('purchase')).toBe('PURCHASE');
    });

    test('replaces hyphens with underscores', () => {
      expect(toGraphQLEnum('transfer-in')).toBe('TRANSFER_IN');
      expect(toGraphQLEnum('transfer-out')).toBe('TRANSFER_OUT');
    });

    test('handles already uppercase values', () => {
      expect(toGraphQLEnum('ADD')).toBe('ADD');
      expect(toGraphQLEnum('PURCHASE')).toBe('PURCHASE');
    });

    test('handles mixed case with hyphens', () => {
      expect(toGraphQLEnum('Transfer-In')).toBe('TRANSFER_IN');
      expect(toGraphQLEnum('return-from-customer')).toBe('RETURN_FROM_CUSTOMER');
    });

    test('handles null and undefined gracefully', () => {
      expect(toGraphQLEnum(null as any)).toBe('');
      expect(toGraphQLEnum(undefined as any)).toBe('');
    });

    test('handles empty string', () => {
      expect(toGraphQLEnum('')).toBe('');
    });
  });

  describe('TRANSACTION_TYPE_OPTIONS', () => {
    test('has correct number of options', () => {
      expect(TRANSACTION_TYPE_OPTIONS).toHaveLength(4);
    });

    test('has add stock option', () => {
      const addOption = TRANSACTION_TYPE_OPTIONS.find((opt) => opt.value === 'add');
      expect(addOption).toBeDefined();
      expect(addOption?.label).toBe('Add Stock');
    });

    test('has remove stock option', () => {
      const removeOption = TRANSACTION_TYPE_OPTIONS.find((opt) => opt.value === 'remove');
      expect(removeOption).toBeDefined();
      expect(removeOption?.label).toBe('Remove Stock');
    });

    test('has transfer in option', () => {
      const transferInOption = TRANSACTION_TYPE_OPTIONS.find((opt) => opt.value === 'transfer_in');
      expect(transferInOption).toBeDefined();
      expect(transferInOption?.label).toBe('Transfer In');
    });

    test('has transfer out option', () => {
      const transferOutOption = TRANSACTION_TYPE_OPTIONS.find((opt) => opt.value === 'transfer_out');
      expect(transferOutOption).toBeDefined();
      expect(transferOutOption?.label).toBe('Transfer Out');
    });

    test('all options have value and label properties', () => {
      TRANSACTION_TYPE_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
        expect(option.value.length).toBeGreaterThan(0);
        expect(option.label.length).toBeGreaterThan(0);
      });
    });
  });
});

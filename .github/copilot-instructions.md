# OptiPlatform – Coding Guidelines (Simplified)

This file gives Copilot consistent rules when generating code for **OptiPlatform**.
Use these defaults unless a file or comment explicitly overrides them.

---

## 🧱 Core Principles

* Use **TypeScript everywhere** (no `any`).
* Keep functions **small and pure**.
* Prefer **consistency over cleverness**.
* Secure by default (validate all inputs).
* Focus on performance and readability.

---

## 🧪 Testing

* Use **Vitest** for all tests.
* Frontend tests: `@testing-library/react`.
* Backend tests: Vitest + mocked services.
* Aim for **85%+ coverage**.

**Test File Example**

```ts
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders name', () => {
    render(<ProductCard product={{ id: '1', name: 'Test', sku: 'A1' }} /> as any);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

## 🎨 Frontend (React + Tailwind)

* Use **React functional components**.
* Use **TailwindCSS** for styling.
* Use **shadcn/ui** as primary UI kit.
* Use **Aceternity UI** for:

  * Sidebar
  * Tabs
  * Timelines
  * Loaders
* Use **React Query** for data fetching.
* Forms: `react-hook-form` + `zod`.

**Component Example**

```tsx
export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
      {children}
    </button>
  );
}
```

---

## 🏗️ Backend (NestJS + GraphQL)

* Use **code-first GraphQL** with classes.
* Validate all inputs using pipes + decorators.
* Use DataLoader for relations to avoid N+1 queries.
* Organize backend by **feature modules**.
* Use migrations for DB changes (no auto-sync in production).

**Resolver Example**

```ts
@Resolver(() => Product)
export class ProductResolver {
  constructor(private service: ProductService) {}

  @Query(() => Product)
  product(@Args('id') id: string) {
    return this.service.getById(id);
  }
}
```

---

## 📦 File Structure (Recommended)

```
src/
  pages/
  components/
  features/
  services/
  hooks/
  utils/
  types/
server/src/
  product/
  inventory/
  pricing/
  reports/
  auth/
```

---

## 🔒 Security

* Never commit `.env` files.
* Validate all GraphQL inputs.
* Use JWT with short expiration.

---

## 🎯 Code Style

* Use ESLint + Prettier + Tailwind plugin.
* Alphabetize imports.
* No unused variables.
* No console logs in production code.

---

## 🚦 PR Checklist

* [ ] Types are explicit.
* [ ] Tests added/updated.
* [ ] **TypeScript type check passes**: Run `npx tsc -p tsconfig.json --noEmit` before committing.
* [ ] Lint + Prettier pass.
* [ ] No secrets committed.
* [ ] GraphQL schema changes documented.
* [ ] Frontend types match backend GraphQL schema (`server/schema.gql`).

---

## ✅ Type Checking

**ALWAYS run TypeScript type check before committing:**

```bash
npx tsc -p tsconfig.json --noEmit
```

**Common type issues to watch for:**
* Frontend types must match backend GraphQL schema
* Check `server/schema.gql` for correct field names and types
* Example: `PurchaseOrder` has `supplierId` (number) + `supplier` (relation), NOT `supplierName`
* Example: `Product` has `purchasePrice`/`salePrice`, NOT `price`/`cost`

---

## 🧩 Copilot Prompts

**When generating code tell Copilot:**

* “Use TypeScript with no `any`.”
* “Add Vitest tests.”
* “Use Tailwind classes.”
* “Follow NestJS GraphQL conventions.”

---
**PUSHING TO REPO**
never push direl

**End of simplified guidelines.**

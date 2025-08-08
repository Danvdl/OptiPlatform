# Migration 009: Align suppliers table with backend GraphQL model

This migration adds the missing columns to `suppliers` and adjusts score fields to match the backend/frontend expectations.

What it does:
- Adds: `description`, `address`, `discount_percentage`, `free_shipping_threshold`, `tags`, `last_order_date`.
- Ensures `supplier_code` exists and is unique.
- Converts `reliability_score` and `quality_score` from 0–5 decimals to 1–100 integers and adds proper CHECK constraints.

Why:
- Our GraphQL type exposes these fields and the UI benefits from them. This aligns DB, backend entities and DTOs, and the frontend.

How to run (Supabase SQL Editor or psql):
- Run the SQL file `database/009_suppliers_align_fields.sql`.

Post-migration actions:
- Rebuild backend so the GraphQL schema includes `supplierCode` and writable fields.
- Optional: backfill `last_order_date` via a one-off script if needed.

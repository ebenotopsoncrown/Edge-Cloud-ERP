/**
 * entities.js — Supabase replacement for base44 entities
 *
 * Every entity exposes the same 5 methods your app already uses:
 *   .list(filters)   → fetch multiple records
 *   .get(id)         → fetch one record by id
 *   .create(data)    → insert a new record
 *   .update(id,data) → update an existing record
 *   .delete(id)      → delete a record
 *
 * Usage in your pages is IDENTICAL to before — only the import path changes:
 *   OLD: import { Invoice } from '@/api/entities'
 *   NEW: import { Invoice } from '@/api/entities'  ← same! no page changes needed
 */

import { supabase } from './supabaseClient';

// ─── Entity Factory ────────────────────────────────────────────────────────────
// Creates a standard CRUD interface for any Supabase table.

function createEntity(tableName) {
  return {
    /**
     * List records with optional filters, sorting, and pagination.
     * @param {Object} options
     * @param {Object} options.filters   - e.g. { status: 'active', type: 'invoice' }
     * @param {string} options.orderBy   - column name to sort by
     * @param {boolean} options.ascending - sort direction (default: false = newest first)
     * @param {number} options.limit     - max records to return
     * @param {number} options.offset    - records to skip (for pagination)
     */
    list: async ({ filters = {}, orderBy = 'created_at', ascending = false, limit, offset } = {}) => {
      let query = supabase.from(tableName).select('*');

      // Apply each filter
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      query = query.order(orderBy, { ascending });
      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit ?? 100) - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    /**
     * Get a single record by its ID.
     */
    get: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    /**
     * Create a new record. Automatically stamps created_at and updated_at.
     */
    create: async (recordData) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ ...recordData, created_at: now, updated_at: now }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /**
     * Update an existing record by ID.
     */
    update: async (id, recordData) => {
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...recordData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /**
     * Delete a record by ID.
     */
    delete: async (id) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },

    /**
     * Count records matching filters.
     */
    count: async (filters = {}) => {
      let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
  };
}

// ─── Accounting ────────────────────────────────────────────────────────────────
export const Account         = createEntity('accounts');
export const JournalEntry    = createEntity('journal_entries');
export const ExchangeRate    = createEntity('exchange_rates');

// ─── Sales ────────────────────────────────────────────────────────────────────
export const Customer        = createEntity('customers');
export const Invoice         = createEntity('invoices');
export const Payment         = createEntity('payments');
export const SalesReturn     = createEntity('sales_returns');

// ─── Purchasing ───────────────────────────────────────────────────────────────
export const Vendor          = createEntity('vendors');
export const Bill            = createEntity('bills');
export const PurchaseOrder   = createEntity('purchase_orders');

// ─── Inventory ────────────────────────────────────────────────────────────────
export const Product              = createEntity('products');
export const InventoryLocation    = createEntity('inventory_locations');
export const ProductLocation      = createEntity('product_locations');
export const InventoryTransaction = createEntity('inventory_transactions');
export const InventoryReceipt     = createEntity('inventory_receipts');

// ─── Manufacturing ────────────────────────────────────────────────────────────
export const WorkOrder       = createEntity('work_orders');
export const BillOfMaterials = createEntity('bill_of_materials');

// ─── Jobs / Projects ──────────────────────────────────────────────────────────
export const Job             = createEntity('jobs');
export const JobPhase        = createEntity('job_phases');
export const CostCode        = createEntity('cost_codes');
export const JobCost         = createEntity('job_costs');

// ─── Fixed Assets ─────────────────────────────────────────────────────────────
export const FixedAsset      = createEntity('fixed_assets');

// ─── HR & Payroll ─────────────────────────────────────────────────────────────
export const Employee        = createEntity('employees');
export const PayrollItem     = createEntity('payroll_items');
export const PayrollRun      = createEntity('payroll_runs');

// ─── Non-Profit ───────────────────────────────────────────────────────────────
export const Donor           = createEntity('donors');
export const Program         = createEntity('programs');
export const Donation        = createEntity('donations');
export const Grant           = createEntity('grants');
export const NPBudget        = createEntity('np_budgets');

// ─── Point of Sale ────────────────────────────────────────────────────────────
export const Store                = createEntity('stores');
export const POSTerminal          = createEntity('pos_terminals');
export const POSSession           = createEntity('pos_sessions');
export const POSSale              = createEntity('pos_sales');

// ─── System ───────────────────────────────────────────────────────────────────
export const AppSettings     = createEntity('app_settings');
export const Company         = createEntity('companies');
export const License         = createEntity('licenses');
export const Role            = createEntity('roles');
export const RecordLock      = createEntity('record_locks');
export const AuditLog        = createEntity('audit_logs');
export const RecordVersion   = createEntity('record_versions');

// ─── Auth (re-exported from supabaseClient) ───────────────────────────────────
export { User } from './supabaseClient';

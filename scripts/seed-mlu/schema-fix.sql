-- Edge Cloud ERP: add the column names the app writes, filters and sorts by.
-- Safe to run more than once. No renames, column drops or data changes.
-- New columns have no defaults, so existing rows are not rewritten.
-- The columns and policies run as one transaction: an error there leaves them unchanged.
-- The final section relaxes NOT NULL on 13 columns the app doesn't fill.

begin;

-- ── Existing company_id tables: columns only, policies untouched ──────────────

alter table public.companies
  add column if not exists company_code text,
  add column if not exists time_zone text,
  add column if not exists setup_wizard_step integer;

alter table public.users
  add column if not exists job_title text;

alter table public.customers
  add column if not exists customer_code text,
  add column if not exists company_name text,
  add column if not exists contact_person text,
  add column if not exists billing_address jsonb,
  add column if not exists shipping_address jsonb,
  add column if not exists payment_terms text,
  add column if not exists tax_number text,
  add column if not exists total_outstanding numeric;

alter table public.vendors
  add column if not exists vendor_code text,
  add column if not exists company_name text,
  add column if not exists contact_person text,
  add column if not exists tax_number text,
  add column if not exists bank_details jsonb,
  add column if not exists total_outstanding numeric;

alter table public.products
  add column if not exists product_name text,
  add column if not exists product_type text,
  add column if not exists unit_of_measure text,
  add column if not exists barcode text,
  add column if not exists unit_price numeric,
  add column if not exists quantity_on_hand numeric,
  add column if not exists reorder_level numeric,
  add column if not exists reorder_quantity numeric,
  add column if not exists sales_account_id uuid,
  add column if not exists inventory_account_id uuid,
  add column if not exists cogs_account_id uuid,
  add column if not exists location_id uuid;

alter table public.invoices
  add column if not exists invoice_date date,
  add column if not exists customer_name text,
  add column if not exists job_id uuid,
  add column if not exists job_name text,
  add column if not exists payment_terms text,
  add column if not exists total_amount numeric,
  add column if not exists ar_account_id uuid,
  add column if not exists revenue_account_id uuid,
  add column if not exists tax_account_id uuid,
  add column if not exists journal_entry_id uuid,
  add column if not exists billing_address jsonb,
  add column if not exists shipping_address jsonb;

alter table public.bills
  add column if not exists bill_date date,
  add column if not exists vendor_name text,
  add column if not exists job_id uuid,
  add column if not exists job_name text,
  add column if not exists reference text,
  add column if not exists total_amount numeric,
  add column if not exists exchange_rate numeric,
  add column if not exists total_amount_base_currency numeric,
  add column if not exists amount_paid_base_currency numeric,
  add column if not exists balance_due_base_currency numeric,
  add column if not exists ap_account_id uuid,
  add column if not exists expense_account_id uuid,
  add column if not exists tax_account_id uuid,
  add column if not exists journal_entry_id uuid;

alter table public.payments
  add column if not exists payment_date date,
  add column if not exists payment_type text,
  add column if not exists payment_method text,
  add column if not exists contact_id uuid,
  add column if not exists contact_name text,
  add column if not exists currency text,
  add column if not exists exchange_rate numeric,
  add column if not exists amount_base_currency numeric,
  add column if not exists bank_account_id uuid,
  add column if not exists ar_ap_account_id uuid,
  add column if not exists ap_account_id uuid,
  add column if not exists journal_entry_id uuid;

alter table public.journal_entries
  add column if not exists entry_date date,
  add column if not exists source_type text,
  add column if not exists source_id uuid,
  add column if not exists line_items jsonb,
  add column if not exists total_debits numeric,
  add column if not exists total_credits numeric,
  add column if not exists posted_by text,
  add column if not exists posted_date timestamptz;

alter table public.employees
  add column if not exists employee_code text,
  add column if not exists job_title text,
  add column if not exists date_of_birth text,
  add column if not exists pay_frequency text,
  add column if not exists basic_salary numeric,
  add column if not exists currency text,
  add column if not exists tax_id text,
  add column if not exists is_active boolean;

alter table public.payroll_runs
  add column if not exists payroll_number text,
  add column if not exists pay_period_start date,
  add column if not exists pay_period_end date,
  add column if not exists employee_payments jsonb,
  add column if not exists total_deductions numeric,
  add column if not exists total_taxes numeric;

alter table public.fixed_assets
  add column if not exists asset_code text,
  add column if not exists asset_name text,
  add column if not exists description text,
  add column if not exists acquisition_date date,
  add column if not exists acquisition_cost numeric,
  add column if not exists useful_life_years numeric,
  add column if not exists assigned_to text,
  add column if not exists serial_number text,
  add column if not exists warranty_expiry text,
  add column if not exists vendor_id uuid,
  add column if not exists asset_account_id uuid,
  add column if not exists depreciation_account_id uuid,
  add column if not exists accumulated_depreciation_account_id uuid,
  add column if not exists accumulated_depreciation numeric,
  add column if not exists book_value numeric,
  add column if not exists current_book_value numeric,
  add column if not exists last_depreciation_date date,
  add column if not exists is_active boolean;

alter table public.jobs
  add column if not exists job_name text,
  add column if not exists description text,
  add column if not exists customer_name text,
  add column if not exists job_type text,
  add column if not exists expected_end_date date,
  add column if not exists contract_amount numeric,
  add column if not exists budgeted_cost numeric,
  add column if not exists percent_complete numeric,
  add column if not exists project_manager text,
  add column if not exists location text;

alter table public.work_orders
  add column if not exists work_order_number text,
  add column if not exists product_name text,
  add column if not exists expected_completion_date date,
  add column if not exists quantity_to_produce numeric,
  add column if not exists quantity_produced numeric,
  add column if not exists material_costs numeric,
  add column if not exists labor_costs numeric,
  add column if not exists overhead_costs numeric,
  add column if not exists total_cost numeric,
  add column if not exists cost_per_unit numeric;

alter table public.purchase_orders
  add column if not exists po_date date,
  add column if not exists vendor_name text,
  add column if not exists expected_delivery_date date,
  add column if not exists total_amount numeric,
  add column if not exists exchange_rate numeric,
  add column if not exists total_amount_base_currency numeric,
  add column if not exists converted_to_bill boolean,
  add column if not exists bill_id uuid;

alter table public.pos_sales
  add column if not exists store_id uuid,
  add column if not exists store_name text,
  add column if not exists terminal_name text,
  add column if not exists cashier_id uuid,
  add column if not exists cashier_name text,
  add column if not exists customer_name text,
  add column if not exists sale_date timestamptz,
  add column if not exists discount_total numeric,
  add column if not exists total_amount numeric,
  add column if not exists payments jsonb,
  add column if not exists amount_paid numeric,
  add column if not exists change_given numeric,
  add column if not exists cost_of_goods numeric,
  add column if not exists gross_profit numeric,
  add column if not exists gl_posted boolean,
  add column if not exists invoice_id uuid,
  add column if not exists journal_entry_id uuid;

-- ── Tables the app doesn't send company_id for: columns only ──────────────────
-- A company_id policy would reject every insert these screens make.

alter table public.cost_codes
  add column if not exists cost_code text,
  add column if not exists cost_code_name text,
  add column if not exists category text,
  add column if not exists description text;

alter table public.job_phases
  add column if not exists phase_code text,
  add column if not exists phase_name text,
  add column if not exists description text,
  add column if not exists budgeted_amount numeric;

alter table public.payroll_items
  add column if not exists item_code text,
  add column if not exists item_name text,
  add column if not exists item_type text,
  add column if not exists calculation_method text,
  add column if not exists default_amount numeric,
  add column if not exists is_taxable boolean,
  add column if not exists description text,
  add column if not exists is_active boolean;

alter table public.licenses
  add column if not exists company_name text,
  add column if not exists activation_code text,
  add column if not exists license_type text,
  add column if not exists modules_enabled jsonb,
  add column if not exists user_limit integer,
  add column if not exists issue_date date,
  add column if not exists expiry_date date,
  add column if not exists is_active boolean,
  add column if not exists contact_person text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists custom_features jsonb,
  add column if not exists notes text;

-- ── Tables that gain company_id ───────────────────────────────────────────────

alter table public.exchange_rates
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists exchange_rate numeric,
  add column if not exists rate_type text,
  add column if not exists source text;

alter table public.bill_of_materials
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists bom_number text,
  add column if not exists product_name text,
  add column if not exists labor_hours numeric,
  add column if not exists labor_rate_per_hour numeric,
  add column if not exists overhead_rate numeric,
  add column if not exists total_material_cost numeric,
  add column if not exists total_labor_cost numeric,
  add column if not exists total_overhead_cost numeric,
  add column if not exists total_cost numeric;

alter table public.job_costs
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists transaction_date date,
  add column if not exists cost_type text,
  add column if not exists total_cost numeric,
  add column if not exists is_billable boolean,
  add column if not exists is_billed boolean;

alter table public.inventory_locations
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists location_code text,
  add column if not exists location_name text,
  add column if not exists location_type text,
  add column if not exists store_id uuid;

alter table public.inventory_receipts
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists receipt_date date,
  add column if not exists vendor_name text,
  add column if not exists po_id uuid,
  add column if not exists po_number text,
  add column if not exists bill_id uuid,
  add column if not exists bill_number text,
  add column if not exists ap_account_id uuid,
  add column if not exists subtotal numeric,
  add column if not exists tax_total numeric,
  add column if not exists total_amount numeric;

alter table public.inventory_transactions
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists transaction_number text,
  add column if not exists transaction_date date,
  add column if not exists transaction_type text,
  add column if not exists product_name text,
  add column if not exists sku text,
  add column if not exists quantity_in numeric,
  add column if not exists quantity_out numeric,
  add column if not exists unit_cost numeric,
  add column if not exists total_value numeric,
  add column if not exists reference_type text,
  add column if not exists reference_id uuid,
  add column if not exists reference_number text,
  add column if not exists journal_entry_id uuid;

alter table public.product_locations
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists quantity_on_hand numeric,
  add column if not exists quantity_available numeric;

alter table public.sales_returns
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists return_date date,
  add column if not exists customer_name text,
  add column if not exists invoice_number text,
  add column if not exists return_reason text,
  add column if not exists subtotal numeric,
  add column if not exists tax_total numeric,
  add column if not exists total_amount numeric,
  add column if not exists notes text;

alter table public.stores
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists store_code text,
  add column if not exists store_name text,
  add column if not exists store_type text,
  add column if not exists manager_id uuid,
  add column if not exists default_inventory_location_id uuid,
  add column if not exists tax_settings jsonb;

alter table public.pos_terminals
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists terminal_name text;

alter table public.pos_sessions
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists store_id uuid,
  add column if not exists session_number text,
  add column if not exists cashier_name text,
  add column if not exists total_transactions numeric,
  add column if not exists payment_breakdown jsonb;

alter table public.roles
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists role_name text;

alter table public.audit_logs
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists entity_name text,
  add column if not exists user_name text,
  add column if not exists user_email text,
  add column if not exists "timestamp" timestamptz,
  add column if not exists changes jsonb,
  add column if not exists updated_at timestamptz;

alter table public.record_locks
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists entity_name text,
  add column if not exists locked_by_user_id uuid,
  add column if not exists locked_by_user_name text,
  add column if not exists lock_expires_at timestamptz,
  add column if not exists session_id text,
  add column if not exists is_active boolean,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table public.record_versions
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists entity_name text,
  add column if not exists version_number integer,
  add column if not exists record_data jsonb,
  add column if not exists changed_by_user_id uuid,
  add column if not exists changed_by_user_name text,
  add column if not exists change_description text,
  add column if not exists "timestamp" timestamptz,
  add column if not exists updated_at timestamptz;

alter table public.donations add column if not exists company_id uuid references public.companies(id);
alter table public.programs  add column if not exists company_id uuid references public.companies(id);
alter table public.grants    add column if not exists company_id uuid references public.companies(id);

-- ── Policy block for every table that gained company_id ───────────────────────

do $$
declare
  target text;
  existing record;
begin
  foreach target in array array[
    'exchange_rates', 'bill_of_materials', 'job_costs', 'inventory_locations',
    'inventory_receipts', 'inventory_transactions', 'product_locations', 'sales_returns',
    'stores', 'pos_terminals', 'pos_sessions', 'roles', 'audit_logs', 'record_locks',
    'record_versions', 'donations', 'programs', 'grants'
  ]
  loop
    execute format('alter table public.%I enable row level security', target);

    for existing in
      select policyname from pg_policies where schemaname = 'public' and tablename = target
    loop
      execute format('drop policy %I on public.%I', existing.policyname, target);
    end loop;

    execute format(
      'create policy "company members only" on public.%I for all to authenticated using (public.is_member(company_id)) with check (public.is_member(company_id))',
      target
    );
  end loop;
end $$;

commit;

-- Make the API see the new columns straight away.
notify pgrst, 'reload schema';

-- ── Relax NOT NULL on columns the app never fills ─────────────────────────────
-- The app sends its own name instead (for example company_name, not name). While
-- these stay NOT NULL, its inserts into these tables are rejected.

alter table public.customers           alter column name drop not null;
alter table public.vendors             alter column name drop not null;
alter table public.products            alter column name drop not null;
alter table public.fixed_assets        alter column name drop not null;
alter table public.jobs                alter column name drop not null;
alter table public.job_phases          alter column name drop not null;
alter table public.cost_codes          alter column name drop not null;
alter table public.bill_of_materials   alter column name drop not null;
alter table public.inventory_locations alter column name drop not null;
alter table public.roles               alter column name drop not null;
alter table public.exchange_rates      alter column rate drop not null;
alter table public.journal_entries     alter column date drop not null;
alter table public.record_locks        alter column table_name drop not null;
notify pgrst, 'reload schema';

export const CHART_OF_ACCOUNTS_TEMPLATES = {
  manufacturing: {
    name: "Manufacturing Business",
    accounts: [
      // ASSETS
      { code: "1000", name: "Cash", type: "asset", category: "current_asset" },
      { code: "1010", name: "Petty Cash", type: "asset", category: "current_asset" },
      { code: "1020", name: "Bank - Operating Account", type: "asset", category: "current_asset" },
      { code: "1100", name: "Accounts Receivable", type: "asset", category: "current_asset" },
      { code: "1200", name: "Raw Materials Inventory", type: "asset", category: "current_asset" },
      { code: "1210", name: "Work in Process Inventory", type: "asset", category: "current_asset" },
      { code: "1220", name: "Finished Goods Inventory", type: "asset", category: "current_asset" },
      { code: "1300", name: "Prepaid Expenses", type: "asset", category: "current_asset" },
      { code: "1500", name: "Machinery & Equipment", type: "asset", category: "fixed_asset" },
      { code: "1510", name: "Accumulated Depreciation - Machinery", type: "asset", category: "fixed_asset" },
      { code: "1520", name: "Buildings", type: "asset", category: "fixed_asset" },
      { code: "1530", name: "Accumulated Depreciation - Buildings", type: "asset", category: "fixed_asset" },
      { code: "1540", name: "Land", type: "asset", category: "fixed_asset" },

      // LIABILITIES
      { code: "2000", name: "Accounts Payable", type: "liability", category: "current_liability" },
      { code: "2100", name: "Accrued Expenses", type: "liability", category: "current_liability" },
      { code: "2200", name: "Sales Tax Payable", type: "liability", category: "current_liability" },
      { code: "2300", name: "Payroll Liabilities", type: "liability", category: "current_liability" },
      { code: "2500", name: "Short Term Loans", type: "liability", category: "current_liability" },
      { code: "2700", name: "Long Term Debt", type: "liability", category: "long_term_liability" },
      { code: "2800", name: "Bank Loan", type: "liability", category: "long_term_liability" },

      // EQUITY
      { code: "3000", name: "Owner's Capital", type: "equity", category: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity", category: "equity" },
      { code: "3900", name: "Current Year Earnings", type: "equity", category: "equity" },

      // REVENUE
      { code: "4000", name: "Sales Revenue", type: "revenue", category: "operating_revenue" },
      { code: "4100", name: "Sales Returns and Allowances", type: "revenue", category: "operating_revenue" },
      { code: "4200", name: "Sales Discounts", type: "revenue", category: "operating_revenue" },
      { code: "4900", name: "Other Income", type: "revenue", category: "other_revenue" },

      // COST OF GOODS SOLD
      { code: "5000", name: "Cost of Goods Sold", type: "cost_of_goods_sold", category: "cost_of_sales" },
      { code: "5100", name: "Direct Materials", type: "cost_of_goods_sold", category: "cost_of_sales" },
      { code: "5200", name: "Direct Labor", type: "cost_of_goods_sold", category: "cost_of_sales" },
      { code: "5300", name: "Manufacturing Overhead", type: "cost_of_goods_sold", category: "cost_of_sales" },

      // EXPENSES
      { code: "6000", name: "Salaries and Wages", type: "expense", category: "operating_expense" },
      { code: "6100", name: "Rent Expense", type: "expense", category: "operating_expense" },
      { code: "6200", name: "Utilities Expense", type: "expense", category: "operating_expense" },
      { code: "6300", name: "Insurance Expense", type: "expense", category: "operating_expense" },
      { code: "6400", name: "Depreciation Expense", type: "expense", category: "operating_expense" },
      { code: "6500", name: "Repairs and Maintenance", type: "expense", category: "operating_expense" },
      { code: "6600", name: "Office Supplies", type: "expense", category: "operating_expense" },
      { code: "6700", name: "Marketing and Advertising", type: "expense", category: "operating_expense" },
      { code: "6800", name: "Professional Fees", type: "expense", category: "operating_expense" },
      { code: "6900", name: "Miscellaneous Expenses", type: "expense", category: "other_expense" },
      { code: "7000", name: "Interest Expense", type: "expense", category: "other_expense" },
      { code: "7100", name: "Bank Charges", type: "expense", category: "other_expense" }
    ]
  },

  retail: {
    name: "Retail/Trading Business",
    accounts: [
      // ASSETS
      { code: "1000", name: "Cash on Hand", type: "asset", category: "current_asset" },
      { code: "1010", name: "Petty Cash", type: "asset", category: "current_asset" },
      { code: "1020", name: "Bank - Checking Account", type: "asset", category: "current_asset" },
      { code: "1030", name: "Bank - Savings Account", type: "asset", category: "current_asset" },
      { code: "1100", name: "Accounts Receivable", type: "asset", category: "current_asset" },
      { code: "1200", name: "Merchandise Inventory", type: "asset", category: "current_asset" },
      { code: "1300", name: "Prepaid Rent", type: "asset", category: "current_asset" },
      { code: "1310", name: "Prepaid Insurance", type: "asset", category: "current_asset" },
      { code: "1500", name: "Store Equipment & Fixtures", type: "asset", category: "fixed_asset" },
      { code: "1510", name: "Accumulated Depreciation - Equipment", type: "asset", category: "fixed_asset" },
      { code: "1520", name: "Computers & Software", type: "asset", category: "fixed_asset" },
      { code: "1530", name: "Accumulated Depreciation - Computers", type: "asset", category: "fixed_asset" },

      // LIABILITIES
      { code: "2000", name: "Accounts Payable", type: "liability", category: "current_liability" },
      { code: "2100", name: "Credit Card Payable", type: "liability", category: "current_liability" },
      { code: "2200", name: "Sales Tax Payable", type: "liability", category: "current_liability" },
      { code: "2300", name: "Payroll Payable", type: "liability", category: "current_liability" },
      { code: "2400", name: "Accrued Expenses", type: "liability", category: "current_liability" },

      // EQUITY
      { code: "3000", name: "Owner's Equity", type: "equity", category: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity", category: "equity" },
      { code: "3900", name: "Current Year Earnings", type: "equity", category: "equity" },

      // REVENUE
      { code: "4000", name: "Retail Sales", type: "revenue", category: "operating_revenue" },
      { code: "4100", name: "Online Sales", type: "revenue", category: "operating_revenue" },
      { code: "4200", name: "Sales Returns", type: "revenue", category: "operating_revenue" },
      { code: "4300", name: "Sales Discounts", type: "revenue", category: "operating_revenue" },

      // COST OF GOODS SOLD
      { code: "5000", name: "Cost of Goods Sold", type: "cost_of_goods_sold", category: "cost_of_sales" },
      { code: "5100", name: "Purchase Discounts", type: "cost_of_goods_sold", category: "cost_of_sales" },
      { code: "5200", name: "Freight and Shipping", type: "cost_of_goods_sold", category: "cost_of_sales" },

      // EXPENSES
      { code: "6000", name: "Salaries - Sales Staff", type: "expense", category: "operating_expense" },
      { code: "6100", name: "Salaries - Administrative", type: "expense", category: "operating_expense" },
      { code: "6200", name: "Rent Expense", type: "expense", category: "operating_expense" },
      { code: "6300", name: "Utilities", type: "expense", category: "operating_expense" },
      { code: "6400", name: "Marketing & Advertising", type: "expense", category: "operating_expense" },
      { code: "6500", name: "Store Supplies", type: "expense", category: "operating_expense" },
      { code: "6600", name: "Insurance", type: "expense", category: "operating_expense" },
      { code: "6700", name: "Depreciation", type: "expense", category: "operating_expense" },
      { code: "6800", name: "Bank Fees", type: "expense", category: "other_expense" },
      { code: "6900", name: "Credit Card Processing Fees", type: "expense", category: "other_expense" }
    ]
  },

  service: {
    name: "Service Business",
    accounts: [
      // ASSETS
      { code: "1000", name: "Cash", type: "asset", category: "current_asset" },
      { code: "1020", name: "Bank Account", type: "asset", category: "current_asset" },
      { code: "1100", name: "Accounts Receivable", type: "asset", category: "current_asset" },
      { code: "1300", name: "Prepaid Expenses", type: "asset", category: "current_asset" },
      { code: "1500", name: "Office Equipment", type: "asset", category: "fixed_asset" },
      { code: "1510", name: "Accumulated Depreciation", type: "asset", category: "fixed_asset" },
      { code: "1520", name: "Furniture & Fixtures", type: "asset", category: "fixed_asset" },

      // LIABILITIES
      { code: "2000", name: "Accounts Payable", type: "liability", category: "current_liability" },
      { code: "2100", name: "Accrued Expenses", type: "liability", category: "current_liability" },
      { code: "2200", name: "Tax Payable", type: "liability", category: "current_liability" },

      // EQUITY
      { code: "3000", name: "Owner's Capital", type: "equity", category: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity", category: "equity" },

      // REVENUE
      { code: "4000", name: "Service Revenue", type: "revenue", category: "operating_revenue" },
      { code: "4100", name: "Consulting Fees", type: "revenue", category: "operating_revenue" },
      { code: "4200", name: "Other Income", type: "revenue", category: "other_revenue" },

      // EXPENSES
      { code: "6000", name: "Salaries and Wages", type: "expense", category: "operating_expense" },
      { code: "6100", name: "Contract Labor", type: "expense", category: "operating_expense" },
      { code: "6200", name: "Rent", type: "expense", category: "operating_expense" },
      { code: "6300", name: "Utilities", type: "expense", category: "operating_expense" },
      { code: "6400", name: "Professional Fees", type: "expense", category: "operating_expense" },
      { code: "6500", name: "Marketing", type: "expense", category: "operating_expense" },
      { code: "6600", name: "Office Supplies", type: "expense", category: "operating_expense" },
      { code: "6700", name: "Depreciation", type: "expense", category: "operating_expense" }
    ]
  },

  construction: {
    name: "Construction/Contracting",
    accounts: [
      // ASSETS
      { code: "1000", name: "Cash", type: "asset", category: "current_asset" },
      { code: "1020", name: "Bank Account", type: "asset", category: "current_asset" },
      { code: "1100", name: "Accounts Receivable", type: "asset", category: "current_asset" },
      { code: "1150", name: "Retainage Receivable", type: "asset", category: "current_asset" },
      { code: "1200", name: "Work in Progress", type: "asset", category: "current_asset" },
      { code: "1300", name: "Materials Inventory", type: "asset", category: "current_asset" },
      { code: "1500", name: "Construction Equipment", type: "asset", category: "fixed_asset" },
      { code: "1510", name: "Accumulated Depreciation - Equipment", type: "asset", category: "fixed_asset" },
      { code: "1520", name: "Vehicles", type: "asset", category: "fixed_asset" },
      { code: "1530", name: "Accumulated Depreciation - Vehicles", type: "asset", category: "fixed_asset" },

      // LIABILITIES
      { code: "2000", name: "Accounts Payable", type: "liability", category: "current_liability" },
      { code: "2100", name: "Retainage Payable", type: "liability", category: "current_liability" },
      { code: "2200", name: "Customer Deposits", type: "liability", category: "current_liability" },
      { code: "2300", name: "Payroll Liabilities", type: "liability", category: "current_liability" },

      // EQUITY
      { code: "3000", name: "Owner's Equity", type: "equity", category: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity", category: "equity" },

      // REVENUE
      { code: "4000", name: "Contract Revenue", type: "revenue", category: "operating_revenue" },
      { code: "4100", name: "Change Orders", type: "revenue", category: "operating_revenue" },

      // COST OF REVENUE
      { code: "5000", name: "Direct Labor", type: "cost_of_goods_sold", category: "cost_of_sales" },
      { code: "5100", name: "Direct Materials", type: "cost_of_goods_sold", category: "cost_of_sales" },
      { code: "5200", name: "Subcontractors", type: "cost_of_goods_sold", category: "cost_of_sales" },
      { code: "5300", name: "Equipment Rental", type: "cost_of_goods_sold", category: "cost_of_sales" },

      // EXPENSES
      { code: "6000", name: "Indirect Labor", type: "expense", category: "operating_expense" },
      { code: "6100", name: "Office Salaries", type: "expense", category: "operating_expense" },
      { code: "6200", name: "Insurance", type: "expense", category: "operating_expense" },
      { code: "6300", name: "Vehicle Expense", type: "expense", category: "operating_expense" },
      { code: "6400", name: "Depreciation", type: "expense", category: "operating_expense" },
      { code: "6500", name: "Permits and Licenses", type: "expense", category: "operating_expense" }
    ]
  },

  non_profit: {
    name: "Non-Profit Organization",
    accounts: [
      // ASSETS
      { code: "1000", name: "Cash - Operating", type: "asset", category: "current_asset" },
      { code: "1010", name: "Cash - Restricted", type: "asset", category: "current_asset" },
      { code: "1020", name: "Bank Account", type: "asset", category: "current_asset" },
      { code: "1100", name: "Grants Receivable", type: "asset", category: "current_asset" },
      { code: "1110", name: "Pledges Receivable", type: "asset", category: "current_asset" },
      { code: "1500", name: "Property and Equipment", type: "asset", category: "fixed_asset" },
      { code: "1510", name: "Accumulated Depreciation", type: "asset", category: "fixed_asset" },

      // LIABILITIES
      { code: "2000", name: "Accounts Payable", type: "liability", category: "current_liability" },
      { code: "2100", name: "Deferred Revenue", type: "liability", category: "current_liability" },
      { code: "2200", name: "Payroll Liabilities", type: "liability", category: "current_liability" },

      // NET ASSETS
      { code: "3000", name: "Net Assets - Unrestricted", type: "equity", category: "equity" },
      { code: "3100", name: "Net Assets - Temporarily Restricted", type: "equity", category: "equity" },
      { code: "3200", name: "Net Assets - Permanently Restricted", type: "equity", category: "equity" },

      // REVENUE
      { code: "4000", name: "Donation Revenue", type: "revenue", category: "operating_revenue" },
      { code: "4100", name: "Grant Revenue", type: "revenue", category: "operating_revenue" },
      { code: "4200", name: "Fundraising Revenue", type: "revenue", category: "operating_revenue" },
      { code: "4300", name: "Program Service Fees", type: "revenue", category: "operating_revenue" },
      { code: "4400", name: "Investment Income", type: "revenue", category: "other_revenue" },

      // EXPENSES
      { code: "6000", name: "Program Services Expense", type: "expense", category: "operating_expense" },
      { code: "6100", name: "Fundraising Expense", type: "expense", category: "operating_expense" },
      { code: "6200", name: "Administrative Expense", type: "expense", category: "operating_expense" },
      { code: "6300", name: "Salaries and Benefits", type: "expense", category: "operating_expense" },
      { code: "6400", name: "Occupancy Costs", type: "expense", category: "operating_expense" },
      { code: "6500", name: "Professional Fees", type: "expense", category: "operating_expense" }
    ]
  },

  general: {
    name: "General Business (Basic)",
    accounts: [
      // ASSETS
      { code: "1000", name: "Cash", type: "asset", category: "current_asset" },
      { code: "1020", name: "Bank Account", type: "asset", category: "current_asset" },
      { code: "1100", name: "Accounts Receivable", type: "asset", category: "current_asset" },
      { code: "1200", name: "Inventory", type: "asset", category: "current_asset" },
      { code: "1500", name: "Fixed Assets", type: "asset", category: "fixed_asset" },
      { code: "1510", name: "Accumulated Depreciation", type: "asset", category: "fixed_asset" },

      // LIABILITIES
      { code: "2000", name: "Accounts Payable", type: "liability", category: "current_liability" },
      { code: "2100", name: "Accrued Expenses", type: "liability", category: "current_liability" },

      // EQUITY
      { code: "3000", name: "Owner's Equity", type: "equity", category: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity", category: "equity" },

      // REVENUE
      { code: "4000", name: "Sales Revenue", type: "revenue", category: "operating_revenue" },

      // COST OF SALES
      { code: "5000", name: "Cost of Goods Sold", type: "cost_of_goods_sold", category: "cost_of_sales" },

      // EXPENSES
      { code: "6000", name: "Operating Expenses", type: "expense", category: "operating_expense" }
    ]
  }
};
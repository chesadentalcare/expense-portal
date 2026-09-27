export type Concern = {
  id: number
  mobile: string
  name: string
  email?: string | null
  role?: string | null
}

export type ExpenseStatus =
  | 'submitted'
  | 'approved'
  | 'PostedToSAP'
  | 'paid'
  | 'rejected'
  | string

export type Expense = {
  id: number
  category: string
  gl_code?: string | null
  amount: number | string
  vendor: string | null
  vendor_card_code?: string | null
  // Derived by the gateway (utils/expenseType.js) so every dashboard is consistent.
  pay_to_type?: 'vendor' | 'employee' | 'petty_cash' | null
  employee_name?: string | null
  employee_source?: string | null
  employee_ref_id?: string | null
  expense_type?: 'vendor' | 'employee' | 'petty_cash'
  type_label?: string
  paid_to?: string
  bill_date: string | null
  bill_description: string | null
  remarks: string | null
  status: ExpenseStatus
  submitted_by: string | null
  anju_rejected_reason: string | null
  reapply_count?: number | null
  status_history?: ExpenseStatusEvent[] | string | null
  billImageUrl?: string | null
  bills?: ExpenseBill[]
  created_at?: string | null
}

export type ExpenseStatusEvent = {
  status?: string
  reason?: string | null
  at?: string | null
  by?: string | null
  [k: string]: unknown
}

export type ExpenseBill = {
  id?: number
  bill_image_path?: string | null
  billImageUrl?: string | null
  [k: string]: unknown
}

export type Option = { key: string; label: string; sub?: string; raw: Record<string, unknown> }

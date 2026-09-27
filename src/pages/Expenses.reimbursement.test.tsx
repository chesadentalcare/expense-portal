import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Options the mocked SearchSelect hands back, keyed by its placeholder.
const MOCK_OPTIONS: Record<string, unknown> = {
  'Search Ashva expense category': { key: '1', label: 'Bus Fare', raw: { id: '1', name: 'Bus Fare', gl_code: '70439' } },
  'Search employee to reimburse': { key: 'engineers:42', label: 'Ravi Kumar', raw: { id: 42, source: 'engineers', employee_name: 'Ravi Kumar' } },
  'Search Ashva vendor': { key: 'v1', label: 'ACME Supplies', raw: { id: 'v1', vendor_name: 'ACME Supplies', card_code: 'V001' } },
}

vi.mock('../api/client', async (importActual) => {
  const actual = await importActual<typeof import('../api/client')>()
  return {
    ...actual,
    api: {
      get: vi.fn().mockResolvedValue({ data: { data: [], requests: [] } }),
      post: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
  }
})

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ concern: { name: 'Tester', mobile: '9999999999', role: 'admin' }, logout: vi.fn() }),
}))

vi.mock('../components/SearchSelect', () => ({
  default: ({ placeholder, onSelect }: { placeholder: string; onSelect: (o: unknown) => void }) => (
    <button type="button" data-testid={`ss-${placeholder}`} onClick={() => onSelect(MOCK_OPTIONS[placeholder])}>
      {placeholder}
    </button>
  ),
}))
vi.mock('../components/StatementModal', () => ({ default: () => null }))
vi.mock('../components/CreateVendorModal', () => ({ default: () => null }))

import Expenses from './Expenses'
import { api, endpoints } from '../api/client'

const openForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => expect(screen.getAllByRole('button', { name: /New Expense/i }).length).toBeGreaterThan(0))
  await user.click(screen.getAllByRole('button', { name: /New Expense/i })[0])
}

const fillCommon = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId('ss-Search Ashva expense category'))
  await user.type(screen.getByPlaceholderText('0.00'), '500')
  await user.type(screen.getByPlaceholderText(/Justification/i), 'Site visit expense')
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
  fireEvent.change(dateInput, { target: { value: '2026-09-21' } })
}

describe('Expenses — reimbursement submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { data: [], requests: [] } })
    ;(api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } })
    localStorage.clear()
  })

  it('sends pay_to_type=employee with employee fields (no vendor) on the Reimbursement tab', async () => {
    const user = userEvent.setup()
    render(<Expenses />)
    await openForm(user)

    await user.click(screen.getByRole('button', { name: 'Reimbursement' }))
    await user.click(screen.getByTestId('ss-Search employee to reimburse'))
    await fillCommon(user)

    await user.click(screen.getByRole('button', { name: /Submit for Approval/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalled())
    const call = (api.post as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)!
    expect(call[0]).toBe(endpoints.expenses)
    const fd = call[1] as FormData
    expect(fd.get('pay_to_type')).toBe('employee')
    expect(fd.get('employee_source')).toBe('engineers')
    expect(fd.get('employee_ref_id')).toBe('42')
    expect(fd.get('employee_name')).toBe('Ravi Kumar')
    expect(fd.get('vendor')).toBeNull()
  })

  it('sends pay_to_type=vendor with vendor fields on the Expense tab', async () => {
    const user = userEvent.setup()
    render(<Expenses />)
    await openForm(user)

    await user.click(screen.getByTestId('ss-Search Ashva vendor'))
    await fillCommon(user)

    await user.click(screen.getByRole('button', { name: /Submit for Approval/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalled())
    const fd = (api.post as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)![1] as FormData
    expect(fd.get('pay_to_type')).toBe('vendor')
    expect(fd.get('vendor')).toBe('ACME Supplies')
    expect(fd.get('employee_ref_id')).toBeNull()
  })

  it('sends pay_to_type=petty_cash with amount and reason (no vendor, no employee) on the Petty Cash tab', async () => {
    const user = userEvent.setup()
    render(<Expenses />)
    await openForm(user)

    await user.click(screen.getByRole('button', { name: 'Petty Cash' }))
    await user.type(screen.getByPlaceholderText('0.00'), '1500')
    await user.type(screen.getByPlaceholderText(/What is this petty cash for\?/i), 'Office cleaning supplies')

    await user.click(screen.getByRole('button', { name: /Submit for Approval/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalled())
    const fd = (api.post as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)![1] as FormData
    expect(fd.get('pay_to_type')).toBe('petty_cash')
    expect(fd.get('category')).toBe('Petty Cash')
    expect(fd.get('amount')).toBe('1500')
    expect(fd.get('bill_date')).toBe(new Date().toISOString().split('T')[0])
    expect(fd.get('bill_description')).toBe('Office cleaning supplies')
    expect(fd.get('remarks')).toBe('Office cleaning supplies')
    expect(fd.get('vendor')).toBeNull()
    expect(fd.get('employee_ref_id')).toBeNull()
  })
})

const REJECTED_EXPENSE = {
  id: 77,
  category: 'Bus Fare',
  gl_code: '70439',
  amount: 500,
  vendor: 'ACME Supplies',
  vendor_card_code: 'V001',
  pay_to_type: 'vendor',
  expense_type: 'vendor',
  type_label: 'Vendor',
  paid_to: 'ACME Supplies',
  bill_date: '2026-09-21',
  bill_description: 'Site visit',
  remarks: 'Site visit',
  status: 'rejected',
  submitted_by: 'Tester',
  anju_rejected_reason: 'Please add the fare breakup',
  reapply_count: 2,
  billImageUrl: '/uploads/expense_portal/old.png',
}

describe('Expenses — reapply a rejected expense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.get as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === `${endpoints.expenses}/77`) {
        return Promise.resolve({
          data: { data: { ...REJECTED_EXPENSE, bills: [{ bill_image_path: 'expense_portal/old.png', billImageUrl: '/uploads/expense_portal/old.png' }] } },
        })
      }
      return Promise.resolve({ data: { data: [REJECTED_EXPENSE], requests: [] } })
    })
    ;(api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } })
    localStorage.clear()
  })

  it('shows the rejection reason + Reapplied count and posts to the reapply endpoint with existing bill', async () => {
    const user = userEvent.setup()
    render(<Expenses />)

    await waitFor(() => expect(screen.getByText(/Please add the fare breakup/i)).toBeInTheDocument())
    expect(screen.getByText(/Reapplied 2×/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Fix & Reapply/i }))

    await waitFor(() => expect(screen.getByText(/Reapply expense #77/i)).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(/1 file attached/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Resubmit for Approval/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalled())
    const call = (api.post as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)!
    expect(call[0]).toBe(endpoints.expenseReapply(77))
    const fd = call[1] as FormData
    expect(fd.get('category')).toBe('Bus Fare')
    expect(fd.get('amount')).toBe('500')
    expect(fd.get('pay_to_type')).toBe('vendor')
    expect(fd.get('vendor')).toBe('ACME Supplies')
    expect(JSON.parse(String(fd.get('preUploadedBills')))).toContain('expense_portal/old.png')
  })

  it('surfaces a friendly message on 409 (expense no longer rejected)', async () => {
    ;(api.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      Object.assign(new Error('conflict'), { isAxiosError: true, response: { status: 409 } }),
    )
    const user = userEvent.setup()
    render(<Expenses />)

    await waitFor(() => expect(screen.getByRole('button', { name: /Fix & Reapply/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Fix & Reapply/i }))
    await waitFor(() => expect(screen.getByText(/Reapply expense #77/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Resubmit for Approval/i }))

    await waitFor(() => expect(screen.getByText(/no longer rejected/i)).toBeInTheDocument())
  })
})

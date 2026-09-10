import { useState } from 'react'
import axios from 'axios'
import { api, API_BASE, endpoints } from '../api/client'
import { useAuth } from '../auth/AuthContext'

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void }

type Toast = { kind: 'ok' | 'err'; msg: string }

const emptyForm = {
  vendorName: '',
  contactPerson: '',
  phone: '',
  email: '',
  gstin: '',
  pan: '',
  billingAddress: '',
  billingCity: '',
  billingState: '',
  billingPincode: '',
  reason: '',
}

export default function CreateVendorModal({ open, onClose, onSuccess }: Props) {
  const { concern } = useAuth()
  const [form, setForm] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const setField = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const close = () => {
    if (submitting) return
    setForm({ ...emptyForm })
    setToast(null)
    onClose()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const vendorName = form.vendorName.trim()
    const phone = form.phone.trim()
    const billingAddress = form.billingAddress.trim()
    const billingCity = form.billingCity.trim()
    if (!vendorName) return setToast({ kind: 'err', msg: 'Enter the vendor name' })
    if (!/^\d{10}$/.test(phone)) return setToast({ kind: 'err', msg: 'Enter a valid 10-digit phone' })
    if (!billingAddress) return setToast({ kind: 'err', msg: 'Enter the billing address' })
    if (!billingCity) return setToast({ kind: 'err', msg: 'Enter the city' })

    setSubmitting(true)
    try {
      const { data } = await api.post(`${API_BASE}${endpoints.vendorRequest}`, {
        vendorName,
        contactPerson: form.contactPerson.trim(),
        phone,
        email: form.email.trim(),
        gstin: form.gstin.trim(),
        pan: form.pan.trim(),
        billingAddress,
        billingCity,
        billingState: form.billingState.trim(),
        billingPincode: form.billingPincode.trim(),
        reason: form.reason.trim(),
        requestedBy: concern?.name,
        requestedByUserId: concern?.mobile,
        requestedFrom: 'expense-portal',
      })
      if (data?.success) {
        setToast({ kind: 'ok', msg: 'Vendor request sent to Accounts for approval' })
        setForm({ ...emptyForm })
        onSuccess?.()
        onClose()
      } else {
        setToast({ kind: 'err', msg: data?.error || 'Could not send the vendor request' })
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : 'Could not send the vendor request'
      setToast({ kind: 'err', msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm animate-fade sm:items-center" onClick={close}>
      <div className="max-h-[94dvh] w-full overflow-hidden rounded-t-3xl bg-white shadow-card-lg animate-sheet sm:max-w-lg sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Request New Vendor</h3>
            <p className="text-[12px] text-slate-500">Accounts will review and add this vendor</p>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-slate-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        <form onSubmit={submit} className="flex max-h-[80dvh] flex-col">
          <div className="space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Vendor name *</label>
              <input
                type="text"
                value={form.vendorName}
                onChange={(e) => setField('vendorName', e.target.value)}
                placeholder="Registered / trade name"
                className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Contact person</label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setField('contactPerson', e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Phone *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] tnum text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="vendor@email.com"
                className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">GSTIN</label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => setField('gstin', e.target.value.toUpperCase())}
                  placeholder="15-char GSTIN"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] uppercase text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">PAN</label>
                <input
                  type="text"
                  value={form.pan}
                  onChange={(e) => setField('pan', e.target.value.toUpperCase())}
                  placeholder="10-char PAN"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] uppercase text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Billing address *</label>
              <textarea
                rows={2}
                value={form.billingAddress}
                onChange={(e) => setField('billingAddress', e.target.value)}
                placeholder="Street, area, landmark"
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">City *</label>
                <input
                  type="text"
                  value={form.billingCity}
                  onChange={(e) => setField('billingCity', e.target.value)}
                  placeholder="City"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">State</label>
                <input
                  type="text"
                  value={form.billingState}
                  onChange={(e) => setField('billingState', e.target.value)}
                  placeholder="State"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Pincode</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.billingPincode}
                  onChange={(e) => setField('billingPincode', e.target.value.replace(/\D/g, ''))}
                  placeholder="Pincode"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] tnum text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Reason</label>
              <textarea
                rows={2}
                value={form.reason}
                onChange={(e) => setField('reason', e.target.value)}
                placeholder="Why this vendor is needed"
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl gradient-brand py-3 text-[14px] font-semibold text-white shadow-brand transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
            >
              {submitting ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
              ) : null}
              {submitting ? 'Sending…' : 'Send Request to Accounts'}
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold text-white shadow-card-lg animate-rise ${
            toast.kind === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.kind === 'ok' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

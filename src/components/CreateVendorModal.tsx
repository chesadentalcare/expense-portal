import { useEffect, useState } from 'react'
import axios from 'axios'
import { api, API_BASE, endpoints } from '../api/client'
import { useAuth } from '../auth/AuthContext'

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void; editRequest?: any }

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

const fromRequest = (r: any): typeof emptyForm => ({
  vendorName: r?.vendor_name || '',
  contactPerson: r?.contact_person || '',
  phone: r?.phone || '',
  email: r?.email || '',
  gstin: r?.gstin || '',
  pan: r?.pan || '',
  billingAddress: r?.billing_address || '',
  billingCity: r?.billing_city || '',
  billingState: r?.billing_state || '',
  billingPincode: r?.billing_pincode || '',
  reason: r?.reason || '',
})

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 placeholder:text-slate-300'
const invalidCls = 'border-rose-300 focus:border-rose-300 focus:ring-rose-200'
const labelCls = 'mb-1 block text-xs text-slate-500'

export default function CreateVendorModal({ open, onClose, onSuccess, editRequest }: Props) {
  const { concern } = useAuth()
  const [form, setForm] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [updated, setUpdated] = useState(false)
  const [inlineError, setInlineError] = useState('')

  const isEdit = !!editRequest

  useEffect(() => {
    if (!open) return
    setForm(editRequest ? fromRequest(editRequest) : { ...emptyForm })
    setSubmitted(false)
    setCreatedId(null)
    setUpdated(false)
    setInlineError('')
    setToast(null)
  }, [open, editRequest])

  const setField = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const vendorName = form.vendorName.trim()
  const phone = form.phone.trim()
  const billingAddress = form.billingAddress.trim()
  const billingCity = form.billingCity.trim()
  const phoneOk = /^\d{10}$/.test(phone)
  const err = {
    vendorName: submitted && !vendorName,
    phone: submitted && !phoneOk,
    billingAddress: submitted && !billingAddress,
    billingCity: submitted && !billingCity,
  }

  const close = () => {
    if (submitting) return
    onClose()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setInlineError('')
    if (!vendorName) return setToast({ kind: 'err', msg: 'Enter the vendor name' })
    if (!phoneOk) return setToast({ kind: 'err', msg: 'Enter a valid 10-digit phone' })
    if (!billingAddress) return setToast({ kind: 'err', msg: 'Enter the billing address' })
    if (!billingCity) return setToast({ kind: 'err', msg: 'Enter the city' })

    setSubmitting(true)
    try {
      const fields = {
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
      }
      const { data } = isEdit
        ? await api.post(`${API_BASE}${endpoints.vendorRequestUpdate}`, { id: editRequest.id, ...fields })
        : await api.post(`${API_BASE}${endpoints.vendorRequest}`, {
            ...fields,
            requestedBy: concern?.name,
            requestedByUserId: concern?.mobile,
            requestedFrom: 'expense-portal',
          })
      if (data?.success) {
        if (isEdit) {
          setUpdated(true)
          setToast({ kind: 'ok', msg: 'Request updated' })
          onSuccess?.()
          close()
        } else {
          setCreatedId(typeof data.id === 'number' ? data.id : null)
          setToast({ kind: 'ok', msg: 'Vendor request sent to Accounts for approval' })
          onSuccess?.()
        }
      } else {
        const msg = data?.error || 'Could not save the vendor request'
        setInlineError(msg)
        setToast({ kind: 'err', msg })
      }
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Could not save the vendor request'
      setInlineError(msg)
      setToast({ kind: 'err', msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const success = !isEdit && createdId !== null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm animate-fade sm:items-center" onClick={close}>
      <div className="max-h-[94dvh] w-full overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-card-lg animate-sheet sm:max-w-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">{isEdit ? 'Edit vendor request' : 'Request New Vendor'}</h3>
            <p className="text-xs text-slate-500">{isEdit ? 'Update details before Accounts reviews it' : 'Accounts will review and add this vendor'}</p>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-slate-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 animate-pop">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h4 className="mt-4 text-base font-semibold text-slate-900">Request sent</h4>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
              Vendor request #{createdId} has been sent to Accounts for approval. It'll appear in the vendor list once approved.
            </p>
            <button
              onClick={close}
              className="mt-6 w-full rounded-lg gradient-brand py-2.5 text-sm font-semibold text-white shadow-brand transition hover:brightness-105 active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex max-h-[80dvh] flex-col">
            <div className="space-y-3 overflow-y-auto px-5 py-4">
              <div>
                <label className={labelCls}>Vendor name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={form.vendorName}
                  onChange={(e) => setField('vendorName', e.target.value)}
                  placeholder="Registered / trade name"
                  className={`${inputCls} ${err.vendorName ? invalidCls : ''}`}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Contact person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => setField('contactPerson', e.target.value)}
                    placeholder="Name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone <span className="text-rose-400">*</span></label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit"
                    className={`${inputCls} tnum ${err.phone ? invalidCls : ''}`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="vendor@email.com"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>GSTIN</label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setField('gstin', e.target.value.toUpperCase())}
                    placeholder="15-char GSTIN"
                    className={`${inputCls} uppercase`}
                  />
                </div>
                <div>
                  <label className={labelCls}>PAN</label>
                  <input
                    type="text"
                    value={form.pan}
                    onChange={(e) => setField('pan', e.target.value.toUpperCase())}
                    placeholder="10-char PAN"
                    className={`${inputCls} uppercase`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Billing address <span className="text-rose-400">*</span></label>
                <textarea
                  rows={2}
                  value={form.billingAddress}
                  onChange={(e) => setField('billingAddress', e.target.value)}
                  placeholder="Street, area, landmark"
                  className={`${inputCls} resize-none ${err.billingAddress ? invalidCls : ''}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>City <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={form.billingCity}
                    onChange={(e) => setField('billingCity', e.target.value)}
                    placeholder="City"
                    className={`${inputCls} ${err.billingCity ? invalidCls : ''}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input
                    type="text"
                    value={form.billingState}
                    onChange={(e) => setField('billingState', e.target.value)}
                    placeholder="State"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelCls}>Pincode</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.billingPincode}
                    onChange={(e) => setField('billingPincode', e.target.value.replace(/\D/g, ''))}
                    placeholder="Pincode"
                    className={`${inputCls} tnum`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Reason</label>
                <textarea
                  rows={2}
                  value={form.reason}
                  onChange={(e) => setField('reason', e.target.value)}
                  placeholder="Why this vendor is needed"
                  className={`${inputCls} resize-none`}
                />
              </div>

              {inlineError && (
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" strokeLinecap="round" /></svg>
                  <span>{inlineError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-5 py-3.5">
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || updated}
                className="flex flex-[2] items-center justify-center gap-2 rounded-lg gradient-brand py-2.5 text-sm font-semibold text-white shadow-brand transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
              >
                {submitting ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                ) : null}
                {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Send Request to Accounts'}
              </button>
            </div>
          </form>
        )}
      </div>

      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-card-lg animate-rise ${
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

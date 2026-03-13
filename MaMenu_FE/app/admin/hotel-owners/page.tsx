'use client'

import { useEffect, useState, FormEvent } from 'react'
import { Plus, Search, Users, Mail, Phone, Hotel, Loader2, CheckCircle } from 'lucide-react'
import { getHotelOwners, createHotelOwner } from '@/lib/api'
import type { User } from '@/types'
import Modal from '@/components/Modal'

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' }

export default function HotelOwnersPage() {
  const [owners, setOwners]     = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')
  const [success, setSuccess]       = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await getHotelOwners()
      const data = res.data ?? []
      setOwners(data)
      setFiltered(data)
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(owners.filter((o) =>
      o.name.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      (o.phone ?? '').includes(q)
    ))
  }, [search, owners])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await createHotelOwner(form)
      setSuccess('Hotel owner created successfully!')
      setForm(EMPTY_FORM)
      await load()
      setTimeout(() => {
        setModalOpen(false)
        setSuccess('')
      }, 1500)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create hotel owner')
    } finally {
      setSubmitting(false)
    }
  }

  function openModal() {
    setForm(EMPTY_FORM)
    setFormError('')
    setSuccess('')
    setModalOpen(true)
  }

  return (
    <div className="p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotel Owners</h1>
          <p className="text-slate-500 text-sm mt-1">Manage accounts that own hotels</p>
        </div>
        <button onClick={openModal} className="btn-primary">
          <Plus size={16} />
          Add Hotel Owner
        </button>
      </div>

      {/* search + count */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} owner{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hotels</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Users size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 text-sm">
                      {search ? 'No owners match your search' : 'No hotel owners yet'}
                    </p>
                    {!search && (
                      <button onClick={openModal} className="mt-4 btn-primary text-xs px-3 py-1.5">
                        <Plus size={14} /> Add first owner
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-violet-600">
                            {o.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{o.name}</p>
                          <p className="text-xs text-slate-400">ID: {o.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail size={13} className="text-slate-400" />
                          {o.email}
                        </div>
                        {o.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <Phone size={12} className="text-slate-400" />
                            {o.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Hotel size={14} className="text-slate-400" />
                        <span className="font-medium text-slate-700">
                          {o.hotel_ids?.length ?? 0}
                        </span>
                        <span className="text-slate-400 text-xs">hotel{(o.hotel_ids?.length ?? 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${o.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {o.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Hotel Owner">
        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle size={44} className="text-emerald-500" />
            <p className="text-slate-700 font-medium">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name *</label>
                <input
                  className="input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="owner@hotel.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            </div>

            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : 'Create Owner'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

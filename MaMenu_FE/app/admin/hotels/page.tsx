'use client'

import { useEffect, useState, FormEvent } from 'react'
import { Plus, Search, Building2, MapPin, User, Phone, Loader2, CheckCircle } from 'lucide-react'
import { getHotels, createHotel, getHotelOwners } from '@/lib/api'
import type { Hotel, User as UserType } from '@/types'
import Modal from '@/components/Modal'

const EMPTY_FORM = {
  name: '', owner_id: '', phone: '', email: '',
  address: '', city: '', state: '', country: '', pincode: '',
}

export default function HotelsPage() {
  const [hotels, setHotels]     = useState<Hotel[]>([])
  const [filtered, setFiltered] = useState<Hotel[]>([])
  const [owners, setOwners]     = useState<UserType[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')
  const [success, setSuccess]       = useState('')

  async function load() {
    setLoading(true)
    try {
      const [hotelsRes, ownersRes] = await Promise.all([getHotels(), getHotelOwners()])
      const data = hotelsRes.data ?? []
      setHotels(data)
      setFiltered(data)
      setOwners(ownersRes.data ?? [])
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(hotels.filter((h) =>
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.country.toLowerCase().includes(q) ||
      (h.phone ?? '').includes(q)
    ))
  }, [search, hotels])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await createHotel(form)
      setSuccess('Hotel created successfully!')
      setForm(EMPTY_FORM)
      await load()
      setTimeout(() => {
        setModalOpen(false)
        setSuccess('')
      }, 1500)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create hotel')
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

  function ownerName(ownerID: string) {
    const o = owners.find((u) => u.id === ownerID)
    return o ? o.name : '—'
  }

  return (
    <div className="p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotels</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all hotels on the platform</p>
        </div>
        <button onClick={openModal} className="btn-primary">
          <Plus size={16} />
          Add Hotel
        </button>
      </div>

      {/* search + count */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name, city or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} hotel{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hotel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Building2 size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 text-sm">
                      {search ? 'No hotels match your search' : 'No hotels yet'}
                    </p>
                    {!search && (
                      <button onClick={openModal} className="mt-4 btn-primary text-xs px-3 py-1.5">
                        <Plus size={14} /> Add first hotel
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                          <Building2 size={16} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{h.name}</p>
                          <p className="text-xs text-slate-400">ID: {h.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span>{h.city}, {h.state}, {h.country}</span>
                      </div>
                      {h.address && (
                        <p className="text-xs text-slate-400 mt-0.5 ml-5">{h.address}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User size={13} className="text-slate-400" />
                        <span>{ownerName(h.owner_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {h.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone size={13} className="text-slate-400" />
                          {h.phone}
                        </div>
                      )}
                      {h.email && (
                        <p className="text-xs text-slate-400 mt-0.5">{h.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${h.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {h.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(h.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Hotel" size="lg">
        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle size={44} className="text-emerald-500" />
            <p className="text-slate-700 font-medium">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Hotel name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hotel name *</label>
                <input
                  className="input"
                  placeholder="Grand Palace Hotel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {/* Owner */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Owner *</label>
                <select
                  className="input"
                  value={form.owner_id}
                  onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
                  required
                >
                  <option value="">Select an owner…</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                  ))}
                </select>
              </div>

              {/* Phone & Email */}
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="hotel@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Address */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <input
                  className="input"
                  placeholder="123 Main Street"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {/* City & State */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City *</label>
                <input
                  className="input"
                  placeholder="Mumbai"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">State *</label>
                <input
                  className="input"
                  placeholder="Maharashtra"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                />
              </div>

              {/* Country & Pincode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Country *</label>
                <input
                  className="input"
                  placeholder="India"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pincode</label>
                <input
                  className="input"
                  placeholder="400001"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
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
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : 'Create Hotel'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

'use client'

import { useEffect, useState, FormEvent } from 'react'
import {
  Plus, QrCode, Pencil, Trash2, Users, Loader2, CheckCircle, Grid3x3, List
} from 'lucide-react'
import { getTables, createTable, createTablesBulk, updateTable, setTableStatus, deleteTable } from '@/lib/api'
import { getProfile } from '@/lib/api'
import type { Table, Hotel } from '@/types'
import Modal from '@/components/Modal'
import QRModal from '@/components/QRModal'

const EMPTY_FORM = { number: '', label: '', capacity: '' }

export default function TablesPage() {
  const [tables,   setTables]   = useState<Table[]>([])
  const [hotel,    setHotel]    = useState<Hotel | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // create/edit modal
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<Table | null>(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState('')
  const [success,     setSuccess]     = useState('')

  // QR modal
  const [qrTable, setQrTable] = useState<Table | null>(null)

  // delete confirm
  const [deleteTarget,    setDeleteTarget]    = useState<Table | null>(null)
  const [deleteLoading,   setDeleteLoading]   = useState(false)

  // bulk create
  const [bulkOpen,        setBulkOpen]        = useState(false)
  const [bulkForm,        setBulkForm]        = useState({ start_number: '', count: '', capacity: '', label_prefix: '' })
  const [bulkSubmitting,  setBulkSubmitting]  = useState(false)
  const [bulkError,       setBulkError]       = useState('')
  const [bulkSuccess,     setBulkSuccess]     = useState('')

  async function load() {
    setLoading(true)
    try {
      const [tablesRes, profileRes] = await Promise.all([getTables(), getProfile()])
      setTables(tablesRes.data ?? [])
      setHotel(profileRes.active_hotel)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setSuccess('')
    setModalOpen(true)
  }

  function openEdit(t: Table) {
    setEditTarget(t)
    setForm({ number: String(t.number), label: t.label, capacity: String(t.capacity) })
    setFormError('')
    setSuccess('')
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      if (editTarget) {
        await updateTable(editTarget.id, {
          label:    form.label,
          capacity: form.capacity ? Number(form.capacity) : undefined,
        })
        setSuccess('Table updated!')
      } else {
        await createTable({
          number:   Number(form.number),
          label:    form.label,
          capacity: form.capacity ? Number(form.capacity) : 4,
        })
        setSuccess('Table created!')
      }
      await load()
      setTimeout(() => { setModalOpen(false); setSuccess('') }, 1300)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleOccupied(t: Table) {
    try {
      await setTableStatus(t.id, !t.is_occupied)
      setTables((prev) => prev.map((x) => x.id === t.id ? { ...x, is_occupied: !x.is_occupied } : x))
    } catch (e) { console.error(e) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteTable(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (e) { console.error(e) }
    finally { setDeleteLoading(false) }
  }

  function openBulk() {
    setBulkForm({ start_number: '', count: '', capacity: '', label_prefix: '' })
    setBulkError('')
    setBulkSuccess('')
    setBulkOpen(true)
  }

  async function handleBulkSubmit(e: FormEvent) {
    e.preventDefault()
    setBulkError('')
    setBulkSubmitting(true)
    try {
      const res = await createTablesBulk({
        start_number: Number(bulkForm.start_number),
        count:        Number(bulkForm.count),
        capacity:     bulkForm.capacity ? Number(bulkForm.capacity) : undefined,
        label_prefix: bulkForm.label_prefix || undefined,
      })
      setBulkSuccess(res.message)
      await load()
      setTimeout(() => { setBulkOpen(false); setBulkSuccess('') }, 1500)
    } catch (err: unknown) {
      setBulkError(err instanceof Error ? err.message : 'Failed to create tables')
    } finally {
      setBulkSubmitting(false)
    }
  }

  const activeTables = tables.filter((t) => t.is_active)

  return (
    <div className="p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tables</h1>
          <p className="text-slate-500 text-sm mt-1">Manage seating and generate QR codes</p>
        </div>
        <div className="flex items-center gap-3">
          {/* view toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            ><Grid3x3 size={16} /></button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            ><List size={16} /></button>
          </div>
          <button onClick={openBulk} className="btn-secondary">
            <Plus size={16} /> Bulk Add
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Add Table
          </button>
        </div>
      </div>

      {/* summary pills */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { label: 'Total', value: activeTables.length, color: 'bg-slate-100 text-slate-700' },
          { label: 'Occupied', value: activeTables.filter((t) => t.is_occupied).length, color: 'bg-amber-100 text-amber-700' },
          { label: 'Free', value: activeTables.filter((t) => !t.is_occupied).length, color: 'bg-emerald-100 text-emerald-700' },
        ].map(({ label, value, color }) => (
          <span key={label} className={`px-4 py-1.5 rounded-full text-sm font-medium ${color}`}>
            {label}: {loading ? '…' : value}
          </span>
        ))}
      </div>

      {/* grid view */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="card h-36 animate-pulse bg-slate-100" />
            ))
          ) : activeTables.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <Grid3x3 size={36} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">No tables yet</p>
              <button onClick={openCreate} className="btn-primary mt-4 text-xs px-3 py-1.5">
                <Plus size={14} /> Add first table
              </button>
            </div>
          ) : (
            activeTables.map((t) => (
              <div
                key={t.id}
                className={`card flex flex-col items-center gap-2 p-4 relative group cursor-pointer select-none
                  ${t.is_occupied ? 'ring-2 ring-amber-400 bg-amber-50' : 'hover:ring-2 hover:ring-brand-300'}`}
                onClick={() => handleToggleOccupied(t)}
              >
                {/* occupancy dot */}
                <span className={`w-3 h-3 rounded-full absolute top-3 right-3 ${t.is_occupied ? 'bg-amber-400' : 'bg-emerald-400'}`} />

                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mt-1">
                  <span className="text-lg font-bold text-slate-700">{t.number}</span>
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800 leading-none">{t.label || `Table ${t.number}`}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                    <Users size={11} /> {t.capacity || '—'}
                  </p>
                </div>

                <p className={`text-xs font-medium mt-1 ${t.is_occupied ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {t.is_occupied ? 'Occupied' : 'Available'}
                </p>

                {/* hover actions */}
                <div className="absolute inset-0 rounded-2xl bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity
                                flex items-center justify-center gap-2"
                     onClick={(e) => e.stopPropagation()}>
                  <button title="QR Code" onClick={() => setQrTable(t)}
                    className="p-2 bg-white rounded-lg hover:bg-brand-50 text-slate-700 hover:text-brand-600 transition-colors">
                    <QrCode size={15} />
                  </button>
                  <button title="Edit" onClick={() => openEdit(t)}
                    className="p-2 bg-white rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button title="Delete" onClick={() => setDeleteTarget(t)}
                    className="p-2 bg-white rounded-lg hover:bg-red-50 text-slate-700 hover:text-red-600 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* list view */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {['Table', 'Label', 'Capacity', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : activeTables.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-sm">No tables yet</td></tr>
                ) : activeTables.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800">#{t.number}</td>
                    <td className="px-5 py-3 text-slate-700">{t.label || <span className="text-slate-400">—</span>}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-slate-600"><Users size={13} /> {t.capacity || '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleToggleOccupied(t)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors
                          ${t.is_occupied
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.is_occupied ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {t.is_occupied ? 'Occupied' : 'Available'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQrTable(t)} title="QR Code"
                          className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors">
                          <QrCode size={15} />
                        </button>
                        <button onClick={() => openEdit(t)} title="Edit"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? `Edit Table #${editTarget.number}` : 'Add New Table'}
      >
        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle size={44} className="text-emerald-500" />
            <p className="text-slate-700 font-medium">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Table number *</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  placeholder="1"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                  disabled={!!editTarget}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity (seats)</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  placeholder="4"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Label / Name</label>
                <input
                  className="input"
                  placeholder="e.g. Window seat, VIP Table 1"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
            </div>

            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : editTarget ? 'Save Changes' : 'Add Table'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* QR Modal */}
      {qrTable && (
        <QRModal
          open={!!qrTable}
          onClose={() => setQrTable(null)}
          tableNumber={qrTable.number}
          tableLabel={qrTable.label}
          qrValue={qrTable.qr_code}
          hotelName={hotel?.name}
        />
      )}

      {/* Bulk Create Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Add Tables">
        {bulkSuccess ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle size={44} className="text-emerald-500" />
            <p className="text-slate-700 font-medium">{bulkSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <p className="text-sm text-slate-500">Generate multiple tables at once with sequential numbers.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Starting number *</label>
                <input
                  type="number" min={1} className="input" placeholder="1"
                  value={bulkForm.start_number}
                  onChange={(e) => setBulkForm({ ...bulkForm, start_number: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Number of tables *</label>
                <input
                  type="number" min={1} max={50} className="input" placeholder="10"
                  value={bulkForm.count}
                  onChange={(e) => setBulkForm({ ...bulkForm, count: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity per table</label>
                <input
                  type="number" min={1} className="input" placeholder="4 (default)"
                  value={bulkForm.capacity}
                  onChange={(e) => setBulkForm({ ...bulkForm, capacity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Label prefix</label>
                <input
                  className="input" placeholder="e.g. Table"
                  value={bulkForm.label_prefix}
                  onChange={(e) => setBulkForm({ ...bulkForm, label_prefix: e.target.value })}
                />
              </div>
            </div>
            {bulkForm.start_number && bulkForm.count && (
              <p className="text-xs text-slate-400">
                Will create tables #{bulkForm.start_number} – #{Number(bulkForm.start_number) + Number(bulkForm.count) - 1}
                {bulkForm.label_prefix ? ` labeled "${bulkForm.label_prefix} N"` : ''}.
              </p>
            )}
            {bulkError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{bulkError}</div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setBulkOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={bulkSubmitting} className="btn-primary flex-1">
                {bulkSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : 'Create Tables'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Table" size="sm">
        <p className="text-slate-600 text-sm mb-6">
          Remove <strong>Table #{deleteTarget?.number}</strong>{deleteTarget?.label ? ` (${deleteTarget.label})` : ''}?
          This will deactivate it and hide from guests.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={deleteLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Remove
          </button>
        </div>
      </Modal>
    </div>
  )
}

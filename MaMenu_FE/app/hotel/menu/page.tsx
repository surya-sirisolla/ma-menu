'use client'

import { useEffect, useState, FormEvent } from 'react'
import {
  Plus, Search, Pencil, Trash2, Loader2, CheckCircle,
  UtensilsCrossed, IndianRupee, Tag, Image as ImageIcon, X
} from 'lucide-react'
import {
  getMenuItems, createMenuItem, updateMenuItem,
  toggleAvailability, deleteMenuItem, getCategories
} from '@/lib/api'
import type { MenuItem, CategoryTree } from '@/types'
import Modal from '@/components/Modal'

const EMPTY_FORM = {
  name: '', description: '', price: '',
  category_id: '', image_url: '', is_veg: 'true', tags: '',
}

export default function MenuPage() {
  const [items,       setItems]       = useState<MenuItem[]>([])
  const [filtered,    setFiltered]    = useState<MenuItem[]>([])
  const [categories,  setCategories]  = useState<CategoryTree[]>([])
  const [flatCats,    setFlatCats]    = useState<CategoryTree[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('')
  const [vegFilter,   setVegFilter]   = useState<'all' | 'veg' | 'non-veg'>('all')

  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<MenuItem | null>(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState('')
  const [success,     setSuccess]     = useState('')

  const [deleteTarget,  setDeleteTarget]  = useState<MenuItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [menuRes, catsRes] = await Promise.all([getMenuItems(), getCategories()])
      setItems(menuRes.data ?? [])
      const tree = catsRes.data ?? []
      setCategories(tree)
      setFlatCats(flattenTree(tree))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = items
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (catFilter) result = result.filter((i) => i.category_id === catFilter)
    if (vegFilter === 'veg')     result = result.filter((i) => i.is_veg)
    if (vegFilter === 'non-veg') result = result.filter((i) => !i.is_veg)
    setFiltered(result)
  }, [items, search, catFilter, vegFilter])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setSuccess('')
    setModalOpen(true)
  }

  function openEdit(item: MenuItem) {
    setEditTarget(item)
    setForm({
      name:        item.name,
      description: item.description ?? '',
      price:       String(item.price),
      category_id: item.category_id,
      image_url:   item.image_url ?? '',
      is_veg:      item.is_veg ? 'true' : 'false',
      tags:        item.tags?.join(', ') ?? '',
    })
    setFormError('')
    setSuccess('')
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (editTarget) {
        await updateMenuItem(editTarget.id, {
          name:        form.name,
          description: form.description,
          price:       Number(form.price),
          image_url:   form.image_url,
          is_veg:      form.is_veg === 'true',
          tags,
        })
        setSuccess('Item updated!')
      } else {
        await createMenuItem({
          name:        form.name,
          description: form.description,
          price:       Number(form.price),
          category_id: form.category_id,
          image_url:   form.image_url,
          is_veg:      form.is_veg === 'true',
          tags,
        })
        setSuccess('Item added!')
      }
      await load()
      setTimeout(() => { setModalOpen(false); setSuccess('') }, 1300)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(item: MenuItem) {
    setTogglingId(item.id)
    try {
      await toggleAvailability(item.id, !item.is_available)
      setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, is_available: !x.is_available } : x))
    } catch (e) { console.error(e) }
    finally { setTogglingId(null) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteMenuItem(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (e) { console.error(e) }
    finally { setDeleteLoading(false) }
  }

  function catName(id: string) {
    return flatCats.find((c) => c.id === id)?.name ?? '—'
  }

  return (
    <div className="p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menu</h1>
          <p className="text-slate-500 text-sm mt-1">Add and manage dishes, drinks, and specials</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* search */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* category filter */}
        <select
          className="input w-auto min-w-40"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {flatCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* veg filter */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
          {(['all', 'veg', 'non-veg'] as const).map((v) => (
            <button key={v} onClick={() => setVegFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${vegFilter === v ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              {v === 'all' ? 'All' : v === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
            </button>
          ))}
        </div>

        {/* clear filters */}
        {(search || catFilter || vegFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setCatFilter(''); setVegFilter('all') }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors">
            <X size={13} /> Clear
          </button>
        )}

        <span className="text-sm text-slate-400 ml-auto">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* items grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-52 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <UtensilsCrossed size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400">
            {search || catFilter || vegFilter !== 'all' ? 'No items match your filters' : 'No menu items yet'}
          </p>
          {!search && !catFilter && vegFilter === 'all' && (
            <button onClick={openCreate} className="btn-primary mt-4 text-xs px-3 py-1.5">
              <Plus size={14} /> Add first item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className={`card flex flex-col gap-3 group relative ${!item.is_available ? 'opacity-60' : ''}`}>
              {/* image or placeholder */}
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.name}
                  className="w-full h-36 object-cover rounded-xl bg-slate-100" />
              ) : (
                <div className="w-full h-36 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                  <ImageIcon size={28} className="text-slate-200" />
                </div>
              )}

              {/* veg dot */}
              <span className={`absolute top-5 left-5 w-3 h-3 rounded-full border-2 border-white shadow
                ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />

              {/* availability badge */}
              <span className={`absolute top-5 right-5 text-xs px-2 py-0.5 rounded-full font-medium
                ${item.is_available ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {item.is_available ? 'On' : 'Off'}
              </span>

              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-sm leading-snug">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center text-sm font-bold text-slate-900">
                    <IndianRupee size={12} className="mr-0.5" />{item.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Tag size={11} /> {catName(item.category_id)}
                  </span>
                </div>

                {/* tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* actions row */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                {/* availability toggle */}
                <button
                  onClick={() => handleToggle(item)}
                  disabled={togglingId === item.id}
                  title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-colors
                    ${item.is_available
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {togglingId === item.id ? <Loader2 size={12} className="animate-spin" /> : (
                    item.is_available ? '✓ Available' : '✗ Unavailable'
                  )}
                </button>

                <button onClick={() => openEdit(item)} title="Edit"
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(item)} title="Delete"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? `Edit "${editTarget.name}"` : 'Add Menu Item'}
        size="lg"
      >
        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle size={44} className="text-emerald-500" />
            <p className="text-slate-700 font-medium">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Item name *</label>
                <input
                  className="input"
                  placeholder="Paneer Butter Masala"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {/* category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                <select
                  className="input"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required={!editTarget}
                >
                  <option value="">Select category…</option>
                  {flatCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (₹) *</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="input"
                  placeholder="150.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>

              {/* description */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  className="input resize-none h-20"
                  placeholder="A rich, creamy curry made with paneer…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* is_veg */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                <div className="flex gap-3">
                  {[
                    { val: 'true',  label: '🟢 Vegetarian',     color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
                    { val: 'false', label: '🔴 Non-Vegetarian',  color: 'border-red-400 bg-red-50 text-red-700' },
                  ].map(({ val, label, color }) => (
                    <label key={val}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-medium cursor-pointer transition-colors
                        ${form.is_veg === val ? color : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="is_veg"
                        value={val}
                        checked={form.is_veg === val}
                        onChange={(e) => setForm({ ...form, is_veg: e.target.value })}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* image url */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Image URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://cdn.example.com/dish.jpg"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                />
              </div>

              {/* tags */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tags <span className="text-slate-400 font-normal">(comma separated)</span>
                </label>
                <input
                  className="input"
                  placeholder="spicy, bestseller, chef's special"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
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
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                  : editTarget ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Item" size="sm">
        <p className="text-slate-600 text-sm mb-6">
          Remove <strong>&quot;{deleteTarget?.name}&quot;</strong> from the menu?
          It will be hidden from guests immediately.
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

function flattenTree(nodes: CategoryTree[]): CategoryTree[] {
  const result: CategoryTree[] = []
  for (const n of nodes) {
    result.push(n)
    if (n.children?.length) result.push(...flattenTree(n.children))
  }
  return result
}

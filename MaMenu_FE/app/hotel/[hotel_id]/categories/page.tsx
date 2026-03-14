'use client'

import { useEffect, useState, FormEvent } from 'react'
import {
  Plus, ChevronRight, ChevronDown, Pencil, Trash2,
  Loader2, CheckCircle, Tag, FolderOpen, Folder
} from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api'
import type { CategoryTree } from '@/types'
import Modal from '@/components/Modal'

const EMPTY_FORM = { name: '', type: 'general', parent_id: '' }

export default function CategoriesPage() {
  const [tree,      setTree]      = useState<CategoryTree[]>([])
  const [flat,      setFlat]      = useState<CategoryTree[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set())

  const [modalOpen,  setModalOpen]  = useState(false)
  const [editTarget, setEditTarget] = useState<CategoryTree | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError,  setFormError]  = useState('')
  const [success,    setSuccess]    = useState('')

  const [deleteTarget,  setDeleteTarget]  = useState<CategoryTree | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await getCategories()
      const data = res.data ?? []
      setTree(data)
      setFlat(flattenTree(data))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openCreate(parentId?: string) {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, parent_id: parentId ?? '' })
    setFormError('')
    setSuccess('')
    setModalOpen(true)
  }

  function openEdit(cat: CategoryTree) {
    setEditTarget(cat)
    setForm({ name: cat.name, type: cat.type || 'general', parent_id: cat.parent_id ?? '' })
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
        await updateCategory(editTarget.id, { name: form.name, type: form.type })
        setSuccess('Category updated!')
      } else {
        await createCategory({
          name:      form.name,
          type:      form.type,
          parent_id: form.parent_id || undefined,
        })
        setSuccess('Category created!')
      }
      await load()
      setTimeout(() => { setModalOpen(false); setSuccess('') }, 1300)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (e) { console.error(e) }
    finally { setDeleteLoading(false) }
  }

  const CATEGORY_TYPES = ['general', 'veg', 'non-veg', 'vegan', 'beverages', 'desserts', 'specials', 'starters', 'mains', 'sides']

  const typeColor: Record<string, string> = {
    veg:        'bg-emerald-100 text-emerald-700',
    'non-veg':  'bg-red-100 text-red-700',
    vegan:      'bg-teal-100 text-teal-700',
    beverages:  'bg-sky-100 text-sky-700',
    desserts:   'bg-pink-100 text-pink-700',
    specials:   'bg-amber-100 text-amber-700',
    starters:   'bg-orange-100 text-orange-700',
    mains:      'bg-violet-100 text-violet-700',
    sides:      'bg-lime-100 text-lime-700',
    general:    'bg-slate-100 text-slate-600',
  }

  function renderNode(node: CategoryTree, depth = 0) {
    const hasChildren = (node.children?.length ?? 0) > 0
    const isExpanded  = expanded.has(node.id)

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-3 px-4 rounded-xl hover:bg-slate-50 group transition-colors
            ${depth > 0 ? 'ml-6 border-l-2 border-slate-100 pl-5' : ''}`}
        >
          {/* expand toggle */}
          <button
            onClick={() => hasChildren && toggleExpand(node.id)}
            className={`w-5 h-5 flex items-center justify-center text-slate-400 transition-colors
              ${hasChildren ? 'hover:text-slate-700 cursor-pointer' : 'cursor-default opacity-0'}`}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* folder icon */}
          <span className="text-slate-400">
            {hasChildren
              ? (isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />)
              : <Tag size={14} />
            }
          </span>

          {/* name */}
          <span className="flex-1 text-sm font-medium text-slate-800">{node.name}</span>

          {/* type badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[node.type] ?? typeColor.general}`}>
            {node.type || 'general'}
          </span>

          {/* child count */}
          {hasChildren && (
            <span className="text-xs text-slate-400">{node.children!.length} sub</span>
          )}

          {/* actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button title="Add subcategory" onClick={() => openCreate(node.id)}
              className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors">
              <Plus size={13} />
            </button>
            <button title="Edit" onClick={() => openEdit(node)}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
              <Pencil size={13} />
            </button>
            <button title="Delete" onClick={() => setDeleteTarget(node)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* children */}
        {isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-500 text-sm mt-1">
            Organise your menu with nested categories — e.g. Starters → Veg / Non-Veg
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setExpanded(new Set(flat.map((c) => c.id)))}
            className="btn-secondary text-xs">Expand all</button>
          <button onClick={() => setExpanded(new Set())}
            className="btn-secondary text-xs">Collapse</button>
          <button onClick={() => openCreate()} className="btn-primary">
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* type legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORY_TYPES.slice(0, 8).map((t) => (
          <span key={t} className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeColor[t]}`}>
            {t}
          </span>
        ))}
      </div>

      {/* tree */}
      <div className="card">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-11 bg-slate-100 rounded-xl animate-pulse" style={{ marginLeft: i % 3 === 0 ? 0 : 32 }} />
            ))}
          </div>
        ) : tree.length === 0 ? (
          <div className="py-16 text-center">
            <Tag size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">No categories yet</p>
            <button onClick={() => openCreate()} className="btn-primary mt-4 text-xs px-3 py-1.5">
              <Plus size={14} /> Create first category
            </button>
          </div>
        ) : (
          <div className="p-2">
            {tree.map((node) => renderNode(node, 0))}
          </div>
        )}
      </div>

      {/* stats */}
      {!loading && flat.length > 0 && (
        <p className="text-xs text-slate-400 mt-3 text-right">
          {tree.length} root categories · {flat.length} total
        </p>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? `Edit "${editTarget.name}"` : 'Add Category'}
      >
        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle size={44} className="text-emerald-500" />
            <p className="text-slate-700 font-medium">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category name *</label>
              <input
                className="input"
                placeholder="e.g. Starters, Veg Mains…"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {CATEGORY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            {!editTarget && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Parent category <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select
                  className="input"
                  value={form.parent_id}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                >
                  <option value="">— None (top level) —</option>
                  {flat.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

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
                  : editTarget ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category" size="sm">
        <p className="text-slate-600 text-sm mb-2">
          Delete <strong>&quot;{deleteTarget?.name}&quot;</strong>?
        </p>
        {(deleteTarget?.children?.length ?? 0) > 0 && (
          <p className="text-amber-600 text-xs mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠ This category has subcategories. Only this category will be deactivated — subcategories remain.
          </p>
        )}
        <p className="text-slate-400 text-xs mb-6">Menu items in this category will also be hidden.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={deleteLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete
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

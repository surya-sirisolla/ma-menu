'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ClipboardList, RefreshCw, IndianRupee, UtensilsCrossed,
  ChevronDown, Filter, Loader2
} from 'lucide-react'
import { getOrders, updateOrderStatus } from '@/lib/api'
import type { Order, OrderStatus } from '@/types'

/* ── config ──────────────────────────────────────────────── */

const STATUS_PIPELINE: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; next?: OrderStatus; nextLabel?: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   next: 'confirmed', nextLabel: 'Confirm' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',     next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200', next: 'ready',     nextLabel: 'Mark Ready' },
  ready:     { label: 'Ready',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', next: 'completed', nextLabel: 'Complete' },
  completed: { label: 'Completed', color: 'text-slate-600',   bg: 'bg-slate-100 border-slate-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
}

/* ── helpers ─────────────────────────────────────────────── */

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

/* ── order card ─────────────────────────────────────────── */

function OrderCard({ order, onStatusChange }: {
  order: Order
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>
}) {
  const [expanded,  setExpanded]  = useState(false)
  const [updating,  setUpdating]  = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const meta = STATUS_META[order.status]

  async function advance() {
    if (!meta.next) return
    setUpdating(true)
    await onStatusChange(order.id, meta.next)
    setUpdating(false)
  }

  async function cancel() {
    setCancelling(true)
    await onStatusChange(order.id, 'cancelled')
    setCancelling(false)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${meta.bg}`}>
      {/* top bar */}
      <div className={`px-4 py-2 flex items-center justify-between border-b ${meta.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
          {order.table_label || order.table_number > 0 ? (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <UtensilsCrossed size={11} />
              {order.table_label || `Table ${order.table_number}`}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-slate-400">{timeAgo(order.created_at)}</span>
      </div>

      {/* body */}
      <div className="px-4 py-3 bg-white">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">
              {order.customer_name || <span className="text-slate-400 font-normal">Anonymous</span>}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">#{order.id.slice(-8)}</p>
          </div>
          <p className="text-base font-black text-slate-900 flex items-center shrink-0">
            <IndianRupee size={13} className="mt-px" />{order.total_amount.toFixed(2)}
          </p>
        </div>

        {/* notes */}
        {order.notes && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-800">
            📝 {order.notes}
          </div>
        )}

        {/* items preview */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
          <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`w-3 h-3 rounded-sm border-2 shrink-0
                  ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                  <span className={`block w-1.5 h-1.5 rounded-full m-px ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                </span>
                <span className="flex-1 text-slate-700">{item.name}</span>
                <span className="text-slate-500 shrink-0">× {item.quantity}</span>
                <span className="font-medium text-slate-900 w-16 text-right shrink-0">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* actions */}
      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <div className="px-4 pb-3 flex gap-2">
          {meta.next && (
            <button
              onClick={advance}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {updating ? <Loader2 size={12} className="animate-spin" /> : null}
              {meta.nextLabel}
            </button>
          )}
          <button
            onClick={cancel}
            disabled={cancelling}
            className="px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelling ? <Loader2 size={12} className="animate-spin" /> : 'Cancel'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── page ────────────────────────────────────────────────── */

export default function OrdersPage() {
  const [orders,       setOrders]       = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await getOrders(statusFilter === 'all' ? undefined : statusFilter)
      // Sort newest first
      const sorted = (res.data ?? []).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setOrders(sorted)
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  // auto-refresh every 15s for active orders
  useEffect(() => {
    const interval = setInterval(() => load(true), 15000)
    return () => clearInterval(interval)
  }, [load])

  const handleStatusChange = useCallback(async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { console.error(e) }
  }, [])

  /* group by status for column view */
  const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready']
  const activeOrders   = orders.filter((o) => activeStatuses.includes(o.status))
  const historyOrders  = orders.filter((o) => !activeStatuses.includes(o.status))

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <div className="p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                {pendingCount} new
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">Auto-refreshes every 15 seconds</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="btn-secondary gap-2">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* filter chips */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter size={14} className="text-slate-400" />
        {(['all', ...STATUS_PIPELINE] as const).map((s) => {
          const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length
          const m     = s !== 'all' ? STATUS_META[s] : null
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                ${statusFilter === s
                  ? (m ? `${m.bg} ${m.color} border-current` : 'bg-slate-900 text-white border-slate-900')
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
              {s === 'all' ? 'All' : STATUS_META[s].label} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center">
          <ClipboardList size={44} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm">
            {statusFilter === 'all' ? 'No orders yet' : `No ${STATUS_META[statusFilter as OrderStatus]?.label} orders`}
          </p>
        </div>
      ) : (
        <>
          {/* active orders pipeline */}
          {activeOrders.length > 0 && (statusFilter === 'all' || activeStatuses.includes(statusFilter as OrderStatus)) && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Active · {activeOrders.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeOrders
                  .filter((o) => statusFilter === 'all' || o.status === statusFilter)
                  .map((order) => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))}
              </div>
            </div>
          )}

          {/* history */}
          {historyOrders.length > 0 && (statusFilter === 'all' || !activeStatuses.includes(statusFilter as OrderStatus)) && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                History · {historyOrders.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {historyOrders
                  .filter((o) => statusFilter === 'all' || o.status === statusFilter)
                  .map((order) => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

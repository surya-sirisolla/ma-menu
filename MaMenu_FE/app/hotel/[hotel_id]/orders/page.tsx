'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  ClipboardList, RefreshCw, IndianRupee, UtensilsCrossed,
  ChevronDown, Filter, Loader2, Wifi, WifiOff, X, Bell
} from 'lucide-react'
import { getOrders, updateOrderStatus } from '@/lib/api'
import { getToken } from '@/lib/auth'
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

/* ── Toast notification ──────────────────────────────────── */

interface Toast {
  id: string
  order: Order
}

function OrderToast({ toast, onDismiss, onAction }: {
  toast: Toast
  onDismiss: (id: string) => void
  onAction: (id: string, status: OrderStatus) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const order = toast.order
  const tableLabel = order.table_label || (order.table_number > 0 ? `Table ${order.table_number}` : 'No table')

  async function handleConfirm() {
    setConfirming(true)
    await onAction(order.id, 'confirmed')
    onDismiss(toast.id)
  }

  return (
    <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-in">
      {/* header */}
      <div className="bg-orange-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white font-bold text-sm">New Order!</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-200 text-xs">{tableLabel}</span>
          <button onClick={() => onDismiss(toast.id)}
            className="text-orange-200 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* body */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-800">
            {order.customer_name || 'Anonymous'}
          </p>
          <p className="text-sm font-black text-slate-900 flex items-center">
            <IndianRupee size={12} className="mr-0.5" />{order.total_amount.toFixed(2)}
          </p>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          {order.items.slice(0, 2).map((i) => ` · ${i.name}`).join('')}
          {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
        </p>

        {order.notes && (
          <p className="text-xs bg-amber-50 text-amber-700 px-2 py-1.5 rounded-lg mb-3 border border-amber-100">
            📝 {order.notes}
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {confirming ? <Loader2 size={12} className="animate-spin" /> : null}
          Confirm Order
        </button>
      </div>
    </div>
  )
}

/* ── order card ─────────────────────────────────────────── */

function OrderCard({ order, onStatusChange, isNew }: {
  order: Order
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>
  isNew?: boolean
}) {
  const [expanded,   setExpanded]   = useState(false)
  const [updating,   setUpdating]   = useState(false)
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
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all
      ${isNew ? 'ring-2 ring-orange-400 ring-offset-1' : ''} ${meta.bg}`}>
      {/* top bar */}
      <div className={`px-4 py-2 flex items-center justify-between border-b ${meta.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
          {isNew && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white animate-pulse">NEW</span>
          )}
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

        {order.notes && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-800">
            📝 {order.notes}
          </div>
        )}

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

      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <div className="px-4 pb-3 flex gap-2">
          {meta.next && (
            <button onClick={advance} disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50">
              {updating ? <Loader2 size={12} className="animate-spin" /> : null}
              {meta.nextLabel}
            </button>
          )}
          <button onClick={cancel} disabled={cancelling}
            className="px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium rounded-xl transition-colors disabled:opacity-50">
            {cancelling ? <Loader2 size={12} className="animate-spin" /> : 'Cancel'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── page ────────────────────────────────────────────────── */

export default function OrdersPage() {
  const { hotel_id } = useParams() as { hotel_id: string }
  const [orders,       setOrders]       = useState<Order[]>([])
  const [newOrderIds,  setNewOrderIds]  = useState<Set<string>>(new Set())
  const [toasts,       setToasts]       = useState<Toast[]>([])
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [wsConnected,  setWsConnected]  = useState(false)
  const [notifPerm,    setNotifPerm]    = useState<NotificationPermission>('default')
  const focusedRef = useRef(true)
  const wsRef = useRef<WebSocket | null>(null)

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPerm(Notification.permission)
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => setNotifPerm(perm))
      }
    }
  }, [])

  // Track document focus
  useEffect(() => {
    const onFocus  = () => { focusedRef.current = true }
    const onBlur   = () => { focusedRef.current = false }
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur',  onBlur)
    focusedRef.current = document.hasFocus()
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur',  onBlur)
    }
  }, [])

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await getOrders(statusFilter === 'all' ? undefined : statusFilter)
      const sorted = (res.data ?? []).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setOrders(sorted)
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  // WebSocket connection
  useEffect(() => {
    if (!hotel_id) return
    const token = getToken()
    if (!token) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8080'
    const ws = new WebSocket(`${wsUrl}/api/v1/ws/hotel/${hotel_id}?token=${token}`)
    wsRef.current = ws

    ws.onopen  = () => setWsConnected(true)
    ws.onclose = () => setWsConnected(false)
    ws.onerror = () => setWsConnected(false)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload: Order }
        if (msg.type !== 'new_order' || !msg.payload) return

        const newOrder = msg.payload

        // Add to orders list
        setOrders((prev) => {
          if (prev.find((o) => o.id === newOrder.id)) return prev
          return [newOrder, ...prev]
        })

        // Highlight card for 8s
        setNewOrderIds((prev) => new Set([...Array.from(prev), newOrder.id]))
        setTimeout(() => {
          setNewOrderIds((prev) => {
            const next = new Set(prev); next.delete(newOrder.id); return next
          })
        }, 8000)

        if (focusedRef.current) {
          // Tab is focused → show in-app toast
          const toastId = `toast-${newOrder.id}`
          setToasts((prev) => [...prev, { id: toastId, order: newOrder }])
          // Auto-dismiss after 12s
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastId))
          }, 12000)
        } else {
          // Tab is in background → browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const tableLabel = newOrder.table_label || (newOrder.table_number > 0 ? `Table ${newOrder.table_number}` : '')
            const notif = new Notification('🍽 New Order!', {
              body: `${tableLabel ? tableLabel + ' · ' : ''}${newOrder.items.length} item${newOrder.items.length !== 1 ? 's' : ''} · ₹${newOrder.total_amount.toFixed(2)}${newOrder.customer_name ? '\n' + newOrder.customer_name : ''}`,
              icon: '/favicon.ico',
              tag: `order-${newOrder.id}`,
            })
            notif.onclick = () => { window.focus(); notif.close() }
          }
        }
      } catch { /* ignore parse errors */ }
    }

    return () => { ws.close() }
  }, [hotel_id])

  const handleStatusChange = useCallback(async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    } catch (e) { console.error(e) }
  }, [])

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId))
  }, [])

  const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready']
  const activeOrders  = orders.filter((o) => activeStatuses.includes(o.status))
  const historyOrders = orders.filter((o) => !activeStatuses.includes(o.status))
  const pendingCount  = orders.filter((o) => o.status === 'pending').length

  return (
    <div className="p-8">
      {/* ── in-app toast stack (bottom-right) ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <OrderToast
              toast={t}
              onDismiss={dismissToast}
              onAction={handleStatusChange}
            />
          </div>
        ))}
      </div>

      {/* ── header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                {pendingCount} new
              </span>
            )}
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium
              ${wsConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
              {wsConnected ? 'Live' : 'Offline'}
            </span>
            {/* notification permission indicator */}
            {notifPerm !== 'granted' && (
              <button
                onClick={() => Notification.requestPermission().then((p) => setNotifPerm(p))}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
              >
                <Bell size={11} />
                {notifPerm === 'denied' ? 'Notifications blocked' : 'Enable notifications'}
              </button>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {wsConnected ? 'New orders appear instantly' : 'Connect to see live orders'}
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary gap-2">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── filter chips ── */}
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
          {activeOrders.length > 0 && (statusFilter === 'all' || activeStatuses.includes(statusFilter as OrderStatus)) && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Active · {activeOrders.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeOrders
                  .filter((o) => statusFilter === 'all' || o.status === statusFilter)
                  .map((order) => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} isNew={newOrderIds.has(order.id)} />
                  ))}
              </div>
            </div>
          )}

          {historyOrders.length > 0 && (statusFilter === 'all' || !activeStatuses.includes(statusFilter as OrderStatus)) && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                History · {historyOrders.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {historyOrders
                  .filter((o) => statusFilter === 'all' || o.status === statusFilter)
                  .map((order) => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} isNew={false} />
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

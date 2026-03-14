'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ShoppingCart, Plus, Minus, X, MapPin, Phone, Loader2,
  UtensilsCrossed, IndianRupee, Trash2, StickyNote, User,
  ChevronDown, Search, CheckCircle2
} from 'lucide-react'
import { getPublicMenu, placeOrder } from '@/lib/api'
import type { PublicMenuResponse, CategoryMenuNode, MenuItem, CartItem } from '@/types'

/* ── helpers ─────────────────────────────────────────────── */

function flatItems(nodes: CategoryMenuNode[]): MenuItem[] {
  const result: MenuItem[] = []
  for (const n of nodes) {
    if (n.items) result.push(...n.items)
    if (n.children) result.push(...flatItems(n.children))
  }
  return result
}

function totalCount(cart: CartItem[]) { return cart.reduce((s, i) => s + i.quantity, 0) }
function totalPrice(cart: CartItem[]) { return cart.reduce((s, i) => s + i.price * i.quantity, 0) }

/* ── VegDot ──────────────────────────────────────────────── */
function VegDot({ isVeg, size = 'sm' }: { isVeg: boolean; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
  const dot = size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2'
  return (
    <span className={`${sz} rounded-sm border-2 flex items-center justify-center shrink-0
      ${isVeg ? 'border-emerald-600' : 'border-red-600'}`}>
      <span className={`${dot} rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
    </span>
  )
}

/* ── ItemCard ────────────────────────────────────────────── */
function ItemCard({ item, qty, onAdd, onRemove }: {
  item: MenuItem; qty: number; onAdd: () => void; onRemove: () => void
}) {
  return (
    <div className="flex items-start gap-3 py-4 border-b border-slate-100 last:border-0">
      <VegDot isVeg={item.is_veg} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm leading-snug">{item.name}</p>
        {item.description && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map((t) => (
              <span key={t} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
        <p className="text-sm font-bold text-slate-900 mt-1.5 flex items-center">
          <IndianRupee size={12} className="mr-0.5" />{item.price.toFixed(2)}
        </p>
      </div>

      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.name}
          className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100" />
      )}

      <div className="shrink-0 flex flex-col items-center gap-1">
        {qty === 0 ? (
          <button onClick={onAdd}
            className="px-4 py-1.5 rounded-xl border-2 border-orange-500 text-orange-500 text-xs font-bold
                       hover:bg-orange-500 hover:text-white transition-colors">
            ADD
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-orange-500 text-white rounded-xl px-2 py-1">
            <button onClick={onRemove} className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity">
              <Minus size={12} />
            </button>
            <span className="text-sm font-bold min-w-4 text-center">{qty}</span>
            <button onClick={onAdd} className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity">
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── CategorySection ─────────────────────────────────────── */
function CategorySection({ node, cart, onAdd, onRemove, depth = 0 }: {
  node: CategoryMenuNode; cart: CartItem[]
  onAdd: (item: MenuItem) => void; onRemove: (id: string) => void; depth?: number
}) {
  const [open, setOpen] = useState(true)
  const hasItems    = (node.items?.length ?? 0) > 0
  const hasChildren = (node.children?.length ?? 0) > 0
  if (!hasItems && !hasChildren) return null

  return (
    <div id={`cat-${node.id}`} className={depth > 0 ? 'ml-4 border-l-2 border-slate-100 pl-3' : ''}>
      <button
        className="w-full flex items-center justify-between py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {depth === 0
            ? <h2 className="text-base font-bold text-slate-900">{node.name}</h2>
            : <h3 className="text-sm font-semibold text-slate-700">{node.name}</h3>}
          {node.type && node.type !== 'general' && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${node.type === 'veg' ? 'bg-emerald-100 text-emerald-700'
              : node.type === 'non-veg' ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 text-slate-600'}`}>
              {node.type}
            </span>
          )}
          {(node.items?.length ?? 0) > 0 && (
            <span className="text-xs text-slate-400">{node.items!.length}</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>

      {open && (
        <>
          {node.items?.map((item) => (
            <ItemCard
              key={item.id} item={item}
              qty={cart.find((c) => c.id === item.id)?.quantity ?? 0}
              onAdd={() => onAdd(item)} onRemove={() => onRemove(item.id)}
            />
          ))}
          {node.children?.map((child) => (
            <CategorySection key={child.id} node={child} cart={cart}
              onAdd={onAdd} onRemove={onRemove} depth={depth + 1} />
          ))}
        </>
      )}
    </div>
  )
}

/* ── Live Status Tracker ─────────────────────────────────── */
const STATUS_STEPS = [
  { key: 'pending',   label: 'Order Received', icon: '📋' },
  { key: 'confirmed', label: 'Confirmed',       icon: '✅' },
  { key: 'preparing', label: 'Being Prepared',  icon: '👨‍🍳' },
  { key: 'ready',     label: 'Ready to Serve',  icon: '🔔' },
  { key: 'completed', label: 'Completed',        icon: '🎉' },
]

function LiveStatusTracker({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!orderId) return
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8080'
    const ws = new WebSocket(`${wsUrl}/api/v1/ws/order/${orderId}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload: { status: string } }
        if (msg.type === 'order_status' && msg.payload?.status) {
          setStatus(msg.payload.status)
        }
      } catch { /* ignore */ }
    }

    return () => { ws.close() }
  }, [orderId])

  const isCancelled = status === 'cancelled'
  const currentStep = isCancelled ? -1 : STATUS_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="w-full max-w-sm">
      {isCancelled ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-center">
          <p className="text-2xl mb-2">😔</p>
          <p className="font-bold text-red-700">Order Cancelled</p>
          <p className="text-xs text-red-500 mt-1">Please contact the staff for assistance</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Status</p>
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
              ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {connected ? 'Live' : 'Connecting…'}
            </span>
          </div>

          <div className="space-y-3">
            {STATUS_STEPS.map((step, i) => {
              const done    = i < currentStep
              const current = i === currentStep
              const future  = i > currentStep

              return (
                <div key={step.key} className="flex items-center gap-3">
                  {/* circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all
                    ${done    ? 'bg-emerald-100 text-emerald-600'
                    : current ? 'bg-orange-500 text-white shadow-md shadow-orange-300 scale-110'
                    : 'bg-slate-100 text-slate-300'}`}>
                    {done ? <CheckCircle2 size={16} /> : step.icon}
                  </div>
                  {/* label */}
                  <div className="flex-1">
                    <p className={`text-sm font-medium
                      ${done ? 'text-emerald-600 line-through' : current ? 'text-slate-900' : 'text-slate-300'}`}>
                      {step.label}
                    </p>
                    {current && (
                      <p className="text-xs text-orange-500 font-medium animate-pulse">In progress…</p>
                    )}
                  </div>
                  {/* connector */}
                  {i < STATUS_STEPS.length - 1 && (
                    <div className="absolute" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── main page ───────────────────────────────────────────── */
type Step = 'menu' | 'cart' | 'confirm' | 'orders'

export default function PublicMenuPage() {
  const params       = useParams<{ hotel_id: string }>()
  const searchParams = useSearchParams()
  const tableNum     = Number(searchParams.get('table') ?? 0)

  const [menu,    setMenu]    = useState<PublicMenuResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [step,    setStep]    = useState<Step>('menu')
  const [search,  setSearch]  = useState('')

  const [cart,         setCart]         = useState<CartItem[]>([])
  const [cartOpen,     setCartOpen]     = useState(false)
  const [name,         setName]         = useState('')
  const [notes,        setNotes]        = useState('')
  const [placing,      setPlacing]      = useState(false)
  const [orderErr,     setOrderErr]     = useState('')
  const [placedOrders, setPlacedOrders] = useState<string[]>([])

  const activeTable = menu?.tables.find((t) => t.number === tableNum && t.is_active)

  useEffect(() => {
    if (!params.hotel_id) return
    getPublicMenu(params.hotel_id)
      .then(setMenu)
      .catch(() => setError('Menu not available'))
      .finally(() => setLoading(false))
  }, [params.hotel_id])

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, is_veg: item.is_veg, image_url: item.image_url }]
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id)
      if (!existing) return prev
      if (existing.quantity === 1) return prev.filter((c) => c.id !== id)
      return prev.map((c) => c.id === id ? { ...c, quantity: c.quantity - 1 } : c)
    })
  }, [])

  async function handlePlaceOrder() {
    setOrderErr('')
    setPlacing(true)
    try {
      const res = await placeOrder(params.hotel_id, {
        table_number:  activeTable?.number ?? tableNum,
        table_label:   activeTable?.label  ?? (tableNum ? `Table ${tableNum}` : ''),
        customer_name: name.trim(),
        notes:         notes.trim(),
        items:         cart.map((c) => ({ item_id: c.id, quantity: c.quantity })),
      })
      setPlacedOrders((prev) => [...prev, res.data.id])
      setStep('orders')
      setCart([])
      setCartOpen(false)
    } catch (err: unknown) {
      setOrderErr(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  // filter items by search
  const allItems = menu ? flatItems(menu.categories) : []
  const searchResults = search.trim().length > 1
    ? allItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : []

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 gap-4">
        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-300">
          <UtensilsCrossed size={28} className="text-white" />
        </div>
        <p className="text-slate-500 text-sm">Loading menu…</p>
      </div>
    )
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3 p-6 text-center">
        <UtensilsCrossed size={44} className="text-slate-200" />
        <p className="text-slate-700 font-semibold">{error || 'Menu not found'}</p>
        <p className="text-slate-400 text-sm">This restaurant may not be active yet</p>
      </div>
    )
  }

  /* ── orders tracking screen ── */
  if (step === 'orders') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-12">
        {/* header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-6 pt-10 pb-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black">Your Orders</h1>
          <p className="text-orange-200 text-sm mt-1">
            {placedOrders.length} order{placedOrders.length !== 1 ? 's' : ''} placed · tracking live
          </p>
        </div>

        {/* order cards */}
        <div className="max-w-sm mx-auto px-4 pt-6 space-y-6">
          {placedOrders.map((oid, idx) => (
            <div key={oid}>
              {placedOrders.length > 1 && (
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Order {idx + 1}
                </p>
              )}
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm mb-2">
                <p className="text-xs text-slate-400">Order ID</p>
                <p className="font-mono text-xs text-slate-600 break-all">#{oid}</p>
              </div>
              <LiveStatusTracker orderId={oid} initialStatus="pending" />
            </div>
          ))}
        </div>

        {/* order more button */}
        <div className="max-w-sm mx-auto px-4 mt-8">
          <button
            onClick={() => setStep('menu')}
            className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-lg shadow-orange-300/40"
          >
            Order More Items
          </button>
        </div>
      </div>
    )
  }

  /* ── cart / confirm sheet ── */
  const CartSheet = () => (
    <div className="fixed inset-0 z-40 flex flex-col">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      <div className="relative mt-auto bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {step === 'cart' && (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Cart · {totalCount(cart)} items</h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1">
                  <VegDot isVeg={item.is_veg} />
                  <p className="flex-1 text-sm font-medium text-slate-800 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 bg-orange-500 text-white rounded-xl px-2 py-1 shrink-0">
                    <button onClick={() => removeFromCart(item.id)} className="w-4 h-4 flex items-center justify-center">
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-bold min-w-4 text-center">{item.quantity}</span>
                    <button onClick={() => {
                      const m = allItems.find((i) => i.id === item.id)
                      if (m) addToCart(m)
                    }} className="w-4 h-4 flex items-center justify-center">
                      <Plus size={11} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 w-16 text-right shrink-0">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button onClick={() => setCart((prev) => prev.filter((c) => c.id !== item.id))}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 space-y-3 bg-white">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Total</span>
                <span className="flex items-center text-orange-600 text-base">
                  <IndianRupee size={15} />{totalPrice(cart).toFixed(2)}
                </span>
              </div>
              <button onClick={() => setStep('confirm')}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm transition-colors">
                Proceed to Place Order
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <button onClick={() => setStep('cart')} className="text-orange-500 text-sm font-medium">← Back</button>
              <h2 className="text-base font-bold text-slate-900">Confirm Order</h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {activeTable && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  <UtensilsCrossed size={16} className="text-orange-500" />
                  <p className="text-sm text-orange-700 font-medium">
                    {activeTable.label || `Table ${activeTable.number}`}
                    {activeTable.capacity ? ` · ${activeTable.capacity} seats` : ''}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <User size={14} className="inline mr-1.5" />Your name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                  placeholder="e.g. Rahul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <StickyNote size={14} className="inline mr-1.5" />Special instructions <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none h-20"
                  placeholder="e.g. Less spicy, no onions…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Order Summary</p>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span className="text-orange-600">₹{totalPrice(cart).toFixed(2)}</span>
                </div>
              </div>

              {orderErr && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{orderErr}</div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-white">
              <button onClick={handlePlaceOrder} disabled={placing}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition-colors flex items-center justify-center gap-2">
                {placing ? <><Loader2 size={16} className="animate-spin" /> Placing order…</> : `Place Order · ₹${totalPrice(cart).toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  /* ── main menu view ── */
  const cartCount = totalCount(cart)

  return (
    <div className="min-h-screen bg-slate-50 pb-32">

      {/* ── hero header ── */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed size={16} />
                </div>
                <span className="text-orange-200 text-xs font-medium uppercase tracking-wider">Digital Menu</span>
              </div>
              <h1 className="text-2xl font-black leading-tight">{menu.hotel.name}</h1>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {(menu.hotel.city || menu.hotel.country) && (
                  <span className="text-orange-200 text-xs flex items-center gap-1">
                    <MapPin size={11} />
                    {[menu.hotel.city, menu.hotel.state, menu.hotel.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {menu.hotel.phone && (
                  <span className="text-orange-200 text-xs flex items-center gap-1">
                    <Phone size={11} /> {menu.hotel.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {activeTable && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
              <UtensilsCrossed size={14} />
              {activeTable.label || `Table ${activeTable.number}`}
              {activeTable.capacity ? ` · ${activeTable.capacity} seats` : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── search bar ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 px-4 py-3">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search dishes…"
            className="flex-1 text-sm outline-none text-slate-800 placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── search results ── */}
      {search.trim().length > 1 && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4">
            <p className="text-xs text-slate-400 pt-3 pb-1 font-medium uppercase tracking-wider">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
            </p>
            {searchResults.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No dishes found</p>
            ) : (
              searchResults.map((item) => (
                <ItemCard
                  key={item.id} item={item}
                  qty={cart.find((c) => c.id === item.id)?.quantity ?? 0}
                  onAdd={() => addToCart(item)} onRemove={() => removeFromCart(item.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── category quick-nav ── */}
      {menu.categories.length > 1 && !search && (
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm mt-4">
          <div className="max-w-2xl mx-auto px-4 overflow-x-auto">
            <div className="flex gap-2 py-3 whitespace-nowrap">
              {menu.categories.map((cat) => {
                const itemCount = (cat.items?.length ?? 0) + (cat.children?.reduce((s, c) => s + (c.items?.length ?? 0), 0) ?? 0)
                return (
                  <a key={cat.id} href={`#cat-${cat.id}`}
                    className="px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition-colors border border-orange-100">
                    {cat.name}
                    {itemCount > 0 && <span className="ml-1 text-orange-400 font-normal">{itemCount}</span>}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── menu items ── */}
      {!search && (
        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
          {menu.categories.length === 0 ? (
            <div className="py-20 text-center">
              <UtensilsCrossed size={44} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400">Menu is being prepared. Check back soon!</p>
            </div>
          ) : (
            menu.categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4">
                <CategorySection
                  node={cat} cart={cart}
                  onAdd={addToCart} onRemove={removeFromCart}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* ── floating cart button ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4">
          <button
            onClick={() => { setStep('cart'); setCartOpen(true) }}
            className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl px-6 py-4 shadow-2xl shadow-orange-500/40 transition-all w-full max-w-sm active:scale-95"
          >
            <span className="w-7 h-7 bg-white text-orange-500 rounded-xl flex items-center justify-center text-sm font-black">
              {cartCount}
            </span>
            <span className="flex-1 text-left text-sm">View Cart</span>
            <span className="flex items-center text-sm font-semibold">
              <IndianRupee size={13} />{totalPrice(cart).toFixed(2)}
            </span>
            <ShoppingCart size={18} />
          </button>
        </div>
      )}

      {cartOpen && <CartSheet />}

      {/* ── floating "My Orders" button ── */}
      {placedOrders.length > 0 && cartCount === 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4">
          <button
            onClick={() => setStep('orders')}
            className="flex items-center gap-3 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-2xl px-6 py-4 shadow-2xl transition-all w-full max-w-sm active:scale-95"
          >
            <span className="w-7 h-7 bg-orange-500 rounded-xl flex items-center justify-center text-sm font-black">
              {placedOrders.length}
            </span>
            <span className="flex-1 text-left text-sm">Track My Orders</span>
            <CheckCircle2 size={18} className="text-orange-400" />
          </button>
        </div>
      )}
    </div>
  )
}

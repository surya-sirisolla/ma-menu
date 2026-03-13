'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ShoppingCart, Plus, Minus, X, ChevronDown, ChevronRight,
  MapPin, Phone, Loader2, CheckCircle, UtensilsCrossed, IndianRupee,
  Trash2, StickyNote, User
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

function totalCount(cart: CartItem[]) {
  return cart.reduce((s, i) => s + i.quantity, 0)
}
function totalPrice(cart: CartItem[]) {
  return cart.reduce((s, i) => s + i.price * i.quantity, 0)
}

/* ── sub-components ──────────────────────────────────────── */

function ItemCard({ item, qty, onAdd, onRemove }: {
  item: MenuItem
  qty: number
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-start gap-3 py-4 border-b border-slate-100 last:border-0">
      {/* veg/non-veg dot */}
      <span className={`mt-1 w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0
        ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
        <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
      </span>

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

      {/* image */}
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.name}
          className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100" />
      )}

      {/* qty control */}
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

function CategorySection({ node, cart, onAdd, onRemove, depth = 0 }: {
  node: CategoryMenuNode
  cart: CartItem[]
  onAdd: (item: MenuItem) => void
  onRemove: (id: string) => void
  depth?: number
}) {
  const [open, setOpen] = useState(depth === 0)
  const hasItems    = (node.items?.length ?? 0) > 0
  const hasChildren = (node.children?.length ?? 0) > 0

  if (!hasItems && !hasChildren) return null

  return (
    <div id={`cat-${node.id}`} className={depth > 0 ? 'ml-4' : ''}>
      <button
        className="w-full flex items-center justify-between py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {depth === 0
            ? <h2 className="text-base font-bold text-slate-900">{node.name}</h2>
            : <h3 className="text-sm font-semibold text-slate-700">{node.name}</h3>
          }
          {node.type && node.type !== 'general' && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${node.type === 'veg' ? 'bg-emerald-100 text-emerald-700'
              : node.type === 'non-veg' ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 text-slate-600'}`}>
              {node.type}
            </span>
          )}
        </div>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>

      {open && (
        <>
          {node.items?.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              qty={cart.find((c) => c.id === item.id)?.quantity ?? 0}
              onAdd={() => onAdd(item)}
              onRemove={() => onRemove(item.id)}
            />
          ))}
          {node.children?.map((child) => (
            <CategorySection
              key={child.id}
              node={child}
              cart={cart}
              onAdd={onAdd}
              onRemove={onRemove}
              depth={depth + 1}
            />
          ))}
        </>
      )}
    </div>
  )
}

/* ── main page ───────────────────────────────────────────── */

type Step = 'menu' | 'cart' | 'confirm' | 'success'

export default function PublicMenuPage() {
  const params       = useParams<{ hotel_id: string }>()
  const searchParams = useSearchParams()
  const tableNum     = Number(searchParams.get('table') ?? 0)

  const [menu,    setMenu]    = useState<PublicMenuResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [step,    setStep]    = useState<Step>('menu')

  const [cart,      setCart]      = useState<CartItem[]>([])
  const [cartOpen,  setCartOpen]  = useState(false)
  const [name,      setName]      = useState('')
  const [notes,     setNotes]     = useState('')
  const [placing,   setPlacing]   = useState(false)
  const [orderErr,  setOrderErr]  = useState('')
  const [orderId,   setOrderId]   = useState('')

  // active table info
  const activeTable = menu?.tables.find((t) => t.number === tableNum && t.is_active)

  useEffect(() => {
    if (!params.hotel_id) return
    setLoading(true)
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
      setOrderId(res.data.id)
      setStep('success')
      setCart([])
    } catch (err: unknown) {
      setOrderErr(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  /* ── loading / error ──────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 size={32} className="text-orange-500 animate-spin" />
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

  /* ── success screen ──────────────────────────────────── */
  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center gap-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Order Placed!</h1>
        <p className="text-slate-500 text-sm max-w-xs">
          Your order has been sent to the kitchen. We&apos;ll prepare it as soon as possible.
        </p>
        <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm w-full max-w-xs">
          <p className="text-xs text-slate-400 mb-1">Order ID</p>
          <p className="font-mono text-sm text-slate-700 break-all">{orderId}</p>
        </div>
        <button
          onClick={() => { setStep('menu'); setCartOpen(false) }}
          className="mt-2 px-6 py-3 bg-orange-500 text-white rounded-2xl font-semibold text-sm hover:bg-orange-600 transition-colors"
        >
          Order more
        </button>
      </div>
    )
  }

  /* ── cart / confirm sheet ────────────────────────────── */
  const CartSheet = () => (
    <div className="fixed inset-0 z-40 flex flex-col">
      <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
      <div className="relative mt-auto bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {step === 'cart' && (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Your Cart ({totalCount(cart)} items)</h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-sm border-2 shrink-0
                    ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                    <span className={`block w-1.5 h-1.5 rounded-full m-px ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                  </span>
                  <p className="flex-1 text-sm font-medium text-slate-800 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 bg-orange-500 text-white rounded-xl px-2 py-1 shrink-0">
                    <button onClick={() => removeFromCart(item.id)} className="w-4 h-4 flex items-center justify-center">
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-bold min-w-4 text-center">{item.quantity}</span>
                    <button onClick={() => {
                      const m = flatItems(menu.categories).find((i) => i.id === item.id)
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

            <div className="px-5 py-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Total</span>
                <span className="flex items-center"><IndianRupee size={14} />{totalPrice(cart).toFixed(2)}</span>
              </div>
              <button onClick={() => setStep('confirm')}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm transition-colors">
                Continue to Place Order
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
              {/* table info */}
              {activeTable && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  <UtensilsCrossed size={16} className="text-orange-500" />
                  <p className="text-sm text-orange-700 font-medium">
                    {activeTable.label || `Table ${activeTable.number}`}
                    {activeTable.capacity ? ` · ${activeTable.capacity} seats` : ''}
                  </p>
                </div>
              )}

              {/* name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User size={14} /> Your name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                  placeholder="e.g. Rahul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <StickyNote size={14} /> Special instructions <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none h-20"
                  placeholder="e.g. Less spicy, no onions…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* order summary */}
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
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {orderErr}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100">
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

  /* ── main menu view ──────────────────────────────────── */
  const cartCount = totalCount(cart)

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* hotel header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900">{menu.hotel.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
            {(menu.hotel.city || menu.hotel.country) && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin size={11} />
                {[menu.hotel.city, menu.hotel.state, menu.hotel.country].filter(Boolean).join(', ')}
              </span>
            )}
            {menu.hotel.phone && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Phone size={11} /> {menu.hotel.phone}
              </span>
            )}
          </div>
          {activeTable && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
              <UtensilsCrossed size={11} />
              {activeTable.label || `Table ${activeTable.number}`}
            </div>
          )}
        </div>
      </div>

      {/* category quick-nav */}
      {menu.categories.length > 1 && (
        <div className="sticky top-[72px] z-10 bg-white border-b border-slate-100">
          <div className="max-w-2xl mx-auto px-4 overflow-x-auto">
            <div className="flex gap-2 py-3 whitespace-nowrap">
              {menu.categories.map((cat) => (
                <a key={cat.id} href={`#cat-${cat.id}`}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-600 text-xs font-medium transition-colors">
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* menu items */}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-2">
        {menu.categories.length === 0 ? (
          <div className="py-20 text-center">
            <UtensilsCrossed size={44} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400">Menu is being prepared. Check back soon!</p>
          </div>
        ) : (
          menu.categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4">
              <CategorySection
                node={cat}
                cart={cart}
                onAdd={addToCart}
                onRemove={removeFromCart}
              />
            </div>
          ))
        )}
      </div>

      {/* floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4">
          <button
            onClick={() => { setStep('cart'); setCartOpen(true) }}
            className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl px-6 py-4 shadow-xl shadow-orange-500/30 transition-all w-full max-w-sm"
          >
            <span className="w-6 h-6 bg-white text-orange-500 rounded-lg flex items-center justify-center text-xs font-black">
              {cartCount}
            </span>
            <span className="flex-1 text-left text-sm">View Cart</span>
            <span className="flex items-center text-sm"><IndianRupee size={13} />{totalPrice(cart).toFixed(2)}</span>
            <ShoppingCart size={18} />
          </button>
        </div>
      )}

      {/* cart / confirm sheet */}
      {cartOpen && <CartSheet />}
    </div>
  )
}

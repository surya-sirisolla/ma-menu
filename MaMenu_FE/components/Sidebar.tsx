'use client'

import { useState, useEffect } from 'react'
import {
  ChefHat, LayoutDashboard, Users, Building2, LogOut,
  UtensilsCrossed, Tag, Grid3x3, ChevronDown, Check, Loader2, ClipboardList
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearToken, getAuthPayload, saveToken } from '@/lib/auth'
import { getProfile, switchHotel } from '@/lib/api'
import type { Hotel, User } from '@/types'

interface NavItem { label: string; href: string; icon: React.ElementType }

const adminNav: NavItem[] = [
  { label: 'Dashboard',    href: '/admin',              icon: LayoutDashboard },
  { label: 'Hotel Owners', href: '/admin/hotel-owners', icon: Users },
  { label: 'Hotels',       href: '/admin/hotels',       icon: Building2 },
]

const hotelNav: NavItem[] = [
  { label: 'Dashboard',   href: '/hotel',            icon: LayoutDashboard },
  { label: 'Orders',      href: '/hotel/orders',     icon: ClipboardList },
  { label: 'Tables',      href: '/hotel/tables',     icon: Grid3x3 },
  { label: 'Categories',  href: '/hotel/categories', icon: Tag },
  { label: 'Menu',        href: '/hotel/menu',       icon: UtensilsCrossed },
]

export default function Sidebar({ role }: { role: 'super_admin' | 'hotel_admin' }) {
  const pathname = usePathname()
  const router   = useRouter()
  const payload  = getAuthPayload()

  const [user,        setUser]        = useState<User | null>(null)
  const [activeHotel, setActiveHotel] = useState<Hotel | null>(null)
  const [allHotels,   setAllHotels]   = useState<Hotel[]>([])
  const [switchOpen,  setSwitchOpen]  = useState(false)
  const [switching,   setSwitching]   = useState(false)

  const nav = role === 'super_admin' ? adminNav : hotelNav

  useEffect(() => {
    if (role !== 'hotel_admin') return
    getProfile().then((res) => {
      setUser(res.user)
      setActiveHotel(res.active_hotel)
      // Build list from hotel_ids if needed; for now show current hotel only
      if (res.active_hotel) setAllHotels([res.active_hotel])
    }).catch(() => {})
  }, [role])

  async function handleSwitch(hotelId: string) {
    if (hotelId === activeHotel?.id) { setSwitchOpen(false); return }
    setSwitching(true)
    try {
      const res = await switchHotel(hotelId)
      saveToken(res.token)
      setActiveHotel(res.active_hotel)
      setSwitchOpen(false)
      // Reload page so JWT context refreshes
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setSwitching(false)
    }
  }

  function handleLogout() {
    clearToken()
    router.replace('/login')
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-white shrink-0">
      {/* brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shrink-0">
          <ChefHat size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">MaMenu</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {role === 'super_admin' ? 'Super Admin' : 'Hotel Admin'}
          </p>
        </div>
      </div>

      {/* hotel switcher (hotel_admin only) */}
      {role === 'hotel_admin' && (
        <div className="px-3 py-3 border-b border-slate-800">
          <p className="text-xs text-slate-500 px-2 mb-1.5 font-medium uppercase tracking-wider">Active Hotel</p>
          <div className="relative">
            <button
              onClick={() => setSwitchOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-left"
              disabled={switching}
            >
              <div className="w-7 h-7 bg-brand-500/20 border border-brand-500/30 rounded-lg flex items-center justify-center shrink-0">
                <Building2 size={13} className="text-brand-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-slate-200 truncate">
                {switching ? '…' : (activeHotel?.name ?? 'No hotel')}
              </span>
              {switching
                ? <Loader2 size={13} className="text-slate-400 animate-spin" />
                : <ChevronDown size={13} className={`text-slate-400 transition-transform ${switchOpen ? 'rotate-180' : ''}`} />
              }
            </button>

            {switchOpen && allHotels.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-20">
                {allHotels.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleSwitch(h.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="flex-1 text-slate-200 truncate">{h.name}</span>
                    {h.id === activeHotel?.id && <Check size={13} className="text-brand-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* user + logout */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <div className="px-3 py-2.5">
          <p className="text-xs font-medium text-slate-200 truncate">
            {role === 'hotel_admin' ? (user?.name ?? payload?.email) : payload?.email}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {role === 'super_admin' ? 'Super Admin' : 'Hotel Admin'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400
                     hover:bg-slate-800 hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

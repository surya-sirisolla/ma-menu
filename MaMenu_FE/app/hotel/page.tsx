'use client'

import { useEffect, useState } from 'react'
import { UtensilsCrossed, Grid3x3, Tag, CheckCircle, ArrowRight, MapPin, Phone, Mail, Users } from 'lucide-react'
import { getProfile, getTables, getCategories, getMenuItems } from '@/lib/api'
import type { Hotel, User, Table, MenuItem } from '@/types'
import Link from 'next/link'

interface Stat { label: string; value: number; icon: React.ElementType; color: string; href: string }

export default function HotelDashboard() {
  const [hotel,    setHotel]    = useState<Hotel | null>(null)
  const [user,     setUser]     = useState<User | null>(null)
  const [tables,   setTables]   = useState<Table[]>([])
  const [items,    setItems]    = useState<MenuItem[]>([])
  const [catCount, setCatCount] = useState(0)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, tablesRes, catsRes, menuRes] = await Promise.all([
          getProfile(),
          getTables(),
          getCategories(),
          getMenuItems(),
        ])
        setUser(profileRes.user)
        setHotel(profileRes.active_hotel)
        setTables(tablesRes.data ?? [])
        setCatCount(flattenTree(catsRes.data ?? []).length)
        setItems(menuRes.data ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeTables   = tables.filter((t) => t.is_active)
  const occupiedTables = activeTables.filter((t) => t.is_occupied)
  const availableItems = items.filter((i) => i.is_available)

  const stats: Stat[] = [
    { label: 'Total Tables',    value: activeTables.length,   icon: Grid3x3,         color: 'brand',   href: '/hotel/tables' },
    { label: 'Occupied Now',    value: occupiedTables.length, icon: Users,            color: 'amber',   href: '/hotel/tables' },
    { label: 'Menu Items',      value: availableItems.length, icon: UtensilsCrossed,  color: 'violet',  href: '/hotel/menu' },
    { label: 'Categories',      value: catCount,              icon: Tag,              color: 'emerald', href: '/hotel/categories' },
  ]

  const colorMap: Record<string, string> = {
    brand:   'bg-brand-50 text-brand-600 border-brand-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    violet:  'bg-violet-50 text-violet-600 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  }

  return (
    <div className="p-8">
      {/* greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {loading ? (
            <span className="inline-block w-48 h-7 bg-slate-100 rounded animate-pulse" />
          ) : (
            <>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋</>
          )}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here&apos;s what&apos;s happening with your hotel today</p>
      </div>

      {/* hotel info card */}
      <div className="card mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 w-56 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : hotel ? (
            <>
              <h2 className="text-lg font-bold text-slate-900">{hotel.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {(hotel.city || hotel.country) && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={13} className="text-slate-400" />
                    {[hotel.address, hotel.city, hotel.state, hotel.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {hotel.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Phone size={13} className="text-slate-400" /> {hotel.phone}
                  </span>
                )}
                {hotel.email && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Mail size={13} className="text-slate-400" /> {hotel.email}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-sm">No hotel assigned yet</p>
          )}
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
          ${hotel?.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          <CheckCircle size={12} className="mr-1.5" />
          {hotel?.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="card flex flex-col gap-3 hover:shadow-md transition-shadow group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
                <Icon size={18} />
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-slate-900">{value}</p>
            )}
            <p className="text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      {/* two-column quick views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* recent tables */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Tables Status</h3>
            <Link href="/hotel/tables" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : activeTables.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No tables added yet</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {activeTables.slice(0, 12).map((t) => (
                <div key={t.id}
                  className={`rounded-xl p-2.5 text-center border ${
                    t.is_occupied
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                  <p className="text-xs font-bold">{t.label || `T${t.number}`}</p>
                  <p className="text-xs mt-0.5 opacity-70">{t.is_occupied ? 'Busy' : 'Free'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* recent menu items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Menu Items</h3>
            <Link href="/hotel/menu" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No menu items yet</p>
          ) : (
            <div className="space-y-2">
              {items.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.is_veg ? 'Veg' : 'Non-veg'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-900">₹{item.price.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.is_available ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function flattenTree(nodes: { children?: typeof nodes }[]): typeof nodes {
  const result: typeof nodes = []
  for (const n of nodes) {
    result.push(n)
    if (n.children?.length) result.push(...flattenTree(n.children))
  }
  return result
}

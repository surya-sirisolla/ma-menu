'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, TrendingUp, Activity } from 'lucide-react'
import { getHotels, getHotelOwners } from '@/lib/api'
import type { Hotel, User } from '@/types'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  color: string
}

function StatCard({ icon: Icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="card p-6 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [hotels, setHotels]   = useState<Hotel[]>([])
  const [owners, setOwners]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getHotels(), getHotelOwners()])
      .then(([h, o]) => {
        setHotels(h.data ?? [])
        setOwners(o.data ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const activeHotels  = hotels.filter((h) => h.is_active).length
  const activeOwners  = owners.filter((o) => o.is_active).length

  return (
    <div className="p-8">
      {/* header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your platform</p>
      </div>

      {/* stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Building2}   label="Total Hotels"        value={hotels.length} sub={`${activeHotels} active`}  color="bg-brand-500"   />
          <StatCard icon={Users}       label="Hotel Owners"        value={owners.length} sub={`${activeOwners} active`}  color="bg-violet-500"  />
          <StatCard icon={TrendingUp}  label="Active Hotels"       value={activeHotels}  sub="running now"              color="bg-emerald-500" />
          <StatCard icon={Activity}    label="Platform Health"     value="Good"          sub="all systems operational"  color="bg-sky-500"     />
        </div>
      )}

      {/* recent hotels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotels */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Hotels</h2>
            <span className="text-xs text-slate-400">{hotels.length} total</span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-400">No hotels yet</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {hotels.slice(0, 5).map((h) => (
                <li key={h.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{h.name}</p>
                    <p className="text-xs text-slate-400">{h.city}, {h.country}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${h.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {h.is_active ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Hotel Owners */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Hotel Owners</h2>
            <span className="text-xs text-slate-400">{owners.length} total</span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : owners.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-400">No hotel owners yet</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {owners.slice(0, 5).map((o) => (
                <li key={o.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{o.name}</p>
                    <p className="text-xs text-slate-400">{o.email}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {o.hotel_ids?.length ?? 0} hotel{(o.hotel_ids?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

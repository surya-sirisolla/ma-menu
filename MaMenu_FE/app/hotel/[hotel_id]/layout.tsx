'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getRole, isAuthenticated, getAuthPayload, saveToken } from '@/lib/auth'
import { switchHotel } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

export default function HotelLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const params   = useParams()
  const hotelId  = params.hotel_id as string
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isAuthenticated() || getRole() !== 'hotel_admin') {
      router.replace('/login')
      return
    }

    const payload = getAuthPayload()
    // If URL hotel_id differs from JWT hotel_id, switch to sync them
    if (payload?.hotel_id && payload.hotel_id !== hotelId) {
      switchHotel(hotelId)
        .then((res) => { saveToken(res.token); setReady(true) })
        .catch(() => {
          // Invalid hotel_id — redirect to default hotel
          router.replace(`/hotel/${payload.hotel_id}`)
        })
    } else {
      setReady(true)
    }
  }, [router, hotelId])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="hotel_admin" hotelId={hotelId} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

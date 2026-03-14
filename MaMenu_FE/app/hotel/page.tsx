'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthPayload, isAuthenticated, getRole } from '@/lib/auth'

export default function HotelRoot() {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated() || getRole() !== 'hotel_admin') {
      router.replace('/login')
      return
    }
    const payload = getAuthPayload()
    if (payload?.hotel_id) {
      router.replace(`/hotel/${payload.hotel_id}`)
    } else {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

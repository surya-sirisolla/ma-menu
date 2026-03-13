'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthPayload } from '@/lib/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const payload = getAuthPayload()
    if (!payload) {
      router.replace('/login')
    } else if (payload.role === 'super_admin') {
      router.replace('/admin')
    } else if (payload.role === 'hotel_admin') {
      router.replace('/hotel')
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

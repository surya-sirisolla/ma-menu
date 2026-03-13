'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthPayload } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router  = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const payload = getAuthPayload()
    if (!payload || payload.role !== 'super_admin') {
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="super_admin" />
      <main className="flex-1 bg-slate-50 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ChefHat, Loader2 } from 'lucide-react'
import { login } from '@/lib/api'
import { saveToken, getAuthPayload } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // already logged in?
  useEffect(() => {
    const p = getAuthPayload()
    if (p?.role === 'super_admin') router.replace('/admin')
    else if (p?.role === 'hotel_admin') router.replace('/hotel')
  }, [router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email.trim(), password)
      saveToken(res.token)
      const payload = getAuthPayload()
      if (payload?.role === 'super_admin') router.push('/admin')
      else if (payload?.role === 'hotel_admin') router.push('/hotel')
      else setError('Unknown role. Please contact support.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl" />

        {/* logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <ChefHat size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">MaMenu</span>
        </div>

        {/* hero copy */}
        <div className="relative">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Restaurant<br />
            Management<br />
            <span className="text-brand-400">Made Simple.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Manage hotels, tables, menus and owners — all in one place.
          </p>

          {/* feature pills */}
          <div className="flex flex-col gap-3">
            {[
              '🏨  Multi-hotel management',
              '📱  QR-based digital menus',
              '🍽️  Live table tracking',
              '📊  Real-time availability',
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <span className="text-slate-200 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-600 text-xs">© 2025 MaMenu. All rights reserved.</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">

          {/* mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <ChefHat size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">MaMenu</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="input"
                placeholder="admin@mamenu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            MaMenu — Restaurant Management Platform
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

// This layout wraps /hotel/page.tsx (redirect page only).
// All actual hotel admin pages live under /hotel/[hotel_id]/layout.tsx
export default function HotelRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

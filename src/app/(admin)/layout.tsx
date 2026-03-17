'use client'
import { TopNavAdmin } from '@/components/TopNavAdmin'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-50 font-sans">
      <TopNavAdmin />
      <main className="flex-1 w-full mt-6">
        {children}
      </main>
    </div>
  )
}
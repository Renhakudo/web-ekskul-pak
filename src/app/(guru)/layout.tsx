'use client'
import { TopNavGuru } from '@/components/TopNavGuru'

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#FDFBF7] font-sans">
      <TopNavGuru />
      <main className="flex-1 w-full mt-6">
        {children}
      </main>
    </div>
  )
}

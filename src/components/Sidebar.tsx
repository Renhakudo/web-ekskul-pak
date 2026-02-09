'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// Tambahkan 'User' di sini
import { LayoutDashboard, BookOpen, Trophy, CalendarCheck, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils' // Utility bawaan shadcn
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/courses', label: 'Materi & Tugas', icon: BookOpen },
  { href: '/dashboard/leaderboard', label: 'Peringkat', icon: Trophy },
  { href: '/dashboard/absensi', label: 'Absensi', icon: CalendarCheck },
  // Menu Baru: Profil Saya
  { href: '/dashboard/profile', label: 'Profil Saya', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col gap-4 border-r bg-slate-900 text-slate-100 p-4 w-[250px]">
      <div className="flex h-14 items-center border-b border-slate-700 px-2 font-bold text-xl tracking-tight">
        🚀 Ekskul LMS
      </div>
      
      <div className="flex-1 py-4">
        <nav className="grid gap-2 px-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-white",
                  isActive 
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" 
                    : "text-slate-400 hover:bg-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  )
}
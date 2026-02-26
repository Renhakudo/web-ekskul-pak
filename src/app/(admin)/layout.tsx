'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BookOpen, FileText, Settings, LogOut, ShieldAlert, QrCode, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const adminMenu = [
    { href: '/admin', label: 'Dashboard Statistik', icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: 'User & Role', icon: Users, exact: false },
    { href: '/admin/classes', label: 'Manajemen Kelas', icon: BookOpen, exact: false },
    { href: '/admin/blog', label: 'Blog & Berita', icon: FileText, exact: false },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings, exact: false },
  ]

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Admin Sidebar */}
      <aside className="fixed inset-y-0 z-50 hidden w-64 flex-col border-r bg-slate-950 text-slate-100 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6 font-bold text-lg tracking-tight">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <span>Admin Panel</span>
        </div>

        <div className="flex-1 py-6 px-4">
          <nav className="space-y-1">
            {adminMenu.map((item) => {
              const Icon = item.icon
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-900/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar Admin
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  )
}
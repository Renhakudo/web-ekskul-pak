'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Trophy, CalendarCheck, LogOut, User, Sparkles, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const menuItems = [
    { href: '/dashboard', label: 'Basecamp', icon: LayoutDashboard, color: 'text-violet-600', hoverBg: 'hover:bg-violet-100' },
    { href: '/dashboard/courses', label: 'Petualangan', icon: BookOpen, color: 'text-emerald-600', hoverBg: 'hover:bg-emerald-100' },
    { href: '/dashboard/leaderboard', label: 'Papan Skor', icon: Trophy, color: 'text-yellow-600', hoverBg: 'hover:bg-yellow-100' },
    { href: '/dashboard/absensi', label: 'Absensi', icon: CalendarCheck, color: 'text-orange-600', hoverBg: 'hover:bg-orange-100' },
    { href: '/dashboard/profile', label: 'Profilku', icon: User, color: 'text-blue-600', hoverBg: 'hover:bg-blue-100' },
]

export function TopNavDashboard() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-[#FDFBF7] border-b-4 border-slate-900 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-3 font-bold text-slate-900 group cursor-pointer hover:-rotate-2 transition-transform duration-300">
                            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                                <Sparkles className="h-5 w-5 text-slate-900 fill-slate-900" />
                            </div>
                            <span className="text-xl tracking-tight font-black hidden sm:block">Ekskul<span className="text-violet-600">PAK</span>.</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all border-2",
                                            isActive
                                                ? "bg-slate-900 text-white border-slate-900 shadow-[3px_3px_0px_#0f172a]"
                                                : `bg-white text-slate-600 border-transparent hover:border-slate-300 hover:text-slate-900 ${item.hoverBg}`
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isActive ? "text-white" : item.color)} />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* User Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="font-bold border-2 border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-full"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Keluar
                            </Button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-900 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:bg-slate-50 focus:outline-none"
                            >
                                {mobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-slate-50 border-b-4 border-slate-900 px-4 py-6 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold transition-all border-2",
                                        isActive
                                            ? "bg-slate-900 text-white border-slate-900 shadow-[4px_4px_0px_#0f172a]"
                                            : `bg-white text-slate-700 border-slate-200 shadow-sm ${item.hoverBg}`
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", isActive ? "text-white" : item.color)} />
                                    {item.label}
                                </Link>
                            )
                        })}
                        <div className="pt-4 mt-4 border-t-2 border-slate-200">
                            <Button
                                className="w-full font-bold border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl py-6"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-5 w-5" />
                                Keluar Akun
                            </Button>
                        </div>
                    </div>
                )}
            </header>
        </>
    )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BookOpen, FileText, Settings, LogOut, ShieldAlert, Sparkles, Menu, X, GraduationCap, Fingerprint } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const guruMenu = [
    { href: '/guru', label: 'Monitor Kelas', icon: LayoutDashboard, exact: true, color: 'text-violet-600' },
    { href: '/guru/classes', label: 'Kelola Kelas', icon: BookOpen, exact: false, color: 'text-emerald-600' },
    { href: '/guru/absensi', label: 'Absensi', icon: Fingerprint, exact: false, color: 'text-cyan-600' },
]

export function TopNavGuru() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-slate-900 border-b-4 border-yellow-500 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link href="/guru" className="flex items-center gap-3 font-bold text-white group cursor-pointer hover:rotate-1 transition-transform duration-300">
                            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                                <GraduationCap className="h-5 w-5 text-slate-900" />
                            </div>
                            <span className="text-xl tracking-tight font-black hidden sm:block">Panel<span className="text-yellow-400">Guru</span>.</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-2">
                            {guruMenu.map((item) => {
                                const Icon = item.icon
                                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all border-2",
                                            isActive
                                                ? "bg-yellow-500 text-slate-900 border-slate-900 shadow-[3px_3px_0px_rgba(15,23,42,1)]"
                                                : "bg-slate-800 text-slate-300 border-transparent hover:border-slate-700 hover:bg-slate-700"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isActive ? "text-slate-900" : item.color)} />
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
                                className="font-bold border-2 border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-red-500 hover:bg-red-500 rounded-full transition-colors"
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
                                className="inline-flex items-center justify-center p-2 rounded-xl text-white bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 focus:outline-none"
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
                    <div className="md:hidden bg-slate-800 border-b-4 border-slate-700 px-4 py-6 space-y-2">
                        {guruMenu.map((item) => {
                            const Icon = item.icon
                            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold transition-all border-2",
                                        isActive
                                            ? "bg-yellow-500 text-slate-900 border-slate-900"
                                            : "bg-slate-700 text-slate-300 border-slate-600"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", isActive ? "text-slate-900" : item.color)} />
                                    {item.label}
                                </Link>
                            )
                        })}
                        <div className="pt-4 mt-4 border-t-2 border-slate-700">
                            <Button
                                className="w-full font-bold border-2 border-slate-600 bg-slate-700 text-red-400 hover:bg-slate-600 rounded-2xl py-6"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-5 w-5" />
                                Keluar Panel
                            </Button>
                        </div>
                    </div>
                )}
            </header>
        </>
    )
}

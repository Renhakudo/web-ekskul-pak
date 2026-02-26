'use client'

import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
            <div className="text-center space-y-4 max-w-sm">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Kesalahan Admin Panel</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    {error.message || 'Terjadi kesalahan pada panel admin. Coba muat ulang halaman.'}
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={reset} className="bg-red-600 hover:bg-red-700">
                        Coba Lagi
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/admin'}>
                        Dashboard Admin
                    </Button>
                </div>
            </div>
        </div>
    )
}

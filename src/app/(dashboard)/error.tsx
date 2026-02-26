'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
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
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Terjadi Kesalahan</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    {error.message || 'Sesuatu yang tidak terduga terjadi. Coba muat ulang halaman ini.'}
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={reset} className="bg-violet-600 hover:bg-violet-700">
                        Coba Lagi
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>
        </div>
    )
}

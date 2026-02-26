import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
            {/* Background decorations */}
            <div className="absolute top-20 right-20 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 left-20 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative text-center space-y-6 max-w-md">
                {/* Error Code */}
                <div className="relative">
                    <div className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-emerald-400 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 text-[120px] font-black text-white/5 leading-none select-none blur-sm">
                        404
                    </div>
                </div>

                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-violet-600/20 rounded-full flex items-center justify-center border border-violet-500/30">
                        <Search className="h-8 w-8 text-violet-400" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="text-2xl font-bold text-white">
                        Halaman Tidak Ditemukan
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Sepertinya halaman yang kamu cari tidak ada atau telah dipindahkan.
                        Kembali ke halaman utama dan mulai lagi dari sana.
                    </p>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Route tidak ditemukan
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link href="/">
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold">
                            <Home className="mr-2 h-4 w-4" />
                            Halaman Depan
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                            Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

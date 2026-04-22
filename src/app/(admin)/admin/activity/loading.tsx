import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export default function ActivityLoading() {
    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto min-h-screen font-sans animate-pulse">
            {/* Header */}
            <div className="bg-slate-800 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] p-8 flex items-center gap-4 mt-4">
                <div className="bg-yellow-400 p-3 rounded-2xl border-4 border-yellow-200 opacity-80">
                    <Activity className="h-10 w-10 text-slate-900" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-10 w-72 bg-slate-700" />
                    <Skeleton className="h-5 w-96 bg-slate-700 rounded-xl" />
                </div>
            </div>

            {/* Filter Skeleton */}
            <Card className="border-4 border-slate-900 rounded-3xl">
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-12 w-full rounded-2xl bg-slate-200" />
                    <div className="flex gap-3 flex-wrap">
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <Skeleton key={i} className="h-8 w-20 rounded-xl bg-slate-200" />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Table Skeleton */}
            <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-slate-800 p-6">
                    <Skeleton className="h-8 w-48 bg-slate-700" />
                </CardHeader>
                <CardContent className="p-0 divide-y-4 divide-slate-200">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="flex items-center gap-4 p-5 bg-white">
                            <Skeleton className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-40 bg-slate-200" />
                                <Skeleton className="h-3 w-24 bg-slate-100" />
                            </div>
                            <Skeleton className="h-7 w-28 bg-slate-200 rounded-lg" />
                            <Skeleton className="h-7 w-20 bg-slate-200 rounded-lg" />
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-20 bg-slate-100 rounded-full" />
                                <Skeleton className="h-5 w-16 bg-slate-100 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-16 bg-slate-100 ml-auto" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

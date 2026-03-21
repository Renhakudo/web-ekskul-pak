import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AdminLoading() {
  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-200 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 relative overflow-hidden mt-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl border-4 border-slate-900 bg-slate-300" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 bg-slate-300" />
            <Skeleton className="h-6 w-80 rounded-xl bg-slate-300" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 w-36 rounded-2xl border-4 border-slate-900 bg-slate-300" />
          <Skeleton className="h-12 w-36 rounded-2xl border-4 border-slate-900 bg-slate-300" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[24px] bg-slate-100 overflow-hidden">
            <div className="h-4 w-full border-b-4 border-slate-900 bg-slate-200"></div>
            <CardHeader className="pb-2 pt-6">
              <Skeleton className="h-6 w-32 bg-slate-300" />
            </CardHeader>
            <CardContent className="mt-auto pb-6">
              <Skeleton className="h-12 w-16 bg-slate-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeletons */}
      <div className="grid md:grid-cols-2 gap-8 my-8">
        <Skeleton className="h-80 w-full rounded-[32px] border-4 border-slate-900 bg-slate-200 shadow-[8px_8px_0px_#0f172a]" />
        <Skeleton className="h-80 w-full rounded-[32px] border-4 border-slate-900 bg-slate-200 shadow-[8px_8px_0px_#0f172a]" />
      </div>
    </div>
  )
}

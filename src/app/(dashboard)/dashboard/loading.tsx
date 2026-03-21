import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto font-sans animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-200 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8">
        <div className="flex gap-4 items-center">
          <Skeleton className="w-16 h-16 rounded-full border-2 border-slate-900" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-slate-300" />
            <Skeleton className="h-5 w-32 bg-slate-300" />
          </div>
        </div>
        <Skeleton className="h-12 w-32 rounded-full border-2 border-slate-900 bg-slate-300" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-4 border-slate-900 bg-slate-100 shadow-[6px_6px_0px_#0f172a] rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2 bg-slate-200 border-b-4 border-slate-900 h-14" />
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-12 w-16 bg-slate-300" />
              <Skeleton className="h-4 w-full bg-slate-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="h-64 rounded-[40px] border-4 border-slate-900 bg-slate-200 shadow-[10px_10px_0px_#cbd5e1]" />
        <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[40px] bg-slate-100 overflow-hidden h-64">
           <CardHeader className="pb-4 border-b-4 border-slate-900 bg-slate-200 h-16" />
           <CardContent className="p-6 space-y-4">
             <Skeleton className="h-16 w-full rounded-2xl border-2 border-slate-900 bg-slate-200" />
             <Skeleton className="h-16 w-full rounded-2xl border-2 border-slate-900 bg-slate-200" />
           </CardContent>
        </Card>
      </div>
    </div>
  )
}

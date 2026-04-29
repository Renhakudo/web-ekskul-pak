import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-8 flex flex-col font-sans max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center bg-slate-200 h-24 md:h-32 rounded-[2rem] border-4 border-slate-300 w-full"></div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white h-64 rounded-[2rem] border-4 border-slate-200 p-6 flex flex-col justify-between">
            <div className="w-16 h-16 bg-slate-200 rounded-2xl"></div>
            <div className="space-y-3">
              <div className="h-6 bg-slate-200 rounded-lg w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Centered text */}
      <div className="flex items-center justify-center pt-10 text-slate-400 font-black uppercase tracking-widest gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        Memuat Data...
      </div>
    </div>
  )
}

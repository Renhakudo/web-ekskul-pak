'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from 'recharts'
import { Activity, Zap, PenTool, Users } from 'lucide-react'

interface AdminChartsProps {
  attendanceData: { date: string; count: number }[]
  submissionData: { date: string; count: number }[]
  xpData: { name: string; min: number; max: number; count: number }[]
  roleData: { name: string; value: number; color: string }[]
}

export function AdminCharts({ attendanceData, submissionData, xpData, roleData }: AdminChartsProps) {
  
  // Custom Tooltip Gaya Neobrutalism
  const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-3 rounded-xl z-50">
          <p className="font-bold text-slate-600 mb-1">{label}</p>
          <p className="font-black text-slate-900 text-xl flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-slate-900" style={{ backgroundColor: payload[0].color || payload[0].fill }}></span>
            {payload[0].value} <span className="text-sm font-bold text-slate-500">{unit}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
      
      {/* GRAFIK 1: TREN KEHADIRAN (INTERAKTIF 30 HARI) */}
      <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-emerald-200 border-b-4 border-slate-900 p-6">
          <CardTitle className="font-black text-slate-900 flex items-center gap-3 text-xl uppercase tracking-tight">
            <div className="bg-emerald-400 p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              <Activity className="h-6 w-6 text-slate-900" />
            </div>
            Detak Jantung Web (Absensi)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[300px] w-full">
            {attendanceData && attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/> {/* Emerald-400 */}
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip unit="Siswa Hadir" />} cursor={{ stroke: '#0f172a', strokeWidth: 2, strokeDasharray: '5 5' }} />
                  <Area type="monotone" dataKey="count" stroke="#0f172a" strokeWidth={4} fillOpacity={1} fill="url(#colorAtt)" activeDot={{ r: 8, stroke: '#0f172a', strokeWidth: 3, fill: '#34d399' }} />
                  
                  {/* SLIDER GESER (BRUSH) */}
                  <Brush dataKey="date" height={30} stroke="#0f172a" fill="#f8fafc" travellerWidth={15} startIndex={attendanceData.length - 14} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-bold text-slate-400 border-4 border-dashed border-slate-200 rounded-xl">Belum ada data absensi.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GRAFIK 2: PENGUMPULAN TUGAS (INTERAKTIF 30 HARI) */}
      <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-pink-200 border-b-4 border-slate-900 p-6">
          <CardTitle className="font-black text-slate-900 flex items-center gap-3 text-xl uppercase tracking-tight">
            <div className="bg-pink-400 p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              <PenTool className="h-6 w-6 text-slate-900" />
            </div>
            Aktivitas Tugas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[300px] w-full">
            {submissionData && submissionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip unit="Tugas Dikumpulkan" />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" fill="#f472b6" radius={[4, 4, 0, 0]} stroke="#0f172a" strokeWidth={3} />
                  
                  {/* SLIDER GESER (BRUSH) */}
                  <Brush dataKey="date" height={30} stroke="#0f172a" fill="#f8fafc" travellerWidth={15} startIndex={submissionData.length - 14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-bold text-slate-400 border-4 border-dashed border-slate-200 rounded-xl">Belum ada tugas terkumpul.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GRAFIK 3: KOMPOSISI PENGGUNA (PIE CHART) */}
      <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-blue-200 border-b-4 border-slate-900 p-6">
          <CardTitle className="font-black text-slate-900 flex items-center gap-3 text-xl uppercase tracking-tight">
            <div className="bg-blue-400 p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              <Users className="h-6 w-6 text-slate-900" />
            </div>
            Warga Basecamp
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={roleData} 
                  cx="50%" cy="50%" 
                  innerRadius={60} outerRadius={90} 
                  paddingAngle={5} dataKey="value"
                  stroke="#0f172a" strokeWidth={3}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip unit="Akun" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda Manual Neobrutalism */}
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {roleData.map((role) => (
              <div key={role.name} className="flex items-center gap-2 font-black text-slate-700 uppercase tracking-wider text-sm bg-slate-100 px-3 py-1.5 rounded-lg border-2 border-slate-900">
                <span className="w-4 h-4 rounded-full border-2 border-slate-900" style={{ backgroundColor: role.color }}></span>
                {role.name}: {role.value}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GRAFIK 4: DISTRIBUSI XP (BAR CHART) */}
      <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-violet-200 border-b-4 border-slate-900 p-6">
          <CardTitle className="font-black text-slate-900 flex items-center gap-3 text-xl uppercase tracking-tight">
            <div className="bg-violet-400 p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              <Zap className="h-6 w-6 text-slate-900" />
            </div>
            Peta Kekuatan (XP)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[300px] w-full">
            {xpData && xpData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={xpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip unit="Siswa" />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]} stroke="#0f172a" strokeWidth={3} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-bold text-slate-400 border-4 border-dashed border-slate-200 rounded-xl">Data XP masih kosong.</div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
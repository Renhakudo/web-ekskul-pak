'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, LineChart as LineChartIcon } from 'lucide-react'

export function AdminCharts({ xpData, attendanceData }: { xpData: any[], attendanceData: any[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-8 mt-12 mb-6">
      <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="bg-emerald-100 border-b-4 border-slate-900 p-6">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-6 h-6 text-emerald-600" /> Distribusi Kekuatan (XP)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={xpData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: '4px solid #0f172a', boxShadow: '4px 4px 0px #0f172a', fontWeight: 'bold' }} />
              <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} stroke="#0f172a" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="bg-blue-100 border-b-4 border-slate-900 p-6">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
            <LineChartIcon className="w-6 h-6 text-blue-600" /> Tren Kehadiran (7 Hari)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
              <Tooltip cursor={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: '4px solid #0f172a', boxShadow: '4px 4px 0px #0f172a', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

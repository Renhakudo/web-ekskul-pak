'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, ArrowRight, Search, Loader2 } from "lucide-react"
import Link from "next/link"

export default function MyCoursesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('classes')
        .select('*, materials(count)')
        .order('created_at', { ascending: false })
      
      setClasses(data || [])
      setLoading(false)
    }
    fetchClasses()
  }, [])

  // Filter kelas berdasarkan search
  const filteredClasses = classes.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-violet-600"/></div>

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen">
      
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Materi & Tugas</h1>
          <p className="text-slate-500">Akses semua kelas dan modul pembelajaranmu di sini.</p>
        </div>
        
        {/* Fitur Search Sederhana */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari kelas..." 
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Tidak ada kelas yang ditemukan.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((kelas) => (
            <Card key={kelas.id} className="group hover:shadow-lg transition-all border-slate-200 cursor-pointer overflow-hidden flex flex-col">
              <div className="h-3 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <CardHeader>
                <CardTitle className="text-lg group-hover:text-violet-700 transition-colors">
                  {kelas.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {kelas.description || 'Mari belajar bersama!'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                    {kelas.materials ? kelas.materials[0].count : 0} Materi
                  </span>
                  <Link href={`/dashboard/classes/${kelas.id}`}>
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                      Buka Kelas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, BookOpen, ChevronRight, Loader2, PlayCircle, FolderOpen, AlignLeft, Sparkles, Map, Search } from 'lucide-react'
import Link from 'next/link'

interface ClassItem {
  id: string
  title: string
  description: string
  materials: any
}

export default function ManageClassesPage() {
  const supabase = createClient()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State Form
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  // State Live Search
  const [searchQuery, setSearchQuery] = useState('')

  const fetchClasses = async () => {
    // Jangan set loading true jika cuma real-time update agar tidak kedip
    if (classes.length === 0) setLoading(true)
    
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        materials (count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching classes:', error)
      toast.error('Gagal mengambil data kelas.')
    } else {
      setClasses(data as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchClasses()

    // 🪄 MAGIC: Real-Time Auto Update!
    const channel = supabase
      .channel('public:classes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        fetchClasses()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('classes')
      .insert({
        title,
        description: desc,
        created_by: user.id
      })

    if (error) {
      toast.error('Gagal membuat kelas: ' + error.message)
    } else {
      toast.success('Kelas rahasia berhasil dirakit! 🚀')
      setIsOpen(false)
      setTitle('')
      setDesc('')
      // Tidak perlu fetchClasses() manual karena Real-Time sudah bekerja
    }
    setIsSubmitting(false)
  }

  // Filter Live Search
  const filteredClasses = classes.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">
      
      {/* ====== BACKGROUND DOT PATTERN ====== */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed"></div>

      {/* ====== HEADER PUSAT KOMANDO ====== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-emerald-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden mt-4">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }}></div>
        
        <div className="relative z-10 flex-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase drop-shadow-sm">
            <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3 hover:rotate-6 transition-transform shrink-0">
              <Map className="h-8 w-8 md:h-10 md:w-10 text-emerald-600" />
            </div>
            Direktori Kelas
          </h1>
          <p className="text-slate-800 font-bold text-base md:text-lg mt-4 md:mt-5 bg-white/70 inline-block px-4 py-1.5 border-2 border-slate-900 rounded-xl shadow-sm rotate-1 hover:-rotate-1 transition-transform backdrop-blur-sm">
            Buat dan kelola misi pembelajaran untuk para pahlawan amatir ekskulmu.
          </p>
        </div>

        {/* Modal Tambah Kelas */}
        <div className="relative z-10 shrink-0 mt-2 lg:mt-0">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full lg:w-auto h-14 md:h-16 px-6 md:px-8 text-base md:text-lg font-black uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-[6px] active:translate-x-[6px] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all rounded-[1.5rem]">
                <Plus className="mr-2 h-6 w-6" /> Rilis Kelas Baru
              </Button>
            </DialogTrigger>
            
            {/* ISI MODAL FORM */}
            <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] sm:max-w-md p-6 md:p-8 bg-[#FDFBF7]">
              <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl font-black text-slate-900 uppercase flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-yellow-500 fill-yellow-400" /> Rakit Misi Baru
                </DialogTitle>
                <CardDescription className="font-bold text-slate-600 mt-2 text-sm md:text-base">
                  Bikin materi yang bikin pusing tapi nagih!
                </CardDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreate} className="space-y-6 mt-2">
                <div className="space-y-2 relative">
                  <Label className="font-black text-slate-900 uppercase text-xs ml-1">Nama Sandi / Judul</Label>
                  <div className="relative">
                    <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Misal: Operasi React JS"
                      className="pl-12 h-14 font-bold text-base md:text-lg border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] focus:translate-y-1 transition-all bg-white"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <Label className="font-black text-slate-900 uppercase text-xs ml-1">Intel Singkat (Deskripsi)</Label>
                  <div className="relative">
                    <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Apa tujuan utama misi ini..."
                      className="pl-12 h-14 font-medium text-base md:text-lg border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] focus:translate-y-1 transition-all bg-white"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-16 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-lg uppercase tracking-wider border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all rounded-2xl mt-4" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Luncurkan Kelas'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ====== CONTROL BAR (LIVE SEARCH) ====== */}
      <div className="flex bg-white p-4 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
          <Input 
            placeholder="Cari nama atau deskripsi kelas..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-4 bg-slate-50 border-2 border-slate-300 focus:border-slate-900 rounded-2xl font-bold text-base md:text-lg focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-all"
          />
        </div>
      </div>

      {/* ====== DAFTAR KELAS ====== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-14 w-14 animate-spin text-emerald-500 mb-4" />
          <p className="font-black text-slate-500 uppercase tracking-widest">Membuka Brankas...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-24 md:py-32 border-4 border-dashed border-slate-400 rounded-[2rem] md:rounded-[3rem] bg-white/50 relative overflow-hidden">
          <div className="w-24 h-24 bg-slate-200 border-4 border-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 transform -rotate-12 shadow-inner">
            <BookOpen className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 uppercase">
            {searchQuery ? 'Kelas Tidak Ditemukan' : 'Zonanya Masih Kosong'}
          </h3>
          <p className="font-bold text-slate-500 mt-2 text-lg">
            {searchQuery ? 'Coba gunakan kata kunci lain.' : 'Ayo rilis kelas pertamamu segera, komandan!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 pt-2">
          {filteredClasses.map((item, idx) => {
            const rotClass = idx % 2 === 0 ? 'hover:-rotate-2' : 'hover:rotate-2'
            const barColors = ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-emerald-400', 'bg-violet-400']
            const randomBarColor = barColors[idx % barColors.length]
            
            const matCount = Array.isArray(item.materials) 
              ? item.materials[0]?.count 
              : (item.materials as any)?.count || 0

            return (
              <Card key={item.id} className={`group flex flex-col border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[2rem] bg-white overflow-hidden hover:-translate-y-3 hover:shadow-[12px_12px_0px_#0f172a] ${rotClass} transition-all duration-300 cursor-default`}>
                
                {/* Top Bar Neobrutalism */}
                <div className={`h-8 w-full ${randomBarColor} border-b-4 border-slate-900 flex items-center px-4`}>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-white/50 border-2 border-slate-900"></div>
                      <div className="w-3 h-3 rounded-full bg-white/50 border-2 border-slate-900"></div>
                    </div>
                </div>

                <CardHeader className="p-6 md:p-8 pb-2">
                  <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 group-hover:text-violet-700 transition-colors leading-tight line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="font-bold text-slate-600 line-clamp-2 mt-3 text-base h-12 leading-relaxed">
                    {item.description || 'Intel kofidensial. Tidak ada deskripsi tertulis yang ditinggalkan.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="mt-auto p-6 md:p-8 pt-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <div className="text-sm font-black text-slate-900 bg-slate-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1.5 rounded-xl flex items-center gap-2 uppercase tracking-wider w-fit">
                    <PlayCircle className="h-4 w-4 text-emerald-600" />
                    {matCount} Fase Modul
                  </div>
                  <Link href={`/admin/classes/${item.id}`} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto h-12 md:h-14 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm md:text-base border-4 border-transparent shadow-[4px_4px_0px_#cbd5e1] rounded-xl group-hover:shadow-none group-hover:translate-y-[4px] group-hover:translate-x-[4px] transition-all uppercase tracking-wider">
                      Kelola Panel <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
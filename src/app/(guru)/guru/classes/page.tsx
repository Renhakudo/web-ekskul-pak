'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, BookOpen, ChevronRight, Loader2, PlayCircle, FolderOpen, AlignLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  title: string
  description: string
  materials: { count: number }[]
}

export default function ManageClassesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  const fetchClasses = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        materials (count)
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching classes:', error)
    } else {
      setClasses(data as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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
      toast.success('Kelas baru berhasil diluncurkan!')
      setIsOpen(false)
      setTitle('')
      setDesc('')
      fetchClasses()
    }
    setIsSubmitting(false)
  }

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-emerald-100 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-8 md:p-10 relative mt-2">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="bg-emerald-400 p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform rotate-3">
              <FolderOpen className="h-10 w-10 text-slate-900" />
            </div>
            Direktori Kelas
          </h1>
          <p className="text-slate-700 font-bold text-lg mt-3 bg-white inline-block px-4 py-1 border-2 border-slate-900 rounded-xl shadow-sm -rotate-1">
            Buat kompilasi misi seru untuk para pahlawan amatir ekskulmu.
          </p>
        </div>

        {/* Modal Tambah Kelas */}
        <div className="relative z-10 shrink-0">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-6 md:px-8 text-lg font-black bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] transition-all rounded-2xl">
                <Plus className="mr-2 h-6 w-6" /> Rilis Kelas Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[32px] sm:max-w-md p-8">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-slate-900">Rakit Misi Baru</DialogTitle>
                <CardDescription className="font-bold text-slate-500 mt-2">Bikin para siswa pusing tapi nagih.</CardDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label className="font-black text-slate-800 uppercase text-sm">Nama Sandi / Modul</Label>
                  <Input
                    placeholder="Contoh: Operasi Penguasaan React..."
                    className="h-14 font-bold text-lg border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] focus:translate-y-1 transition-all"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-slate-800 uppercase text-sm">Intel singkat (Deskripsi)</Label>
                  <div className="relative">
                    <AlignLeft className="absolute left-4 top-4 h-6 w-6 text-slate-400" />
                    <Input
                      placeholder="Apa inti misinya..."
                      className="pl-14 h-14 font-medium text-lg border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] focus:translate-y-1 transition-all"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a] hover:translate-y-1 transition-all rounded-2xl" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Luncurkan Kelas'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List Kelas */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-slate-900" /></div>
      ) : classes.length === 0 ? (
        <div className="text-center py-24 border-4 border-dashed border-slate-300 rounded-[32px] bg-slate-50">
          <div className="w-24 h-24 bg-slate-200 border-2 border-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Zonanya Masih Kosong</h3>
          <p className="font-bold text-slate-500 mt-2 text-lg">Ayo rilis kelas pertamamu segera, komandan!</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((item, idx) => {
            const rotClass = idx % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1'
            return (
              <Card key={item.id} className={`group flex flex-col border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] bg-white overflow-hidden hover:-translate-y-2 hover:shadow-[4px_4px_0px_#0f172a] ${rotClass} transition-all`}>
                <div className="h-6 bg-emerald-400 border-b-4 border-slate-900 w-full" />
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="font-bold text-slate-600 line-clamp-2 mt-2 text-base h-12">
                    {item.description || 'Intel kofidensial. Tidak ada deskripsi tertulis.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto p-6 pt-6 bg-white border-t-2 border-slate-100 flex items-end justify-between">
                  <div className="text-base font-black text-emerald-800 bg-emerald-200 border-2 border-emerald-300 px-4 py-1.5 rounded-xl flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    {item.materials ? item.materials[0]?.count : 0} Modul
                  </div>
                    <Link href={`/guru/classes/${item.id}`}>
                    <Button className="h-12 px-5 bg-slate-900 hover:bg-slate-800 text-white font-black border-2 border-slate-900 shadow-[3px_3px_0px_#34d399] rounded-xl group-hover:-translate-y-1 transition-transform">
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
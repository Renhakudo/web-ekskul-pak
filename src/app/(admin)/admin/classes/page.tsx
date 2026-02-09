'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, BookOpen, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Definisikan tipe data lokal
// Definisikan tipe data lokal
interface ClassItem {
  id: string
  title: string
  description: string
  // Tambahkan baris ini biar error hilang:
  materials: { count: number }[] 
}

export default function ManageClassesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State Form Create Class
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  // 1. Fetch Data Kelas
  const fetchClasses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        materials (count)
      `)
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

  // 2. Handle Create Class
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
      alert('Gagal membuat kelas: ' + error.message)
    } else {
      setIsOpen(false)
      setTitle('')
      setDesc('')
      fetchClasses() // Refresh list
    }
    setIsSubmitting(false)
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manajemen Kelas</h1>
          <p className="text-slate-500">Buat dan kelola kelas ekskul di sini.</p>
        </div>
        
        {/* Modal Tambah Kelas */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="mr-2 h-4 w-4" /> Buat Kelas Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Kelas Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nama Kelas</Label>
                <Input 
                  placeholder="Contoh: ReactJS Dasar - Batch 1" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Singkat</Label>
                <Input 
                  placeholder="Deskripsi singkat tentang kelas ini..." 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-violet-600" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Simpan Kelas'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* List Kelas */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-slate-50">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Belum ada kelas</h3>
          <p className="text-slate-500">Mulai dengan membuat kelas pertama Anda.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-all group border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl group-hover:text-violet-600 transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {item.description || 'Tidak ada deskripsi'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {item.materials ? item.materials[0]?.count : 0} Materi
                  </div>
                  <Link href={`/admin/classes/${item.id}`}>
                    <Button variant="outline" size="sm" className="group-hover:border-violet-500 group-hover:text-violet-600">
                      Kelola <ChevronRight className="ml-1 h-4 w-4" />
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
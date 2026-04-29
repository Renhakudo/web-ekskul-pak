'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Plus, BookOpen, ChevronRight, Loader2, PlayCircle, FolderOpen, 
  AlignLeft, Sparkles, Map, Search, Pencil, Tag, X, Save, AlertTriangle, Settings, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface ClassItem {
  id: string
  title: string
  description: string
  category?: string
  materials: any
}

interface CategoryItem {
  id: string
  name: string
  color: string
}

export default function ManageClassesPage() {
  const supabase = createClient()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Create modal
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('')

  // Edit modal
  const [editTarget, setEditTarget] = useState<ClassItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Categories Modal
  const [isCatOpen, setIsCatOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('bg-slate-400')
  const [isCatSubmitting, setIsCatSubmitting] = useState(false)

  const fetchData = async () => {
    if (classes.length === 0) setLoading(true)
    
    // Fetch categories
    const { data: catData } = await supabase.from('class_categories').select('*').order('name')
    if (catData) {
      setCategories(catData)
      if (catData.length > 0 && !category) setCategory(catData[0].name)
    }

    // Fetch classes
    const { data: clsData, error } = await supabase
      .from('classes')
      .select(`*, materials (count)`)
      .order('created_at', { ascending: false })
    
    if (error) {
      toast.error('Gagal mengambil data kelas.')
    } else {
      setClasses(clsData as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('public:classes_and_categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_categories' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSubmitting(false); return }

    const { error } = await supabase.from('classes').insert({
      title, description: desc, created_by: user.id, category
    })
    if (error) {
      toast.error('Gagal membuat kelas: ' + error.message)
    } else {
      toast.success('Kelas berhasil diluncurkan! 🚀')
      setIsOpen(false)
      setTitle(''); setDesc(''); setCategory(categories[0]?.name || '')
    }
    setIsSubmitting(false)
  }

  const openEdit = (item: ClassItem, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setEditTarget(item)
    setEditTitle(item.title)
    setEditDesc(item.description || '')
    setEditCategory(item.category || (categories[0]?.name || ''))
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setIsEditSubmitting(true)
    const { error } = await supabase.from('classes').update({
      title: editTitle, description: editDesc, category: editCategory
    }).eq('id', editTarget.id)
    if (error) {
      toast.error('Gagal memperbarui kelas: ' + error.message)
    } else {
      toast.success('Kelas berhasil diperbarui! ✨')
      setEditTarget(null)
      fetchData()
    }
    setIsEditSubmitting(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const { error } = await supabase.from('classes').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Gagal menghapus kelas: ' + error.message)
    } else {
      toast.success('Kelas berhasil dihapus.')
      setDeleteTarget(null)
      fetchData()
    }
    setIsDeleting(false)
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCatSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('class_categories').insert({
      name: catName, color: catColor, created_by: user?.id
    })
    
    if (error) {
      toast.error('Gagal menambah kategori: ' + error.message)
    } else {
      toast.success('Kategori baru berhasil ditambahkan!')
      setCatName(''); setCatColor('bg-slate-400')
      fetchData()
    }
    setIsCatSubmitting(false)
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return
    const { error } = await supabase.from('class_categories').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus: ' + error.message)
    else { toast.success('Kategori dihapus'); fetchData() }
  }

  // Filter
  const filteredClasses = classes.filter(c => {
    const matchSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = filterCategory === 'all' || c.category === filterCategory
    return matchSearch && matchCategory
  })

  const getCategoryColor = (catName: string) => {
    const cat = categories.find(c => c.name === catName)
    return cat?.color || 'bg-slate-400'
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto min-h-screen font-sans relative z-0 overflow-x-hidden pb-24">
      {/* Background pattern */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40 fixed" />

      {/* ====== HEADER ====== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-emerald-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[12px_12px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden mt-4">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }} />
        <div className="relative z-10 flex-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase drop-shadow-sm">
            <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] transform -rotate-3 hover:rotate-6 transition-transform shrink-0">
              <Map className="h-8 w-8 md:h-10 md:w-10 text-emerald-600" />
            </div>
            Direktori Kelas
          </h1>
          <p className="text-slate-800 font-bold text-base md:text-lg mt-4 md:mt-5 bg-white/70 inline-block px-4 py-1.5 border-2 border-slate-900 rounded-xl shadow-sm rotate-1 hover:-rotate-1 transition-transform backdrop-blur-sm">
            {classes.length} kelas aktif dalam sistem.
          </p>
        </div>

        {/* Buttons */}
        <div className="relative z-10 shrink-0 mt-2 lg:mt-0 flex flex-col sm:flex-row gap-3">
          <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 md:h-16 px-6 md:px-8 text-base md:text-lg font-black uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-900 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 transition-all rounded-[1.5rem]">
                <Settings className="mr-2 h-6 w-6" /> Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] sm:max-w-md p-6 bg-[#FDFBF7]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900 uppercase flex items-center gap-3">
                  <Tag className="w-6 h-6 text-emerald-600" /> Kelola Kategori
                </DialogTitle>
              </DialogHeader>
              
              <div className="mt-4 space-y-4">
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {categories.length === 0 ? <p className="text-sm font-bold text-slate-500">Belum ada kategori.</p> : null}
                  {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-white border-2 border-slate-900 p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border border-slate-900 ${c.color}`}></div>
                        <span className="font-bold text-sm uppercase">{c.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-700" onClick={() => handleDeleteCategory(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCreateCategory} className="border-t-2 border-slate-200 pt-4 space-y-3">
                  <h4 className="font-black text-sm uppercase">Tambah Kategori</h4>
                  <div className="flex gap-2">
                    <Input placeholder="Nama kategori..." value={catName} onChange={e => setCatName(e.target.value)} required className="border-2 border-slate-900 font-bold" />
                    <Select value={catColor} onValueChange={setCatColor}>
                      <SelectTrigger className="w-[100px] border-2 border-slate-900 font-bold">
                        <div className={`w-4 h-4 rounded-full border border-slate-900 ${catColor}`}></div>
                      </SelectTrigger>
                      <SelectContent>
                        {['bg-violet-400', 'bg-blue-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-green-400', 'bg-yellow-400', 'bg-amber-400', 'bg-orange-400', 'bg-pink-400', 'bg-rose-400', 'bg-red-400', 'bg-slate-400'].map(col => (
                          <SelectItem key={col} value={col}>
                            <div className={`w-4 h-4 rounded-full border border-slate-900 ${col}`}></div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={isCatSubmitting} className="w-full font-black border-2 border-slate-900 bg-emerald-400 hover:bg-emerald-300 text-slate-900">
                    {isCatSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tambah'}
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button id="btn-create-class" className="w-full lg:w-auto h-14 md:h-16 px-6 md:px-8 text-base md:text-lg font-black uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-[6px] active:translate-x-[6px] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all rounded-[1.5rem]">
                <Plus className="mr-2 h-6 w-6" /> Rilis Kelas Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] sm:max-w-md p-6 md:p-8 bg-[#FDFBF7]">
              <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl font-black text-slate-900 uppercase flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-yellow-500 fill-yellow-400" /> Rakit Misi Baru
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-5 mt-2">
                <div className="space-y-2">
                  <Label className="font-black text-slate-900 uppercase text-xs ml-1">Nama / Judul Kelas</Label>
                  <div className="relative">
                    <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Misal: Operasi React JS"
                      className="pl-12 h-14 font-bold text-base border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] focus:translate-y-1 transition-all bg-white"
                      value={title} onChange={(e) => setTitle(e.target.value)} required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-slate-900 uppercase text-xs ml-1">Deskripsi</Label>
                  <div className="relative">
                    <AlignLeft className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                    <Textarea
                      placeholder="Apa tujuan utama misi ini..."
                      className="pl-12 min-h-[80px] font-medium border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl focus-visible:ring-0 focus:shadow-[2px_2px_0px_#0f172a] focus:translate-y-1 transition-all bg-white resize-none"
                      value={desc} onChange={(e) => setDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-slate-900 uppercase text-xs ml-1">Kategori</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-14 border-4 border-slate-900 font-bold text-base rounded-2xl focus:ring-0 focus:shadow-[4px_4px_0px_#0f172a] bg-white">
                      <Tag className="h-5 w-5 mr-2 text-slate-400" /><SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent className="border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0f172a]">
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name} className="font-bold py-2.5 text-base cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full border border-slate-900 ${cat.color}`}></div>
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full h-16 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-lg uppercase tracking-wider border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all rounded-2xl mt-4" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Luncurkan Kelas'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ====== SEARCH + FILTER KATEGORI ====== */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
          <Input
            placeholder="Cari nama atau deskripsi kelas..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-4 bg-slate-50 border-2 border-slate-300 focus:border-slate-900 rounded-2xl font-bold text-base focus-visible:ring-0 focus:shadow-[4px_4px_0px_#0f172a] transition-all"
          />
        </div>
        <div className="flex gap-2 flex-nowrap items-center overflow-x-auto pb-3 pt-1 hide-scrollbar scroll-smooth">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-xl font-black text-sm border-2 border-slate-900 uppercase tracking-wider transition-all whitespace-nowrap ${filterCategory === 'all' ? 'bg-slate-900 text-white shadow-none' : 'bg-white text-slate-600 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5'}`}
          >Semua</button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.name ? 'all' : cat.name)}
              className={`px-4 py-2 rounded-xl font-black text-sm border-2 border-slate-900 uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${filterCategory === cat.name ? `${cat.color} text-slate-900 shadow-none` : 'bg-white text-slate-600 shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5'}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full border border-slate-900 ${cat.color}`}></div>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ====== DAFTAR KELAS ====== */}
      {loading ? (
        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-[2rem] border-4 border-slate-200" />
          ))}
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-24 md:py-32 border-4 border-dashed border-slate-400 rounded-[2rem] md:rounded-[3rem] bg-white/50 relative overflow-hidden">
          <div className="w-24 h-24 bg-slate-200 border-4 border-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 transform -rotate-12 shadow-inner">
            <BookOpen className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 uppercase">
            {searchQuery || filterCategory !== 'all' ? 'Tidak Ditemukan' : 'Zonanya Masih Kosong'}
          </h3>
          <p className="font-bold text-slate-500 mt-2 text-lg">
            {searchQuery || filterCategory !== 'all' ? 'Coba ubah filter atau kata kunci.' : 'Ayo rilis kelas pertamamu, komandan!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 pt-2">
          {filteredClasses.map((item, idx) => {
            const rotClass = idx % 2 === 0 ? 'hover:-rotate-2' : 'hover:rotate-2'
            const barColors = ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-emerald-400', 'bg-violet-400']
            const randomBarColor = barColors[idx % barColors.length]
            const catColor = getCategoryColor(item.category || '')
            const matCount = Array.isArray(item.materials)
              ? item.materials[0]?.count
              : (item.materials as any)?.count || 0

            return (
              <Card key={item.id} className={`group flex flex-col border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[2rem] bg-white overflow-hidden hover:-translate-y-3 hover:shadow-[12px_12px_0px_#0f172a] ${rotClass} transition-all duration-300 cursor-default`}>
                {/* Top Bar */}
                <div className={`h-8 w-full ${catColor} border-b-4 border-slate-900 flex items-center justify-between px-4 transition-colors`}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white/50 border-2 border-slate-900" />
                    <div className="w-3 h-3 rounded-full bg-white/50 border-2 border-slate-900" />
                  </div>
                  {item.category && (
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border-2 border-slate-900 shadow-sm ${catColor} text-slate-900`}>
                      {item.category}
                    </span>
                  )}
                </div>

                <CardHeader className="p-6 md:p-8 pb-2">
                  <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 group-hover:text-violet-700 transition-colors leading-tight line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="font-bold text-slate-600 line-clamp-2 mt-3 text-base h-12 leading-relaxed">
                    {item.description || 'Tidak ada deskripsi.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="mt-auto p-6 md:p-8 pt-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <div className="text-sm font-black text-slate-900 bg-slate-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] px-3 py-1.5 rounded-xl flex items-center gap-2 uppercase tracking-wider w-fit">
                    <PlayCircle className="h-4 w-4 text-emerald-600" />
                    {matCount} Modul
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      id={`btn-edit-class-${item.id}`}
                      onClick={(e) => openEdit(item, e)}
                      className="h-12 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-sm border-4 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl hover:-translate-y-1 transition-all uppercase"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/classes/${item.id}`} className="flex-1 sm:flex-none">
                      <Button className="w-full sm:w-auto h-12 md:h-14 px-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm md:text-base border-4 border-transparent shadow-[4px_4px_0px_#cbd5e1] rounded-xl group-hover:shadow-none group-hover:translate-y-[4px] group-hover:translate-x-[4px] transition-all uppercase tracking-wider">
                        Kelola <ChevronRight className="ml-1 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ====== EDIT KELAS DIALOG ====== */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] sm:max-w-md p-6 md:p-8 bg-[#FDFBF7]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase flex items-center gap-3">
              <Pencil className="w-6 h-6 text-yellow-500" /> Edit Kelas
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label className="font-black text-slate-900 uppercase text-xs">Judul Kelas</Label>
              <Input
                className="h-14 font-bold text-base border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl focus-visible:ring-0 bg-white"
                value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required
              />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-slate-900 uppercase text-xs">Deskripsi</Label>
              <Textarea
                className="min-h-[80px] font-medium border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl focus-visible:ring-0 bg-white resize-none"
                value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-slate-900 uppercase text-xs">Kategori</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="h-14 border-4 border-slate-900 font-bold rounded-2xl focus:ring-0 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-4 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0f172a]">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name} className="font-bold py-2.5 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border border-slate-900 ${cat.color}`}></div>
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-14 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-base uppercase tracking-wider border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-2xl transition-all" disabled={isEditSubmitting}>
              {isEditSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-2" /> Simpan Perubahan</>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ====== DELETE CONFIRM ====== */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] rounded-[2rem] bg-[#FDFBF7] p-6 sm:p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black text-3xl text-slate-900 flex items-center gap-3 uppercase">
              <div className="bg-red-300 p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transform -rotate-6">
                <AlertTriangle className="h-8 w-8 text-red-700" />
              </div>
              Hapus Kelas
            </DialogTitle>
          </DialogHeader>
          <p className="font-bold text-slate-600 my-4 text-base leading-relaxed">
            Hapus kelas <span className="font-black text-slate-900">"{deleteTarget?.title}"</span>? Seluruh materi, tugas, dan quiz akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.
          </p>
          <div className="flex gap-4 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="font-black uppercase border-2 border-slate-900 h-14 rounded-xl px-6 hover:bg-slate-200">Batal</Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-400 text-slate-900 font-black border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 h-14 rounded-xl px-6 uppercase transition-all" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Hapus!'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Image, Loader2, Save, Eye, EyeOff, CheckCircle, FileSignature, CalendarDays } from 'lucide-react'

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [slug, setSlug] = useState('')

  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setTitle(data.title)
        setContent(data.content)
        setCategory(data.category || '')
        setStatus(data.status)
        setCoverUrl(data.cover_url)
        setCoverPreview(data.cover_url)
        setSlug(data.slug)
      }
      setLoading(false)
    }
    fetchPost()
  }, [id])

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran gambar maks 5MB. Jangan dipaksa.'); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!title.trim() || !content.trim()) { setError('Judul dan konten dilarang kosong melompong.'); return }

    setSaving(true)

    let finalCoverUrl = coverUrl
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop()
      const filePath = `covers/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, coverFile, { upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(filePath)
        finalCoverUrl = urlData.publicUrl
      }
    }

    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        title: title.trim(),
        content: content.trim(),
        category: category || null,
        status,
        cover_url: finalCoverUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      setError('Gagal merevisi: ' + updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 mt-10">
      <Skeleton className="h-20 w-full rounded-2xl bg-pink-100 border-4 border-slate-900" />
      <div className="grid md:grid-cols-3 gap-8">
        <Skeleton className="md:col-span-2 h-[500px] w-full rounded-[32px] bg-slate-200 border-4 border-slate-900" />
        <Skeleton className="h-[400px] w-full rounded-[32px] bg-amber-100 border-4 border-slate-900" />
      </div>
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto font-sans min-h-screen">

      {/* HEADER PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-pink-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-6 md:p-8 relative overflow-hidden mb-12">
        <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
          <Link href="/admin/blog" className="shrink-0">
            <Button size="icon" className="h-12 w-12 bg-white text-slate-900 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-200 rounded-2xl hover:-translate-y-1 transition-transform">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Bedah Artikel</h1>
            <p className="text-xs md:text-sm font-bold text-slate-800 bg-white/60 inline-flex items-center px-2 py-0.5 mt-1 rounded border-2 border-slate-900 shadow-sm font-mono truncate max-w-[200px] sm:max-w-none">
              /{slug}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <Button type="button" className="h-12 px-6 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-black rounded-xl transition-all" onClick={() => setPreview(!preview)}>
            {preview ? <EyeOff className="h-5 w-5 mr-2" /> : <Eye className="h-5 w-5 mr-2" />}
            {preview ? 'Mode Edit' : 'Pralihat'}
          </Button>
          <Badge className={`text-xs px-3 py-1.5 font-black uppercase tracking-widest border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${status === 'published'
            ? 'bg-emerald-400 text-slate-900'
            : 'bg-slate-200 text-slate-500'
            }`}>
            {status === 'published' ? 'Live' : 'Draft'}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="mb-8 rounded-2xl bg-red-200 border-4 border-slate-900 p-4 text-slate-900 font-black flex items-center shadow-[4px_4px_0px_#0f172a] transform rotate-1">
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-8 rounded-2xl bg-emerald-200 border-4 border-slate-900 p-4 text-slate-900 font-black flex items-center gap-3 shadow-[4px_4px_0px_#0f172a] animate-bounce">
          <CheckCircle className="h-6 w-6 text-emerald-700" /> Teks baru telah diamankan di brankas!
        </div>
      )}

      {/* TAMPILAN PRALIHAT (Sama persis dengan Publik) */}
      {preview ? (
        <div className="bg-[#FDFBF7] border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] md:shadow-[20px_20px_0px_#0f172a] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 lg:p-16 relative overflow-hidden z-0">
          
          {/* Dot Pattern Background */}
          <div className="absolute inset-0 z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:32px_32px] opacity-40"></div>

          {/* Simulasi Header Artikel */}
          <div className="mb-10 md:mb-14 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 md:gap-4 mb-6 md:mb-8">
              {category && (
                <Badge className="bg-yellow-400 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] font-black uppercase tracking-wider text-xs md:text-sm px-4 py-1.5 transform -rotate-2">
                  {category}
                </Badge>
              )}
              <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] px-4 py-1.5 rounded-xl flex items-center gap-2 font-bold text-xs md:text-sm text-slate-700">
                <CalendarDays className="w-4 h-4 text-violet-600" />
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8 drop-shadow-sm">
              {title || 'Ketik Judul Artikelmu Disini...'}
            </h1>

            {/* Mock Author Card */}
            <div className="inline-flex items-center gap-4 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl transform rotate-1">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-violet-300 border-2 border-slate-900 flex items-center justify-center font-black text-violet-900 text-xl shadow-inner">
                A
              </div>
              <div className="text-left">
                <div className="font-black text-slate-900 text-sm md:text-base uppercase tracking-wide">Ditulis Oleh</div>
                <div className="font-bold text-violet-700 text-base md:text-lg">Admin Ekskul</div>
              </div>
            </div>
          </div>

          {coverPreview && (
            <div className="w-full aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden mb-12 md:mb-16 bg-slate-100 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] md:shadow-[16px_16px_0px_#0f172a]">
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Simulasi Kertas Konten */}
          <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[2rem] p-6 md:p-12 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-pink-400/80 border-2 border-slate-900 transform -rotate-2 opacity-80 mix-blend-multiply"></div>
            <div className="prose prose-slate prose-lg max-w-none text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {content || 'Konten yang kamu tulis akan muncul di sini dengan rapi...'}
            </div>
          </div>
        </div>

      ) : (

        /* TAMPILAN EDIT FORM */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Editor Utama */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a]">
                <Label htmlFor="title" className="text-xl font-black text-slate-900 uppercase flex items-center gap-2 mb-4">
                  <FileSignature className="h-6 w-6 text-pink-500" /> Revisi Judul
                </Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="h-16 md:h-20 text-xl md:text-3xl font-black border-4 border-slate-900 rounded-2xl shadow-inner focus:shadow-[4px_4px_0px_#0f172a] transition-all px-6" />
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a]">
                <Label htmlFor="content" className="text-xl font-black text-slate-900 uppercase flex items-center gap-2 mb-4">
                  📝 Revisi Konten
                </Label>
                <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} required className="min-h-[500px] text-lg md:text-xl font-medium leading-relaxed resize-y border-4 border-slate-900 rounded-2xl shadow-inner focus:shadow-[4px_4px_0px_#0f172a] transition-all p-6" />
              </div>
            </div>

            {/* Sidebar Konfigurasi */}
            <div className="space-y-8">
              <div className="bg-amber-100 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-6 md:p-8 space-y-6">
                <h3 className="font-black text-slate-900 text-2xl uppercase border-b-4 border-slate-900 pb-3">Konfigurasi</h3>
                
                <div className="space-y-3">
                  <Label className="font-black text-slate-800 text-base uppercase">Status Penayangan</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger className="h-14 border-4 border-slate-900 font-black text-base bg-white rounded-xl shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-xl">
                      <SelectItem value="draft" className="font-bold text-base py-3">📝 Draft Rahasia</SelectItem>
                      <SelectItem value="published" className="font-bold text-base py-3">🌐 Tayang Publik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="category" className="font-black text-slate-800 text-base uppercase">Label Kategori</Label>
                  <Input id="category" value={category} placeholder="Contoh: Tutorial" onChange={e => setCategory(e.target.value)} className="h-14 border-4 border-slate-900 font-bold bg-white rounded-xl text-base" />
                </div>
              </div>

              <div className="bg-emerald-100 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-6 md:p-8 space-y-5">
                <h3 className="font-black text-slate-900 text-2xl uppercase border-b-4 border-slate-900 pb-3">Ubah Cover</h3>
                {coverPreview ? (
                  <div className="space-y-4">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] relative group cursor-pointer">
                      <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                        <label className="cursor-pointer font-black text-white text-xl flex flex-col items-center"><Image className="h-8 w-8 mb-2" /> Ganti</label>
                        <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                      </div>
                    </div>
                    <Button type="button" className="w-full h-12 border-4 border-slate-900 bg-red-400 hover:bg-red-500 text-slate-900 font-black shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 rounded-xl text-base uppercase"
                      onClick={() => { setCoverFile(null); setCoverPreview(null); setCoverUrl(null) }}>
                      Cabut Gambar
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-4 border-dashed border-slate-900 rounded-2xl bg-white p-8 cursor-pointer hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] transition-all">
                    <Image className="h-12 w-12 text-slate-400 mb-3" />
                    <span className="font-black text-slate-600 uppercase">Pilih Foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                  </label>
                )}
              </div>

              <Button type="submit" disabled={saving} className="w-full h-16 md:h-20 bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] hover:translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] active:translate-y-2 active:shadow-none transition-all rounded-[2rem] font-black text-xl md:text-2xl uppercase">
                {saving ? <><Loader2 className="h-6 w-6 animate-spin mr-3" />Menyimpan...</> : <><Save className="h-7 w-7 mr-3" />Simpan Perubahan</>}
              </Button>

              {status === 'published' && (
                <Link href={`/blog/${slug}`} target="_blank" className="block mt-6">
                  <Button type="button" className="w-full h-14 md:h-16 bg-white text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-1 active:shadow-none transition-all rounded-[1.5rem] text-base md:text-lg">
                    <Eye className="h-6 w-6 mr-3 text-violet-600" /> Pantau di Publik
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
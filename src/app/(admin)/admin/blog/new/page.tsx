'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Image, Loader2, Upload, Eye, EyeOff, FileSignature } from 'lucide-react'

// Helper: auto-generate slug dari title
const generateSlug = (title: string) =>
    title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    + '-' + Date.now().toString(36)

export default function NewBlogPage() {
    const supabase = createClient()
    const router = useRouter()

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('')
    const [status, setStatus] = useState<'draft' | 'published'>('draft')
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [preview, setPreview] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            setError('Ukuran gambar maksimal 5MB. Jangan maksa server!')
            return
        }
        setCoverFile(file)
        setCoverPreview(URL.createObjectURL(file))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim() || !content.trim()) {
            setError('Judul dan konten berita harus diisi. Pantang kirim kertas kosong.')
            return
        }

        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Sesi habis, silakan login ulang.'); setLoading(false); return }

        let coverUrl: string | null = null
        if (coverFile) {
            const fileExt = coverFile.name.split('.').pop()
            const filePath = `covers/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('blog-images')
                .upload(filePath, coverFile, { upsert: true })

            if (uploadError) {
                console.warn('Cover upload gagal:', uploadError.message)
            } else {
                const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(filePath)
                coverUrl = urlData.publicUrl
            }
        }

        const slug = generateSlug(title)

        const { error: insertError } = await supabase.from('blog_posts').insert({
            title: title.trim(),
            slug,
            content: content.trim(),
            category: category || null,
            status,
            cover_url: coverUrl,
            author_id: user.id,
        })

        if (insertError) {
            setError('Gagal menerbitkan artikel: ' + insertError.message)
            setLoading(false)
            return
        }

        router.push('/admin/blog')
        router.refresh()
    }

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto font-sans min-h-screen">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-pink-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-6 md:p-8 relative overflow-hidden mb-8">
                <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                    <Link href="/admin/blog" className="shrink-0">
                        <Button size="icon" className="h-12 w-12 bg-white text-slate-900 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-200 rounded-2xl">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            Tulis Artikel Baru
                        </h1>
                        <p className="text-slate-800 font-bold">Ketik berita ekskul terhangat hari ini.</p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <Button
                        type="button"
                        className="h-12 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-black rounded-xl"
                        onClick={() => setPreview(!preview)}
                    >
                        {preview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {preview ? 'Mode Edit' : 'Pralihat'}
                    </Button>
                    <Badge className={`text-xs px-3 py-1 font-black uppercase tracking-widest border-2 border-slate-900 shadow-sm ${status === 'published'
                        ? 'bg-emerald-400 text-slate-900'
                        : 'bg-slate-200 text-slate-500'
                        }`}>
                        {status === 'published' ? 'Live' : 'Draft'}
                    </Badge>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl bg-red-200 border-4 border-slate-900 p-4 text-slate-900 font-black flex items-center shadow-[4px_4px_0px_#0f172a] transform rotate-1">
                    {error}
                </div>
            )}

            {preview ? (
                /* PREVIEW MODE */
                <div className="bg-white rounded-[32px] border-4 border-slate-900 p-8 shadow-[8px_8px_0px_#0f172a]">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">{title || 'Judul Artikel Kosong'}</h2>
                    {category && <Badge className="mb-6 bg-violet-200 text-violet-800 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-black uppercase text-xs px-3 py-1">{category}</Badge>}
                    {coverPreview && (
                        <div className="w-full aspect-video rounded-3xl overflow-hidden mb-8 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                            <img src={coverPreview} alt="cover" className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all" />
                        </div>
                    )}
                    <div className="prose prose-slate max-w-none text-slate-800 font-medium whitespace-pre-wrap leading-relaxed text-lg">
                        {content || 'Konten belum ditulis. Silakan kembali ke mode Edit.'}
                    </div>
                </div>
            ) : (
                /* EDIT MODE */
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-8">

                        {/* Main Content Area */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                                <Label htmlFor="title" className="text-lg font-black text-slate-900 uppercase flex items-center gap-2 mb-3">
                                    <FileSignature className="h-5 w-5 text-pink-500" /> Judul Kabar Utama
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="Siapa yang menang lomba hari ini?"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    className="h-16 text-xl font-bold border-4 border-slate-900 rounded-2xl shadow-sm focus:shadow-[4px_4px_0px_#0f172a] transition-all"
                                />
                            </div>

                            <div className="bg-white p-6 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                                <Label htmlFor="content" className="text-lg font-black text-slate-900 uppercase flex items-center gap-2 mb-1">
                                    Isi Naskah
                                </Label>
                                <p className="text-sm font-bold text-slate-500 mb-4 bg-slate-100 inline-block px-3 py-1 rounded-lg border-2 border-slate-200">Gunakan Enter untuk memisahkan paragraf.</p>
                                <Textarea
                                    id="content"
                                    placeholder="Pada suatu hari di ruang ekskul tercinta kita..."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    required
                                    className="min-h-[400px] text-lg font-medium leading-relaxed resize-y border-4 border-slate-900 rounded-2xl shadow-inner focus:shadow-[4px_4px_0px_#0f172a] transition-all p-4"
                                />
                            </div>
                        </div>

                        {/* Sidebar Settings */}
                        <div className="space-y-6">

                            {/* Publish Settings */}
                            <div className="bg-amber-100 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 space-y-5">
                                <h3 className="font-black text-slate-900 text-xl uppercase border-b-4 border-slate-900 pb-2">Konfigurasi</h3>

                                <div className="space-y-2">
                                    <Label className="font-black text-slate-800">Status Penayangan</Label>
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger className="h-12 border-4 border-slate-900 font-bold bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                                            <SelectItem value="draft" className="font-bold">📝 Ditunda (Draft)</SelectItem>
                                            <SelectItem value="published" className="font-bold">🌐 Tayang Langsung</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category" className="font-black text-slate-800">Label Kategori</Label>
                                    <Input
                                        id="category"
                                        placeholder="Pencapaian, Tutorial..."
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="h-12 border-4 border-slate-900 font-bold bg-white"
                                    />
                                </div>
                            </div>

                            {/* Cover Image */}
                            <div className="bg-emerald-100 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 space-y-4">
                                <h3 className="font-black text-slate-900 text-xl uppercase border-b-4 border-slate-900 pb-2">Cover Visual</h3>

                                {coverPreview ? (
                                    <div className="space-y-3">
                                        <div className="aspect-video w-full rounded-2xl overflow-hidden border-4 border-slate-900 shadow-sm">
                                            <img src={coverPreview} alt="cover preview" className="w-full h-full object-cover" />
                                        </div>
                                        <Button
                                            type="button"
                                            className="w-full h-10 border-4 border-slate-900 font-black text-slate-900 bg-red-400 hover:bg-red-500 shadow-[2px_2px_0px_#0f172a]"
                                            onClick={() => { setCoverFile(null); setCoverPreview(null) }}
                                        >
                                            Buang Gambar
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-4 border-dashed border-slate-900 bg-white rounded-2xl p-6 cursor-pointer hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] transition-all">
                                        <Image className="h-10 w-10 text-slate-400 mb-2" />
                                        <span className="font-bold text-slate-600">Klik Pilih Cover</span>
                                        <span className="text-xs font-bold text-slate-400 mt-1 max-w-[150px] text-center">Rasio 16:9 disarankan</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                                    </label>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-16 bg-pink-500 hover:bg-pink-400 text-slate-900 font-black text-xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0px_#0f172a] transition-all rounded-2xl"
                                >
                                    {loading ? (
                                        <><Loader2 className="h-6 w-6 animate-spin mr-2" /> Mengetik...</>
                                    ) : (
                                        <><Upload className="h-5 w-5 mr-3" /> {status === 'published' ? 'Terbitkan Ke Publik' : 'Simpan Diam-diam'}</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}

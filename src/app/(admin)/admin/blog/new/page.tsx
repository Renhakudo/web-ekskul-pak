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
import { ArrowLeft, Image, Loader2, Upload, Eye, EyeOff } from 'lucide-react'

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
            setError('Ukuran gambar maksimal 5MB.')
            return
        }
        setCoverFile(file)
        setCoverPreview(URL.createObjectURL(file))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim() || !content.trim()) {
            setError('Judul dan konten tidak boleh kosong.')
            return
        }

        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Sesi habis, silakan login ulang.'); setLoading(false); return }

        // Upload cover image ke Supabase Storage (bucket: blog-images)
        let coverUrl: string | null = null
        if (coverFile) {
            const fileExt = coverFile.name.split('.').pop()
            const filePath = `covers/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('blog-images')
                .upload(filePath, coverFile, { upsert: true })

            if (uploadError) {
                // Jika bucket belum ada, tetap lanjutkan tanpa cover
                console.warn('Cover upload gagal (bucket mungkin belum dibuat):', uploadError.message)
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
            setError('Gagal menyimpan artikel: ' + insertError.message)
            setLoading(false)
            return
        }

        router.push('/admin/blog')
        router.refresh()
    }

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/blog">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tulis Artikel Baru</h1>
                    <p className="text-sm text-slate-500">Buat artikel atau berita baru untuk ekskul.</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => setPreview(!preview)}
                    >
                        {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {preview ? 'Edit' : 'Preview'}
                    </Button>
                    <Badge className={status === 'published'
                        ? 'bg-emerald-100 text-emerald-700 border-0'
                        : 'bg-yellow-100 text-yellow-700 border-0'
                    }>
                        {status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {preview ? (
                /* PREVIEW MODE */
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{title || 'Judul Artikel'}</h2>
                    {category && <Badge variant="outline" className="mb-4 text-violet-600 border-violet-200">{category}</Badge>}
                    {coverPreview && (
                        <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 bg-slate-100">
                            <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {content || 'Konten artikel akan muncul di sini...'}
                    </div>
                </div>
            ) : (
                /* EDIT MODE */
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">

                        {/* Main Content Area */}
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <Label htmlFor="title" className="text-sm font-semibold">Judul Artikel *</Label>
                                <Input
                                    id="title"
                                    placeholder="Masukkan judul yang menarik..."
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    className="mt-1.5 h-12 text-lg font-medium"
                                />
                            </div>

                            <div>
                                <Label htmlFor="content" className="text-sm font-semibold">Konten Artikel *</Label>
                                <p className="text-xs text-slate-400 mb-1.5">Tulis konten artikel dengan format teks biasa. Gunakan Enter untuk paragraf baru.</p>
                                <Textarea
                                    id="content"
                                    placeholder="Mulai menulis artikel di sini...&#10;&#10;Tekan Enter untuk paragraf baru."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    required
                                    className="min-h-[400px] text-base leading-relaxed font-mono resize-y"
                                />
                            </div>
                        </div>

                        {/* Sidebar Settings */}
                        <div className="space-y-4">

                            {/* Publish Settings */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                                <h3 className="font-bold text-slate-800 text-sm">Publikasi</h3>

                                <div>
                                    <Label className="text-xs font-semibold text-slate-600">Status</Label>
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">📝 Draft (Tersembunyi)</SelectItem>
                                            <SelectItem value="published">🌐 Published (Publik)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="category" className="text-xs font-semibold text-slate-600">Kategori</Label>
                                    <Input
                                        id="category"
                                        placeholder="misal: Tutorial, Berita, Tips..."
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="mt-1.5 h-9 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Cover Image */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                                <h3 className="font-bold text-slate-800 text-sm">Cover Image</h3>
                                <p className="text-xs text-slate-400">Format JPG/PNG/WebP, maks 5MB. Rasio 16:9 direkomendasikan.</p>

                                {coverPreview ? (
                                    <div className="space-y-2">
                                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200">
                                            <img src={coverPreview} alt="cover preview" className="w-full h-full object-cover" />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-red-500 hover:text-red-600 text-xs"
                                            onClick={() => { setCoverFile(null); setCoverPreview(null) }}
                                        >
                                            Hapus Gambar
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-colors">
                                        <Image className="h-8 w-8 text-slate-400 mb-2" />
                                        <span className="text-xs text-slate-500 text-center">Klik untuk upload cover</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                                    </label>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="space-y-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-violet-600 hover:bg-violet-700 font-semibold"
                                >
                                    {loading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...</>
                                    ) : (
                                        <><Upload className="h-4 w-4 mr-2" /> {status === 'published' ? 'Publish Artikel' : 'Simpan Draft'}</>
                                    )}
                                </Button>
                                <Link href="/admin/blog">
                                    <Button type="button" variant="ghost" className="w-full text-slate-500">Batal</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}

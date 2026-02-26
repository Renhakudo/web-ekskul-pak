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
import { ArrowLeft, Image, Loader2, Save, Eye, EyeOff, CheckCircle } from 'lucide-react'

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
        if (file.size > 5 * 1024 * 1024) { setError('Ukuran gambar maks 5MB.'); return }
        setCoverFile(file)
        setCoverPreview(URL.createObjectURL(file))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!title.trim() || !content.trim()) { setError('Judul dan konten wajib diisi.'); return }

        setSaving(true)

        // Upload new cover jika ada
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
            setError('Gagal menyimpan: ' + updateError.message)
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
        setSaving(false)
    }

    if (loading) return (
        <div className="p-8 max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">

            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/blog">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Edit Artikel</h1>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">/{slug}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => setPreview(!preview)}>
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
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}
            {saved && (
                <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Artikel berhasil disimpan!
                </div>
            )}

            {preview ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-3xl font-black text-slate-900 mb-4">{title || 'Judul Artikel'}</h2>
                    {category && <Badge variant="outline" className="mb-4 text-violet-600 border-violet-200">{category}</Badge>}
                    {coverPreview && (
                        <div className="w-full aspect-video rounded-xl overflow-hidden mb-6">
                            <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {content}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <Label htmlFor="title" className="text-sm font-semibold">Judul Artikel *</Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1.5 h-12 text-lg font-medium" />
                            </div>
                            <div>
                                <Label htmlFor="content" className="text-sm font-semibold">Konten *</Label>
                                <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} required className="mt-1.5 min-h-[400px] text-base leading-relaxed font-mono resize-y" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                                <h3 className="font-bold text-slate-800 text-sm">Publikasi</h3>
                                <div>
                                    <Label className="text-xs font-semibold text-slate-600">Status</Label>
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">📝 Draft</SelectItem>
                                            <SelectItem value="published">🌐 Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="category" className="text-xs font-semibold text-slate-600">Kategori</Label>
                                    <Input id="category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1.5 h-9 text-sm" />
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                                <h3 className="font-bold text-slate-800 text-sm">Cover Image</h3>
                                {coverPreview ? (
                                    <div className="space-y-2">
                                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200">
                                            <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                                        </div>
                                        <label className="block">
                                            <Button type="button" variant="outline" size="sm" className="w-full text-xs" asChild>
                                                <span><Image className="h-3 w-3 mr-1" /> Ganti Gambar</span>
                                            </Button>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                                        </label>
                                        <Button type="button" variant="ghost" size="sm" className="w-full text-red-500 text-xs"
                                            onClick={() => { setCoverFile(null); setCoverPreview(null); setCoverUrl(null) }}>
                                            Hapus Cover
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

                            <Button type="submit" disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 font-semibold">
                                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menyimpan...</> : <><Save className="h-4 w-4 mr-2" />Simpan Perubahan</>}
                            </Button>
                            {status === 'published' && (
                                <Link href={`/blog/${slug}`} target="_blank">
                                    <Button type="button" variant="outline" className="w-full text-violet-600 border-violet-200 hover:bg-violet-50">
                                        <Eye className="h-4 w-4 mr-2" /> Lihat Halaman Live
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

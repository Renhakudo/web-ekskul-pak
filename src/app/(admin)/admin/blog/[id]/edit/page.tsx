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
import { ArrowLeft, Image, Loader2, Save, Eye, EyeOff, CheckCircle, FileSignature } from 'lucide-react'

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
        <div className="p-6 md:p-8 max-w-5xl mx-auto font-sans min-h-screen">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-pink-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[32px] p-6 md:p-8 relative overflow-hidden mb-8">
                <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                    <Link href="/admin/blog" className="shrink-0">
                        <Button size="icon" className="h-12 w-12 bg-white text-slate-900 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-200 rounded-2xl">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Bedah Artikel</h1>
                        <p className="text-sm font-bold text-slate-800 bg-white/60 inline-flex items-center px-2 py-0.5 mt-1 rounded border-2 border-slate-900 shadow-sm font-mono truncate max-w-[200px] sm:max-w-none">
                            /{slug}
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <Button type="button" className="h-10 border-4 border-slate-900 shadow-[2px_2px_0px_#0f172a] bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-black rounded-lg" onClick={() => setPreview(!preview)}>
                        {preview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {preview ? 'Mode Edit' : 'Pralihat'}
                    </Button>
                    <Badge className={`text-[10px] px-2 py-1 font-black uppercase tracking-widest border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${status === 'published'
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

            {saved && (
                <div className="mb-6 rounded-2xl bg-emerald-200 border-4 border-slate-900 p-4 text-slate-900 font-black flex items-center gap-3 shadow-[4px_4px_0px_#0f172a] animate-bounce">
                    <CheckCircle className="h-6 w-6 text-emerald-700" /> Teks baru telah diamankan di brankas!
                </div>
            )}

            {preview ? (
                <div className="bg-white rounded-[32px] border-4 border-slate-900 p-8 shadow-[8px_8px_0px_#0f172a]">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">{title || 'Judul Artikel'}</h2>
                    {category && <Badge className="mb-6 bg-violet-200 text-violet-800 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] font-black uppercase text-xs px-3 py-1">{category}</Badge>}
                    {coverPreview && (
                        <div className="w-full aspect-video rounded-3xl overflow-hidden mb-8 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                            <img src={coverPreview} alt="cover" className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all" />
                        </div>
                    )}
                    <div className="prose prose-slate max-w-none text-slate-800 font-medium whitespace-pre-wrap leading-relaxed text-lg">
                        {content}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                                <Label htmlFor="title" className="text-lg font-black text-slate-900 uppercase flex items-center gap-2 mb-3">
                                    <FileSignature className="h-5 w-5 text-pink-500" /> Revisi Judul
                                </Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="h-16 text-xl font-bold border-4 border-slate-900 rounded-2xl shadow-sm focus:shadow-[4px_4px_0px_#0f172a] transition-all" />
                            </div>

                            <div className="bg-white p-6 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                                <Label htmlFor="content" className="text-lg font-black text-slate-900 uppercase flex items-center gap-2 mb-3">
                                    Revisi Konten
                                </Label>
                                <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} required className="min-h-[400px] text-lg font-medium leading-relaxed resize-y border-4 border-slate-900 rounded-2xl shadow-inner focus:shadow-[4px_4px_0px_#0f172a] transition-all p-4" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-100 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 space-y-5">
                                <h3 className="font-black text-slate-900 text-xl uppercase border-b-4 border-slate-900 pb-2">Konfigurasi</h3>
                                <div className="space-y-2">
                                    <Label className="font-black text-slate-800">Status Penayangan</Label>
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger className="h-12 border-4 border-slate-900 font-bold bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent className="border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                                            <SelectItem value="draft" className="font-bold">📝 Draft</SelectItem>
                                            <SelectItem value="published" className="font-bold">🌐 Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="font-black text-slate-800">Label Kategori</Label>
                                    <Input id="category" value={category} onChange={e => setCategory(e.target.value)} className="h-12 border-4 border-slate-900 font-bold bg-white" />
                                </div>
                            </div>

                            <div className="bg-emerald-100 rounded-[32px] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 space-y-4">
                                <h3 className="font-black text-slate-900 text-xl uppercase border-b-4 border-slate-900 pb-2">Ubah Cover</h3>
                                {coverPreview ? (
                                    <div className="space-y-3">
                                        <div className="aspect-video w-full rounded-2xl overflow-hidden border-4 border-slate-900 shadow-sm relative group cursor-pointer">
                                            <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                <label className="cursor-pointer font-black text-white text-lg"><Image className="h-6 w-6 inline-block mb-1" /> Ganti</label>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                                            </div>
                                        </div>
                                        <Button type="button" className="w-full h-10 border-4 border-slate-900 bg-red-400 hover:bg-red-500 text-slate-900 font-black shadow-[2px_2px_0px_#0f172a]"
                                            onClick={() => { setCoverFile(null); setCoverPreview(null); setCoverUrl(null) }}>
                                            Cabut Cover
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-4 border-dashed border-slate-900 rounded-2xl bg-white p-6 cursor-pointer hover:-translate-y-1 hover:shadow-[4px_4px_0px_#0f172a] transition-all">
                                        <Image className="h-10 w-10 text-slate-400 mb-2" />
                                        <span className="font-bold text-slate-600">Pilih Foto</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                                    </label>
                                )}
                            </div>

                            <Button type="submit" disabled={saving} className="w-full h-14 bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:translate-y-1 transition-all rounded-2xl font-black text-lg">
                                {saving ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Mencetak...</> : <><Save className="h-6 w-6 mr-2" />Timpakan Perubahan</>}
                            </Button>

                            {status === 'published' && (
                                <Link href={`/blog/${slug}`} target="_blank" className="block mt-4">
                                    <Button type="button" className="w-full h-12 bg-white text-slate-900 font-black border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 transition-all rounded-xl">
                                        <Eye className="h-5 w-5 mr-2 text-violet-600" /> Pantau Tayangan Live
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

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Save, Settings } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })

export default function EditMaterialPage({ params }: { params: Promise<{ id: string, materialId: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const { id: classId, materialId } = use(params)

  const [title, setTitle] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [content, setContent] = useState('')
  const [xpReward, setXpReward] = useState(50)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDrafting, setIsDrafting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Track if initial load is done so autosave doesn't trigger on mount
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const fetchMaterial = async () => {
      const { data, error } = await supabase.from('materials').select('*').eq('id', materialId).single()
      if (error) {
        toast.error('Gagal memuat materi')
        router.push(`/guru/classes/${classId}`)
        return
      }
      if (data) {
        setTitle(data.title)
        setModuleName(data.module_name || '')
        setContent(data.type === 'video' ? `<div data-youtube-video><iframe src="${data.youtube_url}"></iframe></div>` : data.content || '')
        setXpReward(data.xp_reward)
        setIsLoaded(true)
      }
      setIsLoading(false)
    }
    fetchMaterial()
  }, [materialId])

  // Auto-save draft effect
  useEffect(() => {
    if (!isLoaded || !title || !content) return;
    
    const handler = setTimeout(() => {
      saveAsDraft(true)
    }, 5000) // autosave every 5s if changed

    return () => clearTimeout(handler)
  }, [title, content, moduleName, xpReward, isLoaded])

  const saveAsDraft = async (isAutoSave = false) => {
    if (!title) {
        if (!isAutoSave) toast.error('Judul materi harus diisi terlebih dahulu!')
        return
    }
    
    if (!isAutoSave) setIsDrafting(true)
    
    const payload = {
        title,
        module_name: moduleName || null,
        content,
        xp_reward: xpReward,
        type: 'text', // override to text
        youtube_url: null
    }

    const { error } = await supabase.from('materials').update(payload).eq('id', materialId)
    
    if (!error) setLastSaved(new Date())
    
    if (!isAutoSave) {
        if (!error) toast.success('Perubahan berhasil disimpan')
        else toast.error('Gagal menyimpan perubahan')
        setIsDrafting(false)
    }
  }

  const handlePublish = async () => {
    if (!title) return toast.error('Judul materi wajib diisi!')
    if (!content || content === '<p></p>') return toast.error('Konten materi tidak boleh kosong!')
    
    setIsSubmitting(true)
    const payload = {
        title,
        module_name: moduleName || null,
        content,
        xp_reward: xpReward,
        type: 'text',
        status: 'published',
        youtube_url: null
    }

    const { error } = await supabase.from('materials').update(payload).eq('id', materialId)
    if (!error) {
        toast.success('Materi Berhasil Diperbarui & Dipublikasikan! 🚀')
        router.push(`/guru/classes/${classId}`)
    } else {
        toast.error('Gagal mempublikasikan: ' + error.message)
    }
    setIsSubmitting(false)
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /></div>

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 bg-white border-b-4 border-slate-900 shadow-sm px-4 md:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push(`/guru/classes/${classId}`)} className="h-12 w-12 p-0 border-2 border-transparent hover:border-slate-900 hover:bg-slate-100 rounded-xl">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="font-black text-xl uppercase tracking-wider text-slate-900 hidden sm:block">Edit Materi</h1>
                {lastSaved && <p className="text-xs font-bold text-slate-400">Tersimpan: {lastSaved.toLocaleTimeString()}</p>}
            </div>
        </div>

        <div className="flex items-center gap-3">
            <Button 
                onClick={() => saveAsDraft(false)} 
                disabled={isDrafting || isSubmitting}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold border-2 border-slate-900 rounded-xl h-12 px-6 hidden sm:flex shadow-[2px_2px_0px_#0f172a]"
            >
                {isDrafting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Perubahan
            </Button>
            <Button 
                onClick={handlePublish} 
                disabled={isSubmitting}
                className="bg-violet-500 hover:bg-violet-400 text-slate-900 font-black border-2 border-slate-900 rounded-xl h-12 px-8 uppercase shadow-[4px_4px_0px_#0f172a] hover:shadow-[6px_6px_0px_#0f172a] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all"
            >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Perbarui & Publikasi'}
            </Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="max-w-7xl mx-auto mt-8 px-4 md:px-8 grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Settings */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[6px_6px_0px_#0f172a]">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 pb-4">
                    <Settings className="w-6 h-6 text-violet-500" />
                    <h2 className="font-black text-lg uppercase text-slate-900">Pengaturan</h2>
                </div>
                
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase text-slate-500">Judul Materi *</Label>
                        <Input 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="h-12 border-2 border-slate-300 focus:border-slate-900 focus:ring-0 rounded-xl font-bold bg-slate-50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase text-slate-500">Nama Modul/Bab</Label>
                        <Input 
                            value={moduleName} 
                            onChange={e => setModuleName(e.target.value)} 
                            className="h-12 border-2 border-slate-300 focus:border-slate-900 focus:ring-0 rounded-xl font-bold bg-slate-50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase text-slate-500">XP Reward</Label>
                        <Input 
                            type="number"
                            value={xpReward} 
                            onChange={e => setXpReward(Number(e.target.value))} 
                            className="h-12 border-2 border-slate-300 focus:border-slate-900 focus:ring-0 rounded-xl font-black text-lg text-emerald-600 bg-emerald-50"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Panel: Rich Text Editor */}
        <div className="lg:col-span-9">
            <RichTextEditor value={content} onChange={setContent} placeholder="Ketikkan materi spektakuler Anda di sini..." />
        </div>

      </div>
    </div>
  )
}

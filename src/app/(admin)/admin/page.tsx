'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea' // Kita butuh install ini nanti
import { Rocket, PlusCircle } from 'lucide-react'

export default function AdminPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  // State Form
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [content, setContent] = useState('')
  const [xp, setXp] = useState(50)

  const handleUpload = async () => {
    if (!title || !content) return alert("Judul dan Isi Materi wajib diisi!")
    
    setLoading(true)
    const { error } = await supabase
      .from('lessons')
      .insert({
        title,
        description: desc,
        content,
        xp_reward: xp
      })

    if (error) {
      alert('Gagal upload: ' + error.message)
    } else {
      alert('Materi berhasil dipublish! 🚀')
      // Reset form
      setTitle('')
      setDesc('')
      setContent('')
    }
    setLoading(false)
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-violet-100 rounded-lg">
           <Rocket className="h-8 w-8 text-violet-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Room</h1>
          <p className="text-slate-500">Upload materi baru untuk ekskul.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Input Materi Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Judul Materi</label>
            <Input 
              placeholder="Contoh: Belajar React Dasar Part 1" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi Singkat</label>
            <Input 
              placeholder="Muncul di kartu dashboard..." 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Isi Materi / Link Video</label>
            <Textarea 
              className="min-h-[150px]"
              placeholder="Tulis materi di sini atau tempel link YouTube/GDrive..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">XP Reward (Gamifikasi)</label>
            <Input 
              type="number" 
              value={xp}
              onChange={(e) => setXp(Number(e.target.value))}
            />
          </div>

          <Button 
            className="w-full bg-violet-600 hover:bg-violet-700" 
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? 'Sedang Upload...' : 'Publish Materi'}
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}
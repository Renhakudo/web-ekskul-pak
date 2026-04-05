import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        if (!file) {
            return NextResponse.json({ error: 'No file' }, { status: 400 })
        }

        const fileExt = file.name.split('.').pop()
        const filePath = `covers/${user.id}-${Date.now()}.${fileExt}`
        const buffer = Buffer.from(await file.arrayBuffer())

        const { error } = await supabase.storage
            .from('blog-images')
            .upload(filePath, buffer, { contentType: file.type, upsert: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath)
        return NextResponse.json({ url: data.publicUrl })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

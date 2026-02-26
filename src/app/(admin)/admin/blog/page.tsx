import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Pencil, Eye, BookOpen, CalendarDays, FileText } from 'lucide-react'
import { AdminBlogActions } from './AdminBlogActions'

export default async function AdminBlogPage() {
    const supabase = await createClient()

    const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, category, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })

    const publishedCount = posts?.filter(p => p.status === 'published').length || 0
    const draftCount = posts?.filter(p => p.status === 'draft').length || 0

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Blog & Berita</h1>
                    <p className="text-slate-500 mt-1">Kelola artikel dan publikasi ekskul.</p>
                </div>
                <Link href="/admin/blog/new">
                    <Button className="bg-violet-600 hover:bg-violet-700 font-semibold gap-2">
                        <Plus className="h-4 w-4" />
                        Tulis Artikel Baru
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-slate-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold">{posts?.length || 0}</div>
                            <div className="text-xs text-slate-500">Total Artikel</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Eye className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold">{publishedCount}</div>
                            <div className="text-xs text-slate-500">Published</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-yellow-100">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold">{draftCount}</div>
                            <div className="text-xs text-slate-500">Draft</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Article List */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-0">
                    {!posts || posts.length === 0 ? (
                        <div className="text-center py-16 space-y-3">
                            <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-700">Belum ada artikel</p>
                            <p className="text-sm text-slate-400">Klik tombol "Tulis Artikel Baru" untuk memulai.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {posts.map((post: any) => (
                                <div key={post.id} className="flex items-start sm:items-center justify-between p-5 hover:bg-slate-50 gap-4 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <Badge className={`text-xs font-semibold border-0 ${post.status === 'published'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {post.status === 'published' ? 'Published' : 'Draft'}
                                            </Badge>
                                            {post.category && (
                                                <Badge variant="outline" className="text-xs text-slate-500">
                                                    {post.category}
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                                            {post.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                            <CalendarDays className="h-3 w-3" />
                                            {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            <span>·</span>
                                            <span>oleh {(post.profiles as any)?.full_name || 'Admin'}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {post.status === 'published' && (
                                            <Link href={`/blog/${post.slug}`} target="_blank">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-violet-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        )}
                                        <Link href={`/admin/blog/${post.id}/edit`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <AdminBlogActions postId={post.id} postTitle={post.title} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Jika ada parameter "next", kita redirect ke sana, kalau tidak ke dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    
    // Buat client Supabase sementara untuk menukar kode
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // TUKAR KODE JADI SESSION (Login User)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Jika berhasil, redirect user masuk ke dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika gagal, kembalikan ke halaman login atau error page
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
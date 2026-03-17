import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    const supabase = await createClient()

    // 1. Fetch user data beserta relasinya
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username, role, points, avatar_url, streak')
      .eq('id', userId)
      .single()

    if (!profile) {
      return new ImageResponse(
        (
          <div
            style={{
              backgroundColor: '#f87171',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '16px solid #0f172a',
            }}
          >
            <div style={{ fontSize: 64, fontWeight: 900, color: '#0f172a', backgroundColor: 'white', padding: '20px 40px', border: '8px solid #0f172a' }}>
              SISWA TIDAK DITEMUKAN
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      )
    }

    // Ambil statistik tambahan
    const classesPromise = supabase
      .from('class_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const assignmentsPromise = supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      
    const badgesPromise = supabase
      .from('user_badges')
      .select('badges(icon, name)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(3)

    const [classesRes, assignRes, badgesRes] = await Promise.all([classesPromise, assignmentsPromise, badgesPromise])
    
    const joinedClasses = classesRes.count || 0
    const completedAssignments = assignRes.count || 0
    const recentBadges = (badgesRes.data || []).map((b: any) => b.badges)

    const { full_name, username, role, points, avatar_url, streak } = profile
    const level = Math.floor((points || 0) / 100) + 1

    // 2. Render Rapi Grid Layout ID Card
    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: '#c4b5fd', // violet-300
            backgroundImage: 'radial-gradient(circle at 40px 40px, rgba(15, 23, 42, 0.15) 2%, transparent 0%)',
            backgroundSize: '160px 160px',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Main Card Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              backgroundColor: 'white',
              width: '100%',
              height: '100%',
              borderRadius: '40px',
              border: '12px solid #0f172a',
              boxShadow: '20px 20px 0px #0f172a',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Top decorative bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24px', backgroundColor: '#34d399', borderBottom: '8px solid #0f172a' }} />

            {/* KIRI: Identitas Utama (Avatar, Nama, Username) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '45%',
                height: '100%',
                backgroundColor: '#f8fafc', // slate-50
                borderRight: '12px solid #0f172a',
                padding: '60px 40px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Badge Role */}
              <div
                style={{
                  backgroundColor: '#34d399',
                  border: '6px solid #0f172a',
                  boxShadow: '6px 6px 0px #0f172a',
                  padding: '8px 24px',
                  borderRadius: '20px',
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  marginBottom: '32px',
                }}
              >
                {role || 'Siswa'}
              </div>

              {/* Avatar Circle */}
              <div
                style={{
                  width: '240px',
                  height: '240px',
                  borderRadius: '120px',
                  backgroundColor: '#fde047',
                  border: '12px solid #0f172a',
                  boxShadow: '12px 12px 0px #0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '100px', fontWeight: 900, color: '#0f172a' }}>{full_name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>

              {/* Nama & Username */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '32px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.1, wordBreak: 'break-word', maxWidth: '400px' }}>
                  {full_name?.toUpperCase() || 'USER AGENT'}
                </h1>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#64748b', margin: '8px 0 0 0' }}>
                  @{username || 'username'}
                </p>
              </div>
            </div>

            {/* KANAN: Statistik & Pencapaian */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '55%',
                height: '100%',
                padding: '60px 50px',
                justifyContent: 'center',
                backgroundColor: 'white',
              }}
            >
              {/* Level & XP Row */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', width: '100%', marginBottom: '24px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#a855f7', border: '8px solid #0f172a', boxShadow: '8px 8px 0px #0f172a', borderRadius: '24px', padding: '20px 24px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>Level</span>
                  <span style={{ fontSize: '64px', fontWeight: 900, color: 'white', lineHeight: 1, marginTop: '4px' }}>{level}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fcd34d', border: '8px solid #0f172a', boxShadow: '8px 8px 0px #0f172a', borderRadius: '24px', padding: '20px 24px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>Total XP</span>
                  <span style={{ fontSize: '64px', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginTop: '4px' }}>{points || 0}</span>
                </div>
              </div>

              {/* Activity Stats Row (Streak, Tugas, Kelas) */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', width: '100%', marginBottom: '32px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fed7aa', border: '6px solid #0f172a', borderRadius: '20px', padding: '16px' }}>
                  <span style={{ fontSize: '32px' }}>🔥</span>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{streak || 0}</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>HARI STREAK</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fbcfe8', border: '6px solid #0f172a', borderRadius: '20px', padding: '16px' }}>
                  <span style={{ fontSize: '32px' }}>🎒</span>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{joinedClasses}</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>KELAS IKUT</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#bfdbfe', border: '6px solid #0f172a', borderRadius: '20px', padding: '16px' }}>
                  <span style={{ fontSize: '32px' }}>📝</span>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{completedAssignments}</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>TUGAS KELAR</span>
                </div>
              </div>

              {/* Badges Row */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                  BADGE TERBARU PRIBADI
                </span>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
                  {recentBadges.length > 0 ? (
                    recentBadges.map((badge: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', border: '6px solid #0f172a', boxShadow: '6px 6px 0px #0f172a', borderRadius: '16px', padding: '12px 20px' }}>
                        <span style={{ fontSize: '36px' }}>{badge.icon}</span>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', maxWidth: '100px', lineHeight: 1 }}>{badge.name}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', border: '6px dashed #cbd5e1', borderRadius: '16px', padding: '16px 24px', width: '100%' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: '#94a3b8' }}>Belum mengoleksi badge.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            {/* Watermark/Logo */}
            <div
              style={{
                position: 'absolute',
                bottom: '32px',
                right: '32px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '4px solid #0f172a',
                padding: '8px 16px',
                borderRadius: '12px',
                transform: 'rotate(-2deg)',
              }}
            >
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>
                🚀 EkskulPAK
              </span>
            </div>

          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        emoji: 'twemoji',
      }
    )

  } catch (error: any) {
    console.error('Error generating image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

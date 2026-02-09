import { Sidebar } from "@/components/Sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cek sesi user di server (extra security)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Sidebar Desktop (Hidden di HP) */}
      <div className="hidden md:block fixed inset-y-0 z-50">
         <Sidebar />
      </div>

      {/* Konten Utama */}
      <main className="md:pl-[250px] w-full">
        {children}
      </main>
    </div>
  )
}
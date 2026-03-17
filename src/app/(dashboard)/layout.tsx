import { TopNavDashboard } from "@/components/TopNavDashboard"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#FDFBF7] font-sans">
      <TopNavDashboard />
      <main className="flex-1 w-full mt-6">
        {children}
      </main>
    </div>
  )
}
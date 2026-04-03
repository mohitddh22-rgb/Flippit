import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, ShieldCheck, Banknote, History, ExternalLink, Zap } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userData?.is_admin) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white selection:bg-emerald-500 selection:text-black">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 p-6 space-y-8 sticky top-0 h-screen hidden md:block">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
            <ShieldCheck className="w-6 h-6 text-black fill-black" />
          </div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Admin</h1>
            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest leading-none">Super Control</p>
          </div>
        </div>

        <nav className="space-y-1">
          <AdminNavLink href="/admin" icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" />
          <AdminNavLink href="/admin/kyc" icon={<ShieldCheck className="w-4 h-4" />} label="KYC Review" />
          <AdminNavLink href="/admin/withdrawals" icon={<Banknote className="w-4 h-4" />} label="Withdrawals" />
          
          <div className="pt-8 pb-4 text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-3">System</div>
          <AdminNavLink href="/dashboard" icon={<ExternalLink className="w-4 h-4" />} label="User View" />
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              <span className="text-[10px] uppercase font-bold text-zinc-400">Total Revenue</span>
            </div>
            <div className="text-xl font-black tracking-tighter text-white uppercase italic">₹1,24,500</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function AdminNavLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group"
    >
      <span className="group-hover:text-emerald-500 transition-colors">{icon}</span>
      <span className="uppercase tracking-tight">{label}</span>
    </Link>
  )
}

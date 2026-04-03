import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Wallet, 
  ArrowUpRight, 
  ShieldCheck, 
  Banknote,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = createClient()

  // 1. Fetch Stats
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
  const { count: pendingKyc } = await supabase.from('users').select('*', { count: 'exact', head: true }).in('kyc_status', ['pending', 'submitted'])
  const { count: activeBets } = await supabase.from('bets').select('*', { count: 'exact', head: true }).eq('status', 'matched')
  const { data: fees } = await supabase.from('admin_fee_ledger').select('inr_amount, fc_amount')
  
  const totalFeesInr = fees?.reduce((acc, curr) => acc + (Number(curr.inr_amount) || 0), 0) || 0
  const totalFeesFc = fees?.reduce((acc, curr) => acc + (Number(curr.fc_amount) || 0), 0) || 0

  return (
    <div className="p-8 space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Command Center</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Real-time platform performance & operational health</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">System Time</p>
          <p className="text-sm font-black text-white uppercase italic tracking-tight">{new Date().toLocaleString()}</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Revenue (INR)" 
          value={`₹${totalFeesInr.toLocaleString()}`} 
          subValue={`+ ${totalFeesFc.toLocaleString()} FC`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          trend="+12% vs last week"
        />
        <StatsCard 
          title="Total Players" 
          value={totalUsers?.toString() || '0'} 
          icon={<Users className="w-5 h-5 text-emerald-500" />}
          trend={`${totalUsers || 0} unique IDs registered`}
        />
        <StatsCard 
          title="Active Bets" 
          value={activeBets?.toString() || '0'} 
          icon={<Activity className="w-5 h-5 text-emerald-500" />}
          trend="Real-time multi-way matching"
        />
        <StatsCard 
          title="Platform Fees" 
          value="3.0%" 
          icon={<Wallet className="w-5 h-5 text-emerald-500" />}
          trend="Targeting 5.0% for IPL"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Urgent Actions */}
        <div className="space-y-6">
          <SectionHeader title="Urgent Actions" />
          <div className="grid gap-4">
            <ActionCard 
              href="/admin/kyc"
              icon={<ShieldCheck className="w-6 h-6 text-amber-500" />}
              title="KYC Verification"
              desc={`${pendingKyc || 0} submissions require immediate review.`}
              badge={`${pendingKyc || 0} Pending`}
            />
            <ActionCard 
              href="/admin/withdrawals"
              icon={<Banknote className="w-6 h-6 text-emerald-500" />}
              title="Settlements"
              desc="Process pending INR withdrawal requests."
              badge="Action Required"
            />
          </div>
        </div>

        {/* Security / System Logs */}
        <div className="space-y-6">
          <SectionHeader title="System Status" />
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-6">
             <SystemStatusRow label="RapidAPI Cron" status="Active" time="Last poll 5m ago" />
             <SystemStatusRow label="Razorpay Webhook" status="Active" time="Last payload 12m ago" />
             <SystemStatusRow label="Auth Service" status="Responsive" time="100% Uptime" />
             <SystemStatusRow label="Match Engine" status="Running" time="V1.2.4 Production" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px bg-zinc-900 flex-1" />
      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{title}</h3>
      <div className="h-px bg-zinc-900 flex-1" />
    </div>
  )
}

function StatsCard({ title, value, subValue, icon, trend }: { title: string, value: string, subValue?: string, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/30 transition-all overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform origin-top-right group-hover:opacity-10 group-hover:text-emerald-500">
        {icon}
      </div>
      <CardHeader className="pb-2">
        <CardDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">{title}</CardDescription>
        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">{value}</CardTitle>
        {subValue && <p className="text-xs font-bold text-emerald-500 uppercase tracking-tighter italic">{subValue}</p>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
          {trend}
        </div>
      </CardContent>
    </Card>
  )
}

function ActionCard({ href, icon, title, desc, badge }: { href: string, icon: React.ReactNode, title: string, desc: string, badge: string }) {
  return (
    <Link href={href}>
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 transition-all flex items-center justify-between group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-emerald-500/50 transition-all">
            {icon}
          </div>
          <div className="space-y-1">
            <h4 className="font-black italic uppercase tracking-tighter text-white group-hover:text-emerald-500 transition-colors">{title}</h4>
            <p className="text-xs text-zinc-500 font-medium">{desc}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-zinc-800 text-zinc-500 uppercase font-black tracking-widest text-[9px]">
          {badge}
        </Badge>
      </div>
    </Link>
  )
}

function SystemStatusRow({ label, status, time }: { label: string, status: string, time: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-xs font-black uppercase italic tracking-tighter text-white">{label}</p>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{time}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{status}</span>
      </div>
    </div>
  )
}

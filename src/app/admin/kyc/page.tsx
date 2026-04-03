import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, XCircle, MoreVertical, FileText, User, UserCheck } from 'lucide-react'
import { updateKycStatus } from '../actions'

export default async function AdminKycPage() {
  const supabase = createClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .in('kyc_status', ['pending', 'submitted'])
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">KYC Verification</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Review player identities and source of funds</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest">
          <UserCheck className="w-3.5 h-3.5" />
          {users?.length || 0} Pending Review
        </div>
      </header>

      <div className="grid gap-6">
        {users?.map((user) => (
          <Card key={user.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden hover:border-emerald-500/30 transition-all group">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                {/* User Info */}
                <div className="p-6 md:w-1/3 flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center shrink-0 border border-zinc-700">
                    <User className="w-6 h-6 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black uppercase italic tracking-tighter text-white">{user.full_name}</p>
                    <p className="text-xs text-zinc-400 font-medium truncate">{user.email}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pt-2">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="p-6 md:w-1/3 space-y-4">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Documentation</p>
                  <div className="space-y-2">
                    <KycDocLink label="ID Proof (Aadhaar/PAN)" url={user.kyc_id_proof_url} />
                    <KycDocLink label="Income Proof" url={user.kyc_income_proof_url} />
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 md:w-1/3 bg-zinc-900/80 flex flex-col justify-between items-end gap-6">
                   <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase font-black tracking-widest text-[10px]">
                        {user.kyc_status}
                      </Badge>
                   </div>
                   
                   <div className="flex gap-3 w-full">
                      <form action={async () => {
                        'use server'
                        await updateKycStatus(user.id, 'rejected')
                      }} className="flex-1">
                        <Button variant="outline" className="w-full border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 text-red-500 uppercase font-black italic tracking-tighter shadow-none">
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </form>
                      <form action={async () => {
                        'use server'
                        await updateKycStatus(user.id, 'verified')
                      }} className="flex-1">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-black uppercase font-black italic tracking-tighter">
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </form>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!users || users.length === 0) && (
          <div className="py-32 text-center space-y-4 rounded-3xl border-2 border-dashed border-zinc-900">
            <UserCheck className="w-12 h-12 text-zinc-800 mx-auto" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Queue clean. No pending KYC submissions.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function KycDocLink({ label, url }: { label: string, url: string }) {
  return (
    <a 
      href={url} 
      target="_blank" 
      className={`flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-emerald-500/50 transition-colors group ${!url && 'opacity-50 pointer-events-none'}`}
    >
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-zinc-500" />
        <span className="text-[11px] font-bold uppercase tracking-tight text-zinc-400 group-hover:text-white">{label}</span>
      </div>
      <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-widest border-zinc-800 text-zinc-600 group-hover:border-emerald-500/50 group-hover:text-emerald-500 transition-colors">
        {url ? 'View File' : 'Missing'}
      </Badge>
    </a>
  )
}

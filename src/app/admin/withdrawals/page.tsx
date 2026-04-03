import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Banknote, User, CheckCircle2, XCircle, CreditCard, ArrowDownRight, Clock } from 'lucide-react'
import { updateWithdrawalStatus } from '../actions'

export default async function AdminWithdrawalsPage() {
  const supabase = createClient()

  // Fetch pending withdrawals with user details
  const { data: withdrawals, error } = await supabase
    .from('withdrawals')
    .select('*, users(full_name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Withdrawal Queue</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Review and fulfill INR cashout requests</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5" />
          {withdrawals?.length || 0} Pending
        </div>
      </header>

      <div className="grid gap-6">
        {withdrawals?.map((withdrawal) => (
          <Card key={withdrawal.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden hover:border-emerald-500/30 transition-all group">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                
                {/* User & Amount */}
                <div className="p-6 flex items-start gap-4 col-span-1">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                    <User className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black italic uppercase tracking-tighter text-white whitespace-nowrap">{withdrawal.users?.full_name}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xl font-black text-emerald-500 italic uppercase tracking-tighter leading-none">₹{withdrawal.amount_inr}</p>
                      <Badge variant="outline" className="text-[8px] uppercase font-bold tracking-widest border-zinc-800 text-zinc-500">
                        {withdrawal.fc_deducted} FC
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="p-6 col-span-2 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-3 h-3 text-zinc-500" />
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Bank Destination</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-none mb-1">Account Holder</p>
                      <p className="text-xs font-bold text-white uppercase tracking-tight">{withdrawal.bank_account_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-none mb-1">IFSC Code</p>
                      <p className="text-xs font-bold text-white uppercase tracking-tight">{withdrawal.bank_ifsc}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-none mb-1">Account Number</p>
                      <p className="text-xs font-black text-emerald-400 tracking-widest font-mono bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                        {withdrawal.bank_account_number}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-zinc-900/80 flex flex-col justify-center gap-4">
                   <form action={async () => {
                     'use server'
                     await updateWithdrawalStatus(withdrawal.id, 'completed')
                   }}>
                     <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-black uppercase font-black italic tracking-tighter">
                       <CheckCircle2 className="w-4 h-4 mr-2" />
                       Mark as Paid
                     </Button>
                   </form>
                   <form action={async () => {
                     'use server'
                     await updateWithdrawalStatus(withdrawal.id, 'rejected', 'Invalid bank details or suspicious activity')
                   }}>
                     <Button variant="outline" className="w-full border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 text-red-500 uppercase font-black italic tracking-tighter shadow-none">
                       <XCircle className="w-4 h-4 mr-2" />
                       Reject
                     </Button>
                   </form>
                </div>

              </div>
            </CardContent>
          </Card>
        ))}

        {(!withdrawals || withdrawals.length === 0) && (
          <div className="py-32 text-center space-y-4 rounded-3xl border-2 border-dashed border-zinc-900">
            <Banknote className="w-12 h-12 text-zinc-800 mx-auto" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No pending withdrawal requests. Everyone is paid!</p>
          </div>
        )}
      </div>
    </div>
  )
}

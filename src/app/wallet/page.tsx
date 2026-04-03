import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function WalletPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  // Fetch Wallet Data
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch Transaction History
  const { data: transactions } = await supabase
    .from('fc_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 p-4 pt-10">
      <div className="w-full max-w-4xl space-y-6">
        
        <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Your Wallet</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-emerald-950/30 border-emerald-900/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-400">Total FC Balance</CardDescription>
              <CardTitle className="text-4xl text-emerald-50">{wallet?.fc_balance || 0} <span className="text-xl text-emerald-500">FC</span></CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">Available for betting</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">Won FC</CardDescription>
              <CardTitle className="text-4xl text-white">{wallet?.fc_won || 0} <span className="text-xl text-zinc-500">FC</span></CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">Redeemable for coupons</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">Withdrawable INR</CardDescription>
              <CardTitle className="text-4xl text-white">₹{wallet?.inr_withdrawable || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">Unused deposited funds</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Link href="/wallet/deposit">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
              Add FC
            </Button>
          </Link>
          <Link href="/wallet/withdraw">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Withdraw INR
            </Button>
          </Link>
          <Link href="/redeem">
            <Button variant="secondary" className="bg-zinc-800 text-emerald-400 hover:bg-zinc-700">
              Redeem Coupons
            </Button>
          </Link>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-xl text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions?.length === 0 ? (
              <p className="text-zinc-500 text-sm">No transactions yet.</p>
            ) : (
              <div className="space-y-4">
                {transactions?.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <div>
                      <p className="text-zinc-200 font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-zinc-500">{format(new Date(tx.created_at), 'PP p')}</p>
                    </div>
                    <div className={`font-semibold ${tx.fc_amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.fc_amount > 0 ? '+' : ''}{tx.fc_amount} FC
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

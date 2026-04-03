import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { TrendingUp, CheckCircle2, XCircle, Clock, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

export default async function MyBetsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Not authenticated</div>

  const { data: bets } = await supabase
    .from('bets')
    .select('*, cricket_matches(match_name, team1, team2, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const openBets = bets?.filter(b => b.status === 'open') || []
  const matchedBets = bets?.filter(b => b.status === 'matched') || []
  const settledBets = bets?.filter(b => b.status.startsWith('settled') || b.status === 'refunded') || []

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">My Bets</h1>
            <Link href="/dashboard">
               <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 cursor-pointer hover:bg-emerald-500/20 transition-colors">
                  + New Bet
               </Badge>
            </Link>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-6">
            <TabsTrigger value="active" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Active ({openBets.length + matchedBets.length})</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">History ({settledBets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {[...matchedBets, ...openBets].length === 0 ? (
               <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                  <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">No active bets found.</p>
               </div>
            ) : (
               [...matchedBets, ...openBets].map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
               ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
             {settledBets.length === 0 ? (
               <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                  <RefreshCcw className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">No betting history yet.</p>
               </div>
            ) : (
               settledBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
               ))
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}

function BetCard({ bet }: { bet: any }) {
  const isWon = bet.status === 'settled_won'
  const isLost = bet.status === 'settled_lost'
  const isMatched = bet.status === 'matched'
  const isRefunded = bet.status === 'refunded'

  return (
    <Card className={`bg-zinc-900 border-zinc-800 overflow-hidden relative ${isWon ? 'border-l-4 border-l-emerald-500' : isLost ? 'border-l-4 border-l-red-500' : ''}`}>
       <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
             <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">
                   {format(new Date(bet.created_at), 'PPP p')}
                </p>
                <h3 className="text-lg font-bold text-white">{bet.cricket_matches?.match_name}</h3>
             </div>
             <Badge 
                className={`uppercase font-black italic tracking-tighter px-3 ${
                   isWon ? 'bg-emerald-500 text-black' : 
                   isLost ? 'bg-red-500 text-white' : 
                   isMatched ? 'bg-blue-500 text-white' : 
                   isRefunded ? 'bg-zinc-500 text-white' :
                   'bg-zinc-700 text-zinc-300'
                }`}
             >
                {bet.status.replace('_', ' ')}
             </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
             <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase">Your Side</p>
                <p className="text-xl font-black italic text-white uppercase">{bet.side}</p>
             </div>
             <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase">Wagered</p>
                <p className="text-xl font-black text-zinc-300">{bet.fc_amount} FC</p>
             </div>
             
             {isWon ? (
                <div className="space-y-1">
                   <p className="text-xs text-emerald-500 uppercase font-bold">Winnings</p>
                   <p className="text-2xl font-black text-emerald-400">+{bet.net_fc_won} FC</p>
                </div>
             ) : isLost ? (
                <div className="space-y-1">
                   <p className="text-xs text-red-500 uppercase font-bold">Lost</p>
                   <p className="text-2xl font-black text-red-400">-{bet.fc_amount} FC</p>
                </div>
             ) : (
                <div className="space-y-1">
                   <p className="text-xs text-zinc-500 uppercase">Potential Win</p>
                   <p className="text-xl font-bold text-emerald-500/50">{(bet.fc_amount * 2 * 0.97).toFixed(2)} FC</p>
                </div>
             )}

             <div className="flex justify-end col-span-2 md:col-span-1">
                <Link href={`/matches/${bet.match_id}`}>
                   <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white hover:bg-zinc-800 text-[10px] uppercase font-bold">
                      View Match
                   </Button>
                </Link>
             </div>
          </div>
       </CardContent>
    </Card>
  )
}

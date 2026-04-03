import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Trophy, Calendar, Zap } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()

  // 1. Lazy Sync: If user exists in Auth but not in public.users, create it.
  if (!userData) {
    const { data: newUser, error: syncError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || 'User',
      phone: user.user_metadata?.phone || '',
      kyc_status: 'pending'
    }).select().single()
    
    if (!syncError) {
      userData = newUser
    }
  }

  // Fetch real matches
  const { data: matches } = await supabase
    .from('cricket_matches')
    .select('*')
    .order('match_date', { ascending: true })
    .limit(10)

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 p-4 pt-10">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        <header className="flex justify-between items-end border-b border-zinc-800 pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {userData?.full_name || 'User'}</h1>
            <p className="text-zinc-400 mt-1 flex items-center gap-2">
               <Trophy className="w-4 h-4 text-emerald-500" />
               Ready to start flipping?
            </p>
          </div>
          <div className="flex gap-4">
            {userData?.is_admin && (
              <Link href="/admin">
                <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300 font-bold uppercase italic tracking-tighter">
                  Admin Dashboard
                </Button>
              </Link>
            )}
            <Link href="/wallet">
              <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300">
                My Wallet
              </Button>
            </Link>
          </div>
        </header>

        {userData?.kyc_status !== 'verified' && (
           <Card className="bg-amber-950/20 border-amber-900/50 border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-500 text-lg flex items-center gap-2">
                 <Zap className="w-4 h-4 fill-amber-500" />
                 KYC is {userData?.kyc_status || 'pending'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <p className="text-amber-200/70 text-sm max-w-lg leading-relaxed">
                Your KYC status must be verified before you can place any bets. 
                {userData?.kyc_status === 'pending' && " Please submit your documentation to continue."}
                {userData?.kyc_status === 'submitted' && " We are currently reviewing your documents."}
              </p>
              {userData?.kyc_status === 'pending' && (
                <Link href="/kyc">
                  <Button className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 whitespace-nowrap">Complete KYC Now</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2 mb-2">
           <Separator className="w-12 bg-emerald-500" />
           <h2 className="text-xl font-bold text-white uppercase tracking-tighter italic">Live & Upcoming Matches</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches?.length === 0 ? (
            <p className="text-zinc-500 col-span-full">No matches found. Try running the polling function.</p>
          ) : (
            matches?.map((match) => (
              <Card key={match.id} className="bg-zinc-900 border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                <CardHeader>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-bold mb-2 uppercase tracking-widest">
                    <span>{match.match_type || 'T20'}</span>
                    {match.status === 'live' ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        {new Date(match.match_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl text-white tracking-tight group-hover:text-emerald-400 transition-colors">{match.team1} vs {match.team2}</CardTitle>
                  <CardDescription className="text-zinc-400 text-xs mt-1 line-clamp-1">{match.venue}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/matches/${match.id}`}>
                    <Button disabled={match.status === 'completed'} className={`w-full font-bold shadow-lg ${match.status === 'live' ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                      {match.status === 'completed' ? 'Match Ended' : match.status === 'live' ? 'Watch & Bet' : 'Bet Now'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={`h-1 rounded-full ${className}`} />
}

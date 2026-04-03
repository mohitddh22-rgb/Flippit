import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trophy, Users, Clock, MapPin, TrendingUp } from 'lucide-react'
import BettingForm from './BettingForm'

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  // 1. Fetch Match
  const { data: match } = await supabase
    .from('cricket_matches')
    .select('*')
    .eq('id', id)
    .single()

  if (!match) return <div className="text-white p-10 text-center">Match not found</div>

  // 2. Fetch Brackets
  const { data: brackets } = await supabase
    .from('bet_brackets')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // 3. Fetch Open Bets Summary (From View)
  const { data: openSummary } = await supabase
    .from('open_bets_summary')
    .select('*')
    .eq('match_id', id)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Match Header */}
        <Card className="bg-zinc-900 border-zinc-800 border-b-4 border-b-emerald-500 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-emerald-950/40 to-zinc-900 p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left space-y-2">
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 mb-2 uppercase tracking-widest">{match.match_type}</Badge>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase">{match.team1} <span className="text-zinc-600 font-light mx-2">VS</span> {match.team2}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-zinc-400">
                   <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {match.venue}</div>
                   <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(match.match_date).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                <div className="text-center group">
                   <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center text-4xl font-bold text-white group-hover:border-emerald-500 transition-colors shadow-2xl">
                      {match.team1.charAt(0)}
                   </div>
                   <p className="mt-2 font-bold text-zinc-400 group-hover:text-white transition-colors">{match.team1}</p>
                </div>
                <div className="text-zinc-600 font-black text-2xl italic tracking-widest">VS</div>
                <div className="text-center group">
                   <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center text-4xl font-bold text-white group-hover:border-emerald-500 transition-colors shadow-2xl">
                      {match.team2.charAt(0)}
                   </div>
                   <p className="mt-2 font-bold text-zinc-400 group-hover:text-white transition-colors">{match.team2}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Betting Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
               <TrendingUp className="text-emerald-500" />
               Current Market Activity
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {brackets?.map((bracket) => {
                  const summary = openSummary?.find(s => s.bracket_id === bracket.id)
                  return (
                    <Card key={bracket.id} className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                       <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-lg font-bold group-hover:text-emerald-400 transition-colors">{bracket.label} FC</CardTitle>
                          <Badge variant="outline" className="text-zinc-500 border-zinc-800 group-hover:text-zinc-300 transition-colors">{summary?.total_open_bets || 0} Open</Badge>
                       </CardHeader>
                       <CardContent className="p-4 pt-2">
                          <div className="flex justify-between items-end gap-2 text-xs mb-3">
                             <div className="space-y-1">
                                <p className="text-zinc-500">Heads (T1)</p>
                                <p className="text-lg font-bold text-blue-400">{summary?.heads_count || 0}</p>
                             </div>
                             <div className="h-8 w-px bg-zinc-800" />
                             <div className="space-y-1 text-right">
                                <p className="text-zinc-500">Tails (T2)</p>
                                <p className="text-lg font-bold text-orange-400">{summary?.tails_count || 0}</p>
                             </div>
                          </div>
                          
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                             <div 
                                className="h-full bg-blue-500" 
                                style={{ width: summary?.total_open_bets ? `${(summary.heads_count / summary.total_open_bets) * 100}%` : '50%' }} 
                             />
                             <div 
                                className="h-full bg-orange-500" 
                                style={{ width: summary?.total_open_bets ? `${(summary.tails_count / summary.total_open_bets) * 100}%` : '50%' }} 
                             />
                          </div>
                       </CardContent>
                    </Card>
                  )
               })}
            </div>
          </div>

          {/* Place Bet Side Panel */}
          <div className="lg:col-span-1">
             <BettingForm 
                match={match} 
                brackets={brackets || []} 
             />
          </div>

        </div>

      </div>
    </div>
  )
}

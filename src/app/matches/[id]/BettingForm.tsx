'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { placeBet } from '../actions'
import { Trophy, Coins, Zap } from 'lucide-react'

export default function BettingForm({ match, brackets }: { match: any, brackets: any[] }) {
  const [bracketId, setBracketId] = useState('')
  const [fcAmount, setFcAmount] = useState<number>(0)
  const [side, setSide] = useState<'heads' | 'tails' | ''>('')
  const [loading, setLoading] = useState(false)

  const selectedBracket = brackets.find(b => b.id === bracketId)
  const potentialWin = fcAmount ? (fcAmount * 2 * 0.97).toFixed(2) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bracketId || !fcAmount || !side) {
      toast.error("Please fill in all betting details")
      return
    }

    if (fcAmount < selectedBracket.min_fc || fcAmount > selectedBracket.max_fc) {
      toast.error(`Amount must be between ${selectedBracket.min_fc} and ${selectedBracket.max_fc}`)
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('matchId', match.id)
    formData.append('bracketId', bracketId)
    formData.append('fcAmount', fcAmount.toString())
    formData.append('side', side)

    try {
      const result = await placeBet(formData)
      if (result.error) throw new Error(result.error)
      toast.success("Bet placed successfully! Good luck!")
      setFcAmount(0)
      setSide('')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-xl sticky top-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
           <Zap className="text-emerald-500 fill-emerald-500" />
           Place Your Bet
        </CardTitle>
        <CardDescription className="text-zinc-500">Pick a side. Double or nothing.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <Label className="text-zinc-400">Select Bracket</Label>
            <Select onValueChange={setBracketId} value={bracketId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Choose a bracket" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                {brackets.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.label} FC</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Exact FC Amount</Label>
            <div className="relative">
               <Coins className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
               <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={fcAmount || ''} 
                  onChange={(e) => setFcAmount(parseFloat(e.target.value))}
                  className="bg-zinc-800 border-zinc-700 pl-10 text-white font-bold"
               />
            </div>
            {selectedBracket && (
               <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                  Range: {selectedBracket.min_fc} - {selectedBracket.max_fc} FC
               </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-zinc-400">Select Side</Label>
            <RadioGroup onValueChange={(val) => setSide(val as any)} value={side} className="grid grid-cols-2 gap-4">
              <Label 
                htmlFor="heads" 
                className={`flex flex-col items-center justify-center border-2 rounded-xl p-4 cursor-pointer transition-all ${side === 'heads' ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-800/50 grayscale opacity-60'}`}
              >
                <RadioGroupItem value="heads" id="heads" className="sr-only" />
                <span className="text-2xl font-black text-white italic">HEADS</span>
                <span className="text-[10px] uppercase text-zinc-500">{match.team1} Win</span>
              </Label>
              
              <Label 
                htmlFor="tails" 
                className={`flex flex-col items-center justify-center border-2 rounded-xl p-4 cursor-pointer transition-all ${side === 'tails' ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-800/50 grayscale opacity-60'}`}
              >
                <RadioGroupItem value="tails" id="tails" className="sr-only" />
                <span className="text-2xl font-black text-white italic">TAILS</span>
                <span className="text-[10px] uppercase text-zinc-500">{match.team2} Win</span>
              </Label>
            </RadioGroup>
          </div>

          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-900 border-dashed space-y-2">
             <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-wider">
                <span>Est. Net Winning</span>
                <span className="text-emerald-500 font-bold">{potentialWin} FC</span>
             </div>
             <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-wider">
                <span>Platform Fee</span>
                <span>3.0%</span>
             </div>
          </div>

          <Button 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 text-lg shadow-lg shadow-emerald-500/20 uppercase italic tracking-widest group"
          >
            {loading ? "Placing..." : (
               <>
                 Place Bet
                 <Trophy className="ml-2 w-5 h-5 group-hover:scale-125 transition-transform" />
               </>
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trophy, Zap, ShieldCheck, Coins, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
          <Zap className="w-8 h-8 text-black fill-black" />
        </div>
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">Flippit</h1>
      </div>
      
      <div className="space-y-4 max-w-2xl">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-tight">
          Flip the <span className="text-emerald-500">Odds</span>. Master the Game.
        </h2>
        <p className="text-zinc-400 text-lg font-medium">
          The ultimate cricket coin-flip betting platform. Instant, secure, and purely skill-based.
        </p>
      </div>

      <div className="flex gap-4">
        <Link href="/auth/register">
          <Button size="lg" className="h-16 px-10 bg-emerald-600 hover:bg-emerald-500 text-black text-xl font-black italic uppercase tracking-tighter">
            Join Flippit
          </Button>
        </Link>
        <Link href="/auth/login">
          <Button variant="outline" size="lg" className="h-16 px-10 border-zinc-800 bg-zinc-900/50 text-white text-xl font-black italic uppercase tracking-tighter">
            Login
          </Button>
        </Link>
      </div>
      
      <div className="pt-12 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
        IPL 2026 Season • Powered by Supabase & Razorpay
      </div>
    </div>
  )
}

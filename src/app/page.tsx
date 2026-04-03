import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trophy, Zap, ShieldCheck, Coins, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500 selection:text-black">
      {/* Hero Section */}
      <header className="relative overflow-hidden pt-16 pb-32 md:pt-32 md:pb-48">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#10b98133,transparent_70%)]" />
        
        <nav className="absolute top-0 w-full p-6 flex justify-between items-center max-w-7xl mx-auto left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic uppercase">Flippit</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-zinc-400 hover:text-white uppercase font-bold tracking-widest text-xs">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 uppercase font-black italic tracking-tighter">Join Now</Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live: IPL 2026 Series
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9]">
              Flip the <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600">Odds</span><br />
              Master the Game
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              The world's first high-fidelity cricket coin-flip platform. 
              Pair up, predict the side, and win big with 0% hidden fees and instant settlements.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/auth/register">
                <Button size="lg" className="h-16 px-10 bg-emerald-600 hover:bg-emerald-500 text-black text-xl font-black italic uppercase tracking-tighter group transition-all">
                  Get 100 FC Free
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="h-16 px-10 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-white text-xl font-black italic uppercase tracking-tighter">
                  View Markets
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-24 border-y border-zinc-900 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: 'Active Flips', val: '12K+' },
            { label: 'Total Payouts', val: '₹4.2Cr' },
            { label: 'Platform Fee', val: '3%' },
            { label: 'Settlement', val: 'Instant' },
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <p className="text-4xl font-black text-white italic tracking-tighter">{stat.val}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-emerald-500" />}
              title="Verified Security"
              desc="Bank-grade encryption and Supabase-powered security ensures your FC wallet is always protected."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-emerald-500" />}
              title="Instant Polling"
              desc="Real-time data feeds from RapidAPI ensure you never miss a match or a winning moment."
            />
            <FeatureCard 
              icon={<Coins className="w-8 h-8 text-emerald-500" />}
              title="Easy Cashouts"
              desc="Seamlessly deposit via Razorpay and enjoy automated INR withdrawals directly to your bank."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 text-zinc-500 text-center">
        <p className="text-xs uppercase tracking-widest font-bold">&copy; 2026 Flippit Dynamics. Play Responsibly.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 transition-colors group">
      <div className="mb-6 group-hover:scale-110 transition-transform origin-left">{icon}</div>
      <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mb-3">{title}</h3>
      <p className="text-zinc-400 leading-relaxed text-sm">{desc}</p>
    </div>
  )
}

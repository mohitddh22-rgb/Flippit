'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Info, CreditCard, ChevronRight } from 'lucide-react'

export default function DepositPage() {
  const [amount, setAmount] = useState<number>(500)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const premiumFee = amount * 0.01
  const netFC = amount - premiumFee

  const handleDeposit = async () => {
    if (amount < 100) {
      toast.error('Minimum deposit is ₹100')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to create order')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use Razorpay Key ID
        amount: data.amount,
        currency: data.currency,
        name: 'Flippit',
        description: `Deposit for ${netFC} FC`,
        order_id: data.order_id,
        handler: function (response: any) {
          toast.success('Payment initiated. We will credit your FC once confirmed.')
          router.push('/wallet')
          // Note: Actual credit happens via Razorpay Webhook → Supabase Edge Function
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#10b981', // emerald-500
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 overflow-hidden">
          <div className="h-1 bg-emerald-500 w-full" />
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="text-emerald-500" />
              Add FC via Razorpay
            </CardTitle>
            <CardDescription className="text-zinc-400">
              1 INR = 1 FC (minus 1% platform fee)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-zinc-300">Amount (INR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500">₹</span>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="bg-zinc-800 border-zinc-700 pl-7 text-white font-semibold text-lg"
                  min="100"
                />
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Deposit Amount</span>
                <span className="text-zinc-100">₹{amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Platform Fee (1%)</span>
                <span className="text-zinc-100">-₹{premiumFee.toFixed(2)}</span>
              </div>
              <div className="h-px bg-zinc-700 my-1" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-zinc-300">Net FC to Credit</span>
                <span className="text-emerald-500">{netFC.toFixed(2)} FC</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-zinc-500 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
              <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>Your FC will be credited instantly once the payment is captured. In some cases, it may take up to 30 minutes.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleDeposit}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-lg shadow-lg shadow-emerald-500/20 group"
            >
              {loading ? 'Processing...' : (
                <>
                  Pay ₹{amount}
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}

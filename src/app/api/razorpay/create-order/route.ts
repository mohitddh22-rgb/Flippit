import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/utils/supabase/server'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await req.json()

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum deposit is ₹100' }, { status: 400 })
    }

    const amountInPaise = amount * 100
    const premiumFee = amount * 0.01 // 1% fee
    const fcToCredit = amount - premiumFee

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `flippit_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        fc_amount: fcToCredit.toString(),
      },
    }

    const order = await razorpay.orders.create(options)

    // Insert pending deposit record
    const { error: dbError } = await supabase.from('inr_deposits').insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount_inr: amount,
      premium_fee: premiumFee,
      fc_credited: fcToCredit,
      status: 'pending',
    })

    if (dbError) {
      console.error('DB Error:', dbError)
      return NextResponse.json({ error: 'Failed to record deposit' }, { status: 500 })
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error: any) {
    console.error('Razorpay Order Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

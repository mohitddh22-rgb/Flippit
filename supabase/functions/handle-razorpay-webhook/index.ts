import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const signature = req.headers.get('x-razorpay-signature')
    const body = await req.text()

    // 1. Verify Webhook Signature (If secret is set)
    if (RAZORPAY_WEBHOOK_SECRET) {
      const hmac = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(RAZORPAY_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      )
      
      const verified = await crypto.subtle.verify(
        'HMAC',
        hmac,
        new Uint8Array(
          signature?.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        ),
        new TextEncoder().encode(body)
      )

      if (!verified) {
        console.error('Invalid signature')
        return new Response('Invalid Signature', { status: 401 })
      }
    }

    const event = JSON.parse(body)
    
    // Only process payment.captured
    if (event.event !== 'payment.captured') {
      return new Response('Event Ignored', { status: 200 })
    }

    const payload = event.payload.payment.entity
    const razorpay_order_id = payload.order_id
    const razorpay_payment_id = payload.id
    const amount_inr = payload.amount / 100

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 2. Find matching pending deposit
    const { data: deposit, error: depositError } = await supabase
      .from('inr_deposits')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('status', 'pending')
      .single()

    if (depositError || !deposit) {
      console.error('Deposit record not found or already processed', depositError)
      return new Response('Deposit Logic Error', { status: 400 })
    }

    const user_id = deposit.user_id
    const fc_to_credit = deposit.fc_credited
    const premium_fee = deposit.premium_fee

    // 3. Update Tables in a Transaction (or Sequential steps since Edge Functions)
    // Update Deposit Status
    await supabase.from('inr_deposits').update({
      status: 'completed',
      razorpay_payment_id: razorpay_payment_id
    }).eq('id', deposit.id)

    // Fetch Wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single()

    const balance_before = wallet?.fc_balance || 0
    const balance_after = Number(balance_before) + Number(fc_to_credit)

    // Update Wallet
    const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
      p_user_id: user_id,
      p_fc_inc: fc_to_credit,
      p_fc_bought_inc: fc_to_credit,
      p_inr_dep_inc: amount_inr,
      p_inr_withdrawable_inc: fc_to_credit
    })
    
    // Note: I will create this RPC next for atomicity.

    // Record Transaction
    await supabase.from('fc_transactions').insert({
      user_id: user_id,
      type: 'fc_purchase',
      fc_amount: fc_to_credit,
      inr_amount: amount_inr,
      balance_before: balance_before,
      balance_after: balance_after,
      reference_id: deposit.id,
      description: `Purchased FC via Razorpay (${razorpay_payment_id})`
    })

    // Record Admin Fee
    await supabase.from('admin_fee_ledger').insert({
      fee_type: 'fc_purchase_premium',
      user_id: user_id,
      inr_amount: premium_fee,
      fc_amount: premium_fee
    })

    // Notify User
    await supabase.from('notifications').insert({
      user_id: user_id,
      title: 'FC Credited!',
      message: `${fc_to_credit} FC added to your wallet successfully.`,
      type: 'deposit_success'
    })

    return new Response('Success', { status: 200 })

  } catch (error: any) {
    console.error('Webhook Error:', error)
    return new Response(error.message, { status: 500 })
  }
})

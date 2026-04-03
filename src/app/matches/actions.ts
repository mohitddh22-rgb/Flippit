'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function placeBet(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const matchId = formData.get('matchId') as string
  const bracketId = formData.get('bracketId') as string
  const fcAmount = parseFloat(formData.get('fcAmount') as string)
  const side = formData.get('side') as string

  // 1. Validate User Wallet
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single()
  if (!wallet || wallet.fc_balance < fcAmount) {
     return { error: "Insufficient FC Balance" }
  }

  // 2. Insert Bet
  const { data: bet, error: betError } = await supabase.from('bets').insert({
    user_id: user.id,
    match_id: matchId,
    bracket_id: bracketId,
    fc_amount: fcAmount,
    side: side,
    status: 'open'
  }).select().single()

  if (betError) {
    return { error: betError.message }
  }

  // 3. Deduct from wallet (Atomically)
  // Logic: fc_bought first, then fc_won
  let deductBought = Math.min(wallet.fc_bought, fcAmount)
  let deductWon = Math.max(0, fcAmount - deductBought)

  await supabase.from('wallets').update({
     fc_balance: wallet.fc_balance - fcAmount,
     fc_bought: wallet.fc_bought - deductBought,
     fc_won: wallet.fc_won - deductWon,
     inr_withdrawable: wallet.inr_withdrawable - deductBought
  }).eq('user_id', user.id)

  // 4. Record Transaction
  await supabase.from('fc_transactions').insert({
    user_id: user.id,
    type: 'bet_placed',
    fc_amount: -fcAmount,
    reference_id: bet.id,
    description: `Bet placed on ${side}`
  })

  // 5. Trigger Match Engine (Optional here, can rely on cron)
  // fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/match-bets`, { method: 'POST' })

  revalidatePath(`/matches/${matchId}`)
  revalidatePath('/wallet')
  
  return { success: true }
}

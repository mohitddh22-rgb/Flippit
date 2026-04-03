import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { match_id } = await req.json()

  try {
    // 1. Fetch match result
    const { data: match } = await supabase
      .from('cricket_matches')
      .select('*')
      .eq('id', match_id)
      .single()

    if (!match || match.status !== 'completed') {
      return new Response(JSON.stringify({ error: "Match not completed" }), { status: 400 })
    }

    // Determine coin flip outcome
    // Team1 Win = Heads Win
    // Team2 Win = Tails Win
    // Else = Refund
    let winningSide = ''
    if (match.winner === match.team1) winningSide = 'heads'
    else if (match.winner === match.team2) winningSide = 'tails'

    // 2. Fetch all matched bets for this match
    const { data: bets } = await supabase
      .from('bets')
      .select('*')
      .eq('match_id', match_id)
      .eq('status', 'matched')

    for (const bet of bets) {
       if (!winningSide) {
          // It's a draw/abandoned → Refund
          await supabase.from('bets').update({ status: 'refunded', settled_at: new Date().toISOString() }).eq('id', bet.id)
          await supabase.rpc('increment_wallet_balance', {
            p_user_id: bet.user_id,
            p_fc_inc: bet.fc_amount,
            p_fc_bought_inc: 0,
            p_inr_dep_inc: 0,
            p_inr_withdrawable_inc: 0
          })
          continue
       }

       if (bet.side === winningSide) {
          // Winner
          const grossWinning = bet.fc_amount * 2
          const fee = grossWinning * 0.03 // 3% fee
          const netWinning = grossWinning - fee

          await supabase.from('bets').update({
             status: 'settled_won',
             winning_fc: grossWinning,
             fee_charged: fee,
             net_fc_won: netWinning,
             settled_at: new Date().toISOString()
          }).eq('id', bet.id)

          // Credit Wallet Won FC
          await supabase.rpc('increment_wallet_balance_won', {
             p_user_id: bet.user_id,
             p_fc_inc: netWinning,
             p_fc_won_inc: netWinning
          })
          // Note: Note: increment_wallet_balance_won is another RPC for won FC

          // Record Fee in Ledger
          await supabase.from('admin_fee_ledger').insert({
             fee_type: 'winning_fee',
             user_id: bet.user_id,
             bet_id: bet.id,
             fc_amount: fee
          })

          // Record Transaction
          await supabase.from('fc_transactions').insert({
             user_id: bet.user_id,
             type: 'bet_won',
             fc_amount: netWinning,
             reference_id: bet.id,
             description: 'You won the bet!'
          })

          // Notification
          await supabase.from('notifications').insert({
             user_id: bet.user_id,
             title: "You WON!",
             message: `You won ${netWinning} FC from match ${match.match_name}!`,
             type: 'bet_won'
          })

       } else {
          // Loser
          await supabase.from('bets').update({
             status: 'settled_lost',
             settled_at: new Date().toISOString()
          }).eq('id', bet.id)

          // Record Transaction
          await supabase.from('fc_transactions').insert({
             user_id: bet.user_id,
             type: 'bet_lost',
             fc_amount: -bet.fc_amount,
             reference_id: bet.id,
             description: 'Better luck next time'
          })

          // Notification
          await supabase.from('notifications').insert({
             user_id: bet.user_id,
             title: "Better luck next time",
             message: `You lost ${bet.fc_amount} FC on match ${match.match_name}`,
             type: 'bet_lost'
          })
       }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

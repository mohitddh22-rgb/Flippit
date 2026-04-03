import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  try {
    // 1. Fetch all Open Bets
    const { data: openBets, error: openError } = await supabase
      .from('bets')
      .select('id, user_id, match_id, bracket_id, fc_amount, side')
      .eq('status', 'open')

    if (openError) throw openError

    let matchCount = 0
    const processedIds = new Set()

    for (const bet1 of openBets) {
      if (processedIds.has(bet1.id)) continue

      for (const bet2 of openBets) {
        if (bet2.id === bet1.id || processedIds.has(bet2.id)) continue

        // Same Match + Same Bracket + Opposite Side + Matching Amount (5% tolerance)
        const amountDiff = Math.abs(bet1.fc_amount - bet2.fc_amount)
        const tolerance = bet1.fc_amount * 0.05

        if (
          bet1.match_id === bet2.match_id &&
          bet1.bracket_id === bet2.bracket_id &&
          bet1.side !== bet2.side &&
          amountDiff <= tolerance
        ) {
          // Found a pair!
          processedIds.add(bet1.id)
          processedIds.add(bet2.id)
          matchCount++

          // Update DB
          const matched_at = new Date().toISOString()
          await supabase.from('bets').update({
            status: 'matched',
            matched_bet_id: bet2.id,
            matched_at: matched_at
          }).eq('id', bet1.id)

          await supabase.from('bets').update({
            status: 'matched',
            matched_bet_id: bet1.id,
            matched_at: matched_at
          }).eq('id', bet2.id)

          // Notifications
          await supabase.from('notifications').insert([
            {
              user_id: bet1.user_id,
              title: "Bet Matched!",
              message: `Your bet has been matched for ${bet1.fc_amount} FC!`,
              type: 'bet_matched'
            },
            {
              user_id: bet2.user_id,
              title: "Bet Matched!",
              message: `Your bet has been matched for ${bet2.fc_amount} FC!`,
              type: 'bet_matched'
            }
          ])
          
          break // move to next bet1
        }
      }
    }

    return new Response(JSON.stringify({ matchCount }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

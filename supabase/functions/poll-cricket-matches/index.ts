import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') || ''
const RAPIDAPI_HOST = Deno.env.get('RAPIDAPI_HOST') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // 1. Fetch Schedule
    const scheduleRes = await fetch(`https://${RAPIDAPI_HOST}/cricket-schedule`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    })
    const scheduleData = await scheduleRes.json()

    if (scheduleData.status === 'success') {
      const matches = []
      // The API returns nested structure: response[0].data[i].scheduleAdWrapper.matchScheduleList
      const days = scheduleData.response[0]?.data || []
      
      for (const day of days) {
        const matchGroups = day.scheduleAdWrapper?.matchScheduleList || []
        for (const group of matchGroups) {
          const matchInfos = group.matchInfo || []
          for (const match of matchInfos) {
            const startDate = new Date(parseInt(match.startDate))
            const now = new Date()
            const diffHours = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)

            matches.push({
              external_match_id: match.matchId.toString(),
              match_name: `${match.team1.teamName} vs ${match.team2.teamName}`,
              team1: match.team1.teamName,
              team2: match.team2.teamName,
              match_type: match.matchFormat,
              venue: `${match.venueInfo.ground}, ${match.venueInfo.city}`,
              match_date: startDate.toISOString(),
              status: 'upcoming',
              is_betting_open: diffHours > 0 && diffHours <= 24, // Open 24 hours before for prototype
              betting_closes_at: new Date(startDate.getTime() - 10 * 60000).toISOString() // 10 mins before
            })
          }
        }
      }

      // Upsert Matches
      for (const match of matches) {
        await supabase.from('cricket_matches').upsert(match, {
          onConflict: 'external_match_id'
        })
      }
    }

    // 2. Fetch Live Scores to update status and winner
    const liveRes = await fetch(`https://${RAPIDAPI_HOST}/cricket-livescores`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    })
    const liveData = await liveRes.json()

    if (liveData.status === 'success' && liveData.response) {
       // Logic to map live results could be complex, for now we update based on matchId if found
       const liveMatches = liveData.response || []
       for (const live of liveMatches) {
          // If status is 'Complete', trigger settlement
          if (live.status === 'Complete' || live.result) {
             const winner = live.winner || live.result?.split(' won')[0]
             
             const { data: dbMatch } = await supabase
               .from('cricket_matches')
               .select('id, status')
               .eq('external_match_id', live.matchId.toString())
               .single()

             if (dbMatch && dbMatch.status !== 'completed') {
                await supabase.from('cricket_matches').update({
                  status: 'completed',
                  result: live.result,
                  winner: winner,
                  score_team1: live.team1Score,
                  score_team2: live.team2Score
                }).eq('id', dbMatch.id)

                // Trigger settlement edge function
                await fetch(`${SUPABASE_URL}/functions/v1/settle-bets`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ match_id: dbMatch.id })
                })
             }
          } else if (live.status === 'Live') {
             await supabase.from('cricket_matches').update({
                status: 'live',
                score_team1: live.team1Score,
                score_team2: live.team2Score
             }).eq('external_match_id', live.matchId.toString())
          }
       }
    }

    return new Response(JSON.stringify({ message: "Polling complete" }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

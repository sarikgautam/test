import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mhzsusgknwmsqrcxbuvo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oenN1c2drbndtc3FyY3hidXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNzcwNDAsImV4cCI6MTg2MDkyNzA0MH0.VHfB6s81k-j6dCXnW-9swJUe5m_T6r6WCF0I_1EsLDw'

const supabase = createClient(supabaseUrl, supabaseKey)

// Get recent player stats
const { data: stats, error } = await supabase
  .from('player_stats')
  .select('id, player_id, match_id, runs_scored, balls_faced, wickets, overs_bowled, created_at')
  .order('created_at', { ascending: false })
  .limit(15)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Recent player stats:')
  console.table(stats)
  
  // Group by match_id
  const byMatch = {}
  stats.forEach(s => {
    if (!byMatch[s.match_id]) byMatch[s.match_id] = []
    byMatch[s.match_id].push(s)
  })
  
  console.log('\nGrouped by match_id:')
  Object.entries(byMatch).forEach(([matchId, stats]) => {
    console.log(`Match ${matchId}: ${stats.length} stats`)
  })
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkMatches() {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id, match_number, status, venue, home_team_id, away_team_id')
      .in('status', ['upcoming', 'live']);
    
    if (error) throw error;
    console.log('Matches found:', data?.length || 0);
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMatches();

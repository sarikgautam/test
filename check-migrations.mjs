import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rrrdnuttyfcphxeixfbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJycmRudXR0eWZjcGh4ZWl4ZmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODAxNTcsImV4cCI6MjA4MjA1NjE1N30.GRys1SqWaHZqn7MND9WllZFwSk0yUtruRQ00LJiUkqQ';

const client = createClient(supabaseUrl, supabaseKey);

async function checkMigrations() {
  try {
    console.log('Checking for migration tracking table...');
    const { data, error } = await client
      .from('_supabase_migrations')
      .select('name')
      .order('name', { ascending: false });
    
    if (error) {
      console.log('Migration table query failed (expected):', error.message);
    } else {
      console.log('Recent migrations:');
      data.slice(0, 10).forEach(m => console.log('  -', m.name));
    }
  } catch (e) {
    console.error('Exception:', e.message);
  }
}

checkMigrations();

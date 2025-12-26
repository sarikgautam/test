import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rrrdnuttyfcphxeixfbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJycmRudXR0eWZjcGh4ZWl4ZmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODAxNTcsImV4cCI6MjA4MjA1NjE1N30.GRys1SqWaHZqn7MND9WllZFwSk0yUtruRQ00LJiUkqQ';

const client = createClient(supabaseUrl, supabaseKey);

async function debug() {
  try {
    console.log('1. Testing direct table query...');
    const { data, error: err1 } = await client
      .from('registration_submissions')
      .select('*')
      .limit(1);
    
    if (err1) {
      console.log('❌ Query failed:', err1.message);
      console.log('Error code:', err1.code);
    } else {
      console.log('✅ Query succeeded');
    }

    console.log('\n2. Checking all public tables...');
    const { data: tables, error: err2 } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (err2) {
      console.log('❌ Could not list tables:', err2.message);
    } else {
      console.log('Public tables:');
      tables.forEach(t => console.log('  -', t.table_name));
      const exists = tables.some(t => t.table_name === 'registration_submissions');
      console.log('\nregistration_submissions exists?', exists ? '✅ YES' : '❌ NO');
    }

  } catch (e) {
    console.error('Exception:', e.message);
  }
}

debug();

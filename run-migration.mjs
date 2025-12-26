import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://rrrdnuttyfcphxeixfbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJycmRudXR0eWZjcGh4ZWl4ZmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODAxNTcsImV4cCI6MjA4MjA1NjE1N30.GRys1SqWaHZqn7MND9WllZFwSk0yUtruRQ00LJiUkqQ';

// You need a service role key to execute SQL, not the anon key
// For now, we'll use the REST API approach - creating a function to run it

const client = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251225090000_create_registration_submissions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Migration SQL loaded. Note: You need to run this in Supabase SQL Editor.');
    console.log('\nTo apply this migration:');
    console.log('1. Go to: https://supabase.com/dashboard/project/rrrdnuttyfcphxeixfbe/sql/new');
    console.log('2. Paste the following SQL:');
    console.log('---');
    console.log(sql);
    console.log('---');
    console.log('3. Click "Run"');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runMigration();

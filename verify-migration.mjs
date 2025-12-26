import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rrrdnuttyfcphxeixfbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJycmRudXR0eWZjcGh4ZWl4ZmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODAxNTcsImV4cCI6MjA4MjA1NjE1N30.GRys1SqWaHZqn7MND9WllZFwSk0yUtruRQ00LJiUkqQ';

const client = createClient(supabaseUrl, supabaseKey);

async function verifyTable() {
  try {
    console.log('Checking if registration_submissions table exists...');
    
    // Try to query the table
    const { data, error, count } = await client
      .from('registration_submissions')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error:', error.message);
      return false;
    }
    
    console.log('✅ Table exists! Current record count:', count);
    
    // Check table schema
    const { data: columns, error: schemaError } = await client
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'registration_submissions')
      .eq('table_schema', 'public');
    
    if (!schemaError && columns) {
      console.log('\n📋 Table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

verifyTable().then(success => {
  if (success) {
    console.log('\n✨ Registration submissions table is ready to use!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Please ensure the migration SQL was executed in Supabase SQL Editor');
    process.exit(1);
  }
});

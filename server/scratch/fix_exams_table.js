const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fixExamsTable() {
  const sql = `
    -- Drop and recreate exams table with correct columns
    DROP TABLE IF EXISTS exams CASCADE;
    CREATE TABLE exams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject TEXT NOT NULL,
      class TEXT NOT NULL,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      duration TEXT,
      venue TEXT,
      academic_year TEXT,
      term TEXT,
      status TEXT DEFAULT 'Scheduled',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Enable all for authenticated users" ON exams FOR ALL USING (true);
  `;

  console.log('Fixing exams table...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error fixing table:', error);
    console.log('\nMANUAL ACTION REQUIRED: Run the following SQL in Supabase SQL Editor:\n');
    console.log(sql);
  } else {
    console.log('Exams table fixed successfully!');
  }
}

fixExamsTable();

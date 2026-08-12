const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createMissingTables() {
  console.log('Attempting to create missing tables...');
  
  const sql = `
    -- EXPENSES TABLE
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      vendor TEXT,
      status TEXT DEFAULT 'Paid' CHECK (status IN ('Paid', 'Pending', 'Cancelled')),
      recorded_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- INCOME TABLE
    CREATE TABLE IF NOT EXISTS income (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      source TEXT,
      status TEXT DEFAULT 'Received' CHECK (status IN ('Received', 'Pending', 'Cancelled')),
      recorded_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Enable all for authenticated" ON expenses FOR ALL USING (true);
    
    ALTER TABLE income ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Enable all for authenticated" ON income FOR ALL USING (true);
  `;

  try {
    // Try exec_sql RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error('RPC exec_sql failed. You may need to run this SQL manually in the Supabase SQL Editor:');
      console.log(sql);
    } else {
      console.log('Tables created successfully!');
    }
  } catch (err) {
    console.error('Error executing migration:', err);
  }
}

createMissingTables();

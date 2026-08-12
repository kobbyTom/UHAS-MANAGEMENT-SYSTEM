const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function migrateGradeConstraint() {
  console.log('Migrating grade check constraint...');
  
  const sql = `
    ALTER TABLE students DROP CONSTRAINT IF EXISTS students_grade_check;
    ALTER TABLE students ADD CONSTRAINT students_grade_check CHECK (grade IN ('KG 1','KG 2','KG 3','Basic 1','Basic 2','Basic 3','Basic 4','Basic 5','Basic 6','Basic 7','Basic 8','Basic 9','SSS 1','SSS 2','SSS 3','JHS 1','JHS 2','JHS 3'));
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error('RPC exec_sql failed:', error);
    } else {
      console.log('Grade constraint migrated successfully!');
    }
  } catch (err) {
    console.error('Error executing migration:', err);
  }
}

migrateGradeConstraint();

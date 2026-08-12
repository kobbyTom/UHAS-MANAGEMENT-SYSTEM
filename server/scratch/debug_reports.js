const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkData() {
  const { data: students, error } = await supabase
    .from('students')
    .select('grade, section')
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Sample Students:', JSON.stringify(students, null, 2));
  
  const { data: grades, error2 } = await supabase
    .from('academic_classes')
    .select('name')
    .limit(10);
    
  console.log('Sample Classes:', JSON.stringify(grades, null, 2));
}

checkData();

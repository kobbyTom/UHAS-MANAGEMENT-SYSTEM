const supabase = require('../config/supabase');

async function checkData() {
  const { data: students } = await supabase.from('students').select('id, user_id, first_name').limit(5);
  console.log('Students:', students);

  const { data: payments } = await supabase.from('payments').select('student_id').limit(5);
  console.log('Payments student_id:', payments);
}

checkData();

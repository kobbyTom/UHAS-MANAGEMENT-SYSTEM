const supabase = require('../config/supabase');

async function checkSpecificId() {
  const id = '47596fff-679b-4de9-b910-ac505fdeb06a';
  
  const { data: byId } = await supabase.from('students').select('id, user_id, first_name').eq('id', id).single();
  console.log('Found by id:', byId);

  const { data: byUserId } = await supabase.from('students').select('id, user_id, first_name').eq('user_id', id).single();
  console.log('Found by user_id:', byUserId);
}

checkSpecificId();

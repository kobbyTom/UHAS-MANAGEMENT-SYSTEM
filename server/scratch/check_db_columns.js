const supabase = require('../config/supabase');

async function checkSchema() {
  console.log('Checking payments table...');
  const { data: pData, error: pError } = await supabase.from('payments').select('*').limit(1);
  if (pError) console.error('Payments error:', pError);
  else console.log('Payments columns:', Object.keys(pData[0] || {}));

  console.log('\nChecking fees table...');
  const { data: fData, error: fError } = await supabase.from('fees').select('*').limit(1);
  if (fError) console.error('Fees error:', fError);
  else console.log('Fees columns:', Object.keys(fData[0] || {}));

  console.log('\nChecking expenses table...');
  const { data: eData, error: eError } = await supabase.from('expenses').select('*').limit(1);
  if (eError) console.error('Expenses error:', eError);
  else console.log('Expenses columns:', Object.keys(eData[0] || {}));
}

checkSchema();

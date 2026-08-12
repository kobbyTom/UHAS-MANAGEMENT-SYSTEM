const supabase = require('../config/supabase');

async function checkSchema() {
  const tables = ['fees', 'payments', 'students'];
  for (const table of tables) {
    console.log(`\n--- Schema for ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error fetching ${table}:`, error);
    } else if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('No data found to infer columns.');
      // Try to get one even if empty to see if it errors
      const { error: emptyError } = await supabase.from(table).select('*').limit(0);
      if (emptyError) console.error(`Error querying empty ${table}:`, emptyError);
      else console.log(`${table} exists but is empty.`);
    }
  }
}

checkSchema();

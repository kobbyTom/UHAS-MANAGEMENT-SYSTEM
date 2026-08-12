const supabase = require('../config/supabase');

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables'); // If a custom RPC exists
  // Alternatively, just try to select from information_schema
  const { data: tables, error: tError } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
  
  if (tError) {
    // If direct access to information_schema is restricted, try selecting from common tables
    console.log('Trying common tables...');
    const common = ['students', 'teachers', 'parents', 'users', 'fees', 'payments', 'expenses', 'income', 'courses', 'grades'];
    for (const t of common) {
      const { error: e } = await supabase.from(t).select('id').limit(1);
      console.log(`${t}: ${e ? 'MISSING (' + e.message + ')' : 'EXISTS'}`);
    }
  } else {
    console.log('Tables:', tables.map(t => t.table_name));
  }
}

listTables();

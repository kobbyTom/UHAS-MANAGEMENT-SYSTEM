const { COLLECTIONS } = require('./services/supabaseService');
const supabase = require('./config/supabase');

async function test() {
  const sbQuery = supabase.from(COLLECTIONS.ACTIVITY_LOGS).select('*').order('created_at', { ascending: false }).limit(100);
  const { data, error } = await sbQuery;
  console.log("Data:", data ? data.length : null);
  console.log("Error:", error);
}

test();

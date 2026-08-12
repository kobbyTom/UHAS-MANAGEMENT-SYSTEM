require('dotenv').config();
const { supabaseService, COLLECTIONS } = require('./services/supabaseService');

async function test() {
  try {
    console.log("Testing academic_calendar collection...");
    const data = await supabaseService.getAll(COLLECTIONS.ACADEMIC_CALENDAR, {
      orderBy: 'created_at',
      orderDirection: 'asc'
    });
    console.log("Success:", data);
  } catch (err) {
    console.error("Caught error:", err);
  }
}

test();

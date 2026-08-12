require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedFinance = async () => {
  try {
    console.log('Seeding Expenses and Income...');

    const expenses = [
      { description: 'Electricity Bill', category: 'Utilities', amount: 2500, date: '2024-04-05', vendor: 'ECG', status: 'Paid' },
      { description: 'Internet Services', category: 'Utilities', amount: 800, date: '2024-04-08', vendor: 'MTN Business', status: 'Paid' },
      { description: 'Cleaning Supplies', category: 'Maintenance', amount: 450, date: '2024-04-10', vendor: 'CleanCo', status: 'Paid' },
      { description: 'Staff Salaries', category: 'Salaries', amount: 25000, date: '2024-04-12', vendor: 'Staff', status: 'Paid' },
      { description: 'Laboratory Equipment', category: 'Equipment', amount: 5000, date: '2024-04-14', vendor: 'SciTech Ltd', status: 'Pending' },
    ];

    const income = [
      { description: 'Registration Fees', category: 'Fees', amount: 5000, date: '2024-04-10', source: 'New Students', status: 'Received' },
      { description: 'Transport Fees', category: 'Transport', amount: 8000, date: '2024-04-12', source: 'Parents', status: 'Received' },
      { description: 'Book Sales', category: 'Sales', amount: 2500, date: '2024-04-08', source: 'Bookshop', status: 'Received' },
      { description: 'Event Tickets', category: 'Events', amount: 1200, date: '2024-04-05', source: 'Sports Day', status: 'Received' },
    ];

    const { error: expError } = await supabase.from('expenses').upsert(expenses);
    if (expError) throw expError;
    console.log('Upserted expenses');

    const { error: incError } = await supabase.from('income').upsert(income);
    if (incError) throw incError;
    console.log('Upserted income');

    console.log('Finance seeding completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  }
};

seedFinance();

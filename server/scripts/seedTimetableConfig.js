const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
require('dotenv').config();

const DEFAULT_PERIODS = [
  { period: 0, startTime: '07:30', endTime: '08:10', time: '07:30 - 08:10', name: 'Morning Assembly', isBreak: true },
  { period: 1, startTime: '08:10', endTime: '08:55', time: '08:10 - 08:55', name: 'Period 1' },
  { period: 2, startTime: '08:55', endTime: '09:40', time: '08:55 - 09:40', name: 'Period 2' },
  { period: 3, startTime: '09:40', endTime: '10:10', time: '09:40 - 10:10', name: 'Break', isBreak: true },
  { period: 4, startTime: '10:10', endTime: '10:55', time: '10:10 - 10:55', name: 'Period 3' },
  { period: 5, startTime: '10:55', endTime: '11:40', time: '10:55 - 11:40', name: 'Period 4' },
  { period: 6, startTime: '11:40', endTime: '12:10', time: '11:40 - 12:10', name: 'Break', isBreak: true },
  { period: 7, startTime: '12:10', endTime: '12:55', time: '12:10 - 12:55', name: 'Period 5' },
  { period: 8, startTime: '12:55', endTime: '13:40', time: '12:55 - 13:40', name: 'Period 6' },
  { period: 9, startTime: '13:40', endTime: '14:25', time: '13:40 - 14:25', name: 'Period 7' },
  { period: 10, startTime: '14:25', endTime: '15:00', time: '14:25 - 15:00', name: 'Dismissal', isBreak: true },
];

async function seedDefaultConfig() {
  console.log('Checking for existing timetable configuration...');
  
  try {
    // Check if configuration already exists
    const timetables = await supabaseService.getAll(COLLECTIONS.TIMETABLE);
    const config = timetables.find(t => t.grade === 'SYSTEM' && t.section === 'CONFIG');
    
    if (config) {
      console.log('Configuration already exists. Skipping seed.');
      return;
    }
    
    console.log('No configuration found. Seeding default institutional schema...');
    
    const settings = await supabaseService.getAll('settings');
    const currentSession = settings?.[0]?.current_session || '2024/2025';
    const currentTerm = settings?.[0]?.current_term || '1st';

    for (const period of DEFAULT_PERIODS) {
      await supabaseService.create(COLLECTIONS.TIMETABLE, {
        academic_year: currentSession,
        term: currentTerm,
        grade: 'SYSTEM',
        section: 'CONFIG',
        day: 'monday', // Fallback for schema
        period: period.period,
        start_time: period.startTime,
        end_time: period.endTime,
        is_break: period.isBreak,
        break_label: period.isBreak ? period.name : null,
      });
    }
    
    console.log('Successfully seeded default timetable configuration.');
  } catch (error) {
    console.error('Error seeding timetable configuration:', error);
  }
}

seedDefaultConfig();

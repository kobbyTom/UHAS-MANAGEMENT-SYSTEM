-- Add vacation_date and resumption_date to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS vacation_date TEXT,
ADD COLUMN IF NOT EXISTS resumption_date TEXT;

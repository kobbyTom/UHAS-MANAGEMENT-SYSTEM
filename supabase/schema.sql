-- ============================================================
-- School Management System - Supabase Schema (Improved)
-- UHAS-Basic School | Grades: KG1, KG2, Basic 1-6, JHS 1-3
-- ============================================================

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'student', 'finance', 'ITSupport', 'admission', 'staff')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  profile_image TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON users;
CREATE POLICY "Enable all for authenticated" ON users FOR ALL USING (true);

-- ==================== STUDENTS TABLE ====================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admission_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  nationality TEXT DEFAULT 'Ghanaian',
  religion TEXT,
  -- Grade level: KG1, KG2, Basic 1-6, JHS 1-3
  grade TEXT NOT NULL CHECK (grade IN ('KG 1','KG 2','KG 3','Basic 1','Basic 2','Basic 3','Basic 4','Basic 5','Basic 6','Basic 7','Basic 8','Basic 9','SSS 1','SSS 2','SSS 3','JHS 1','JHS 2','JHS 3')),
  section TEXT DEFAULT 'A',
  academic_year TEXT NOT NULL,
  date_of_admission DATE DEFAULT CURRENT_DATE,
  previous_school TEXT,                -- Transfer students
  house TEXT,                          -- School house (for inter-house competitions)
  -- address: {street, city, region, country}
  address JSONB DEFAULT '{}',
  -- emergencyContact: {name, relationship, phone, email}
  emergency_contact JSONB DEFAULT '{}',
  -- medicalInfo: {bloodType, allergies, conditions, medications, doctorName, doctorPhone}
  medical_info JSONB DEFAULT '{}',
  parent_ids UUID[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'suspended', 'transferred')),
  profile_image TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON students;
CREATE POLICY "Enable all for authenticated" ON students FOR ALL USING (true);

-- ==================== TEACHERS TABLE ====================
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  nationality TEXT DEFAULT 'Ghanaian',
  -- qualifications: [{degree, institution, year, field}]
  qualifications JSONB DEFAULT '[]',
  subject TEXT,                        -- Primary subject
  subjects TEXT[],                     -- All subjects taught
  grades TEXT[],                       -- Grade levels handled
  class_teacher_of TEXT,               -- If class teacher, which class (e.g. "JHS 1A")
  date_of_employment DATE DEFAULT CURRENT_DATE,
  contract_type TEXT DEFAULT 'permanent' CHECK (contract_type IN ('permanent', 'contract', 'part_time', 'intern')),
  -- address: {street, city, region, country}
  address JSONB DEFAULT '{}',
  -- emergencyContact: {name, relationship, phone, email}
  emergency_contact JSONB DEFAULT '{}',
  salary NUMERIC DEFAULT 0,
  -- bankAccount: {bankName, accountNumber, accountName, branch}
  bank_account JSONB DEFAULT '{}',
  social_security TEXT,
  -- schedule: [{day, periods:[{period, course, grade, section}]}]
  schedule JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  profile_image TEXT,
  position TEXT DEFAULT 'Teacher',
  specialization TEXT,
  experience INTEGER DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON teachers;
CREATE POLICY "Enable all for authenticated" ON teachers FOR ALL USING (true);

-- ==================== STAFF TABLE ====================
-- Non-teaching staff: admin, finance, ITSupport
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  nationality TEXT DEFAULT 'Ghanaian',
  department TEXT,
  position TEXT,
  date_of_employment DATE DEFAULT CURRENT_DATE,
  contract_type TEXT DEFAULT 'permanent' CHECK (contract_type IN ('permanent', 'contract', 'part_time')),
  salary NUMERIC DEFAULT 0,
  -- bankAccount: {bankName, accountNumber, accountName}
  bank_account JSONB DEFAULT '{}',
  -- address: {street, city, region, country}
  address JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON staff;
CREATE POLICY "Enable all for authenticated" ON staff FOR ALL USING (true);

-- ==================== PARENTS TABLE ====================
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  relationship TEXT CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
  occupation TEXT,
  company TEXT,
  -- address: {street, city, region, country}
  address JSONB DEFAULT '{}',
  phone TEXT NOT NULL,
  alternative_phone TEXT,
  email TEXT,
  student_ids UUID[],
  -- notifications: [{type, title, message, isRead, createdAt}]
  notifications JSONB DEFAULT '[]',
  preferred_language TEXT DEFAULT 'en',
  receive_sms BOOLEAN DEFAULT true,
  receive_email BOOLEAN DEFAULT true,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON parents;
CREATE POLICY "Enable all for authenticated" ON parents FOR ALL USING (true);

-- ==================== ACADEMIC CLASSES TABLE ====================
CREATE TABLE IF NOT EXISTS academic_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON academic_classes;
CREATE POLICY "Enable all for authenticated" ON academic_classes FOR ALL USING (true);

-- ==================== SECTIONS TABLE ====================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES academic_classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_master_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  academic_year TEXT NOT NULL DEFAULT '2024/2025',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON sections;
CREATE POLICY "Enable all for authenticated" ON sections FOR ALL USING (true);

-- ==================== SUBJECTS TABLE ====================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Core',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON subjects;
CREATE POLICY "Enable all for authenticated" ON subjects FOR ALL USING (true);

-- ==================== CLASS SUBJECTS (CURRICULUM) TABLE ====================
CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES academic_classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  section TEXT NOT NULL DEFAULT 'A',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (class_id, subject_id, section)
);

ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON class_subjects;
CREATE POLICY "Enable all for authenticated" ON class_subjects FOR ALL USING (true);

-- ==================== GRADES TABLE ====================
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES class_subjects(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('1st', '2nd', '3rd', '4th')),
  -- assessments: [{name, type, maxScore, score, weight, date, gradedBy, comments}]
  assessments JSONB DEFAULT '[]',
  total_score NUMERIC DEFAULT 0,
  letter_grade TEXT CHECK (letter_grade IN ('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','N/A')),
  grade_point NUMERIC CHECK (grade_point >= 0 AND grade_point <= 4.0),
  class_position INTEGER,              -- Student's position in class for this subject
  teacher_remarks TEXT,                -- Subject teacher's remarks
  is_finalized BOOLEAN DEFAULT false,
  finalized_by UUID REFERENCES teachers(id),
  finalized_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (student_id, course_id, academic_year, term)
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON grades;
CREATE POLICY "Enable all for authenticated" ON grades FOR ALL USING (true);

-- ==================== ATTENDANCE TABLE ====================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES class_subjects(id) ON DELETE SET NULL,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('1st', '2nd', '3rd', '4th')),
  date DATE NOT NULL,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  arrival_time TEXT,
  departure_time TEXT,
  marked_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  notes TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (student_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON attendance;
CREATE POLICY "Enable all for authenticated" ON attendance FOR ALL USING (true);

-- ==================== ASSIGNMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES class_subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('1st', '2nd', '3rd', '4th')),
  grade TEXT NOT NULL,
  assignment_type TEXT DEFAULT 'homework' CHECK (assignment_type IN ('homework','classwork','quiz','test','project','assignment')),
  max_score INTEGER DEFAULT 100,
  weight INTEGER DEFAULT 1,
  release_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  instructions TEXT,
  -- attachments: [{name, url, type}]
  attachments JSONB DEFAULT '[]',
  -- submissions: [{student, submittedAt, score, feedback, gradedBy, gradedAt, status, submissionText, attachments}]
  submissions JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  allow_late_submission BOOLEAN DEFAULT false,
  late_penalty NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON assignments;
CREATE POLICY "Enable all for authenticated" ON assignments FOR ALL USING (true);

-- ==================== FEES TABLE ====================
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('1st', '2nd', '3rd', '4th', 'all')),
  grade TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'GHS',
  due_date DATE NOT NULL,
  late_fee NUMERIC DEFAULT 0,
  late_fee_after DATE,
  is_optional BOOLEAN DEFAULT false,
  -- components: [{name, amount, description}]
  components JSONB DEFAULT '[]',
  payment_methods TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON fees;
CREATE POLICY "Enable all for authenticated" ON fees FOR ALL USING (true);

-- ==================== PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  fee_id UUID REFERENCES fees(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'card', 'online')),
  transaction_id TEXT UNIQUE,
  reference_number TEXT UNIQUE,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  receipt_number TEXT UNIQUE,
  receipt_generated BOOLEAN DEFAULT false,
  receipt_generated_at TIMESTAMP WITH TIME ZONE,
  -- paymentDetails: {mobileMoneyNumber, mobileMoneyProvider, bankName, accountNumber, cardLast4}
  payment_details JSONB DEFAULT '{}',
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON payments;
CREATE POLICY "Enable all for authenticated" ON payments FOR ALL USING (true);

-- ==================== EXPENSES TABLE ====================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT,
  status TEXT DEFAULT 'Paid' CHECK (status IN ('Paid', 'Pending', 'Cancelled')),
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON expenses;
CREATE POLICY "Enable all for authenticated" ON expenses FOR ALL USING (true);

-- ==================== INCOME TABLE ====================
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  status TEXT DEFAULT 'Received' CHECK (status IN ('Received', 'Pending', 'Cancelled')),
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON income;
CREATE POLICY "Enable all for authenticated" ON income FOR ALL USING (true);

-- ==================== REPORT CARDS TABLE ====================
-- End-of-term consolidated student performance summary
CREATE TABLE IF NOT EXISTS report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('1st', '2nd', '3rd', '4th')),
  grade TEXT NOT NULL,
  section TEXT,
  -- subjectResults: [{course, totalScore, letterGrade, gradePoint, classPosition, teacherRemarks}]
  subject_results JSONB DEFAULT '[]',
  total_marks NUMERIC DEFAULT 0,
  average_score NUMERIC DEFAULT 0,
  overall_grade TEXT,
  class_position INTEGER,              -- Overall position in class
  class_size INTEGER,                  -- Total number of students in class
  attendance_days INTEGER DEFAULT 0,   -- Days present
  total_school_days INTEGER DEFAULT 0,
  -- conduct: {behaviour, attentiveness, punctuality, neatness, remarks}
  conduct JSONB DEFAULT '{}',
  class_teacher_remarks TEXT,
  head_teacher_remarks TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (student_id, academic_year, term)
);

ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON report_cards;
CREATE POLICY "Enable all for authenticated" ON report_cards FOR ALL USING (true);

-- ==================== TIMETABLE TABLE ====================
-- Weekly class schedule per grade/section
CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('1st', '2nd', '3rd', '4th')),
  grade TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  day TEXT NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  period INTEGER NOT NULL CHECK (period BETWEEN 1 AND 10),
  start_time TEXT NOT NULL,            -- e.g. "07:30"
  end_time TEXT NOT NULL,              -- e.g. "08:20"
  course_id UUID REFERENCES class_subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  room TEXT,
  is_break BOOLEAN DEFAULT false,      -- True for break/lunch periods
  break_label TEXT,                    -- e.g. "Morning Break", "Lunch"
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (academic_year, term, grade, section, day, period)
);

ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON timetable;
CREATE POLICY "Enable all for authenticated" ON timetable FOR ALL USING (true);

-- ==================== ANNOUNCEMENTS TABLE ====================
-- School-wide or role-targeted announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  -- target audience: 'all', 'teachers', 'parents', 'students', 'staff', or specific grade
  audience TEXT[] DEFAULT ARRAY['all'],
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  -- attachments: [{name, url, type}]
  attachments JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON announcements;
CREATE POLICY "Enable all for authenticated" ON announcements FOR ALL USING (true);

-- ==================== EVENTS TABLE ====================
-- School calendar: sports day, graduation, PTA meetings, exams, etc.
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'general' CHECK (event_type IN ('academic', 'sports', 'cultural', 'meeting', 'exam', 'holiday', 'graduation', 'general')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  -- targetAudience: who should see/attend this event
  audience TEXT[] DEFAULT ARRAY['all'],
  is_school_holiday BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#3b82f6',        -- Calendar display color
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON events;
CREATE POLICY "Enable all for authenticated" ON events FOR ALL USING (true);


-- ==================== DISCIPLINARY RECORDS TABLE ====================
-- Student behaviour tracking and disciplinary actions
CREATE TABLE IF NOT EXISTS disciplinary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('late_coming', 'fighting', 'truancy', 'misconduct', 'bullying', 'vandalism', 'cheating', 'other')),
  description TEXT NOT NULL,
  action_taken TEXT CHECK (action_taken IN ('verbal_warning', 'written_warning', 'detention', 'suspension', 'expulsion', 'parental_meeting', 'counselling', 'other')),
  action_details TEXT,
  suspension_days INTEGER DEFAULT 0,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  handled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_notified BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMP WITH TIME ZONE,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  follow_up_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE disciplinary_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON disciplinary_records;
CREATE POLICY "Enable all for authenticated" ON disciplinary_records FOR ALL USING (true);

-- ==================== HEALTH RECORDS TABLE ====================
-- Student clinic/sick bay visits
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  complaint TEXT NOT NULL,
  diagnosis TEXT,
  treatment TEXT,
  -- medications_given: [{name, dosage, frequency}]
  medications_given JSONB DEFAULT '[]',
  referred_to_hospital BOOLEAN DEFAULT false,
  hospital_name TEXT,
  parent_notified BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMP WITH TIME ZONE,
  attended_by TEXT,                    -- Name of nurse/health officer
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON health_records;
CREATE POLICY "Enable all for authenticated" ON health_records FOR ALL USING (true);

-- ==================== SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT DEFAULT 'School',
  school_code TEXT,
  school_motto TEXT,
  school_address TEXT,
  school_phone TEXT,
  school_email TEXT,
  school_logo TEXT,
  current_session TEXT,
  current_term TEXT,
  term_start_date DATE,
  term_end_date DATE,
  next_term_start_date DATE,
  -- gradingSystem: [{grade, minScore, maxScore, gradePoint, remark}]
  grading_system JSONB DEFAULT '[]',
  -- termDates: [{term, startDate, endDate}]
  term_dates JSONB DEFAULT '[]',
  -- schoolHours: {morningAssembly, closingTime, breakTime}
  school_hours JSONB DEFAULT '{}',
  max_students_per_class INTEGER DEFAULT 40,
  periods_per_day INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ==================== GRADE MASTERS TABLE ====================
-- Mapping between a Grade and a Teacher ID (Class Master)
CREATE TABLE IF NOT EXISTS grade_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade TEXT UNIQUE NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  academic_year TEXT NOT NULL DEFAULT '2024/2025',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE grade_masters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON grade_masters;
CREATE POLICY "Enable all for authenticated" ON grade_masters FOR ALL USING (true);

-- ==================== LOGIN HISTORY TABLE ====================
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_time TIMESTAMP WITH TIME ZONE,
  device TEXT,
  ip_address TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own login history" ON login_history;
CREATE POLICY "Users can view their own login history" ON login_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin can view all login history" ON login_history;
CREATE POLICY "Admin can view all login history" ON login_history FOR SELECT USING (true);


-- ==================== EXAMS TABLE ====================
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class TEXT NOT NULL, -- Grade level identifier
  subject TEXT,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  date DATE,
  start_time TIME,
  end_time TIME,
  room TEXT,
  max_score INTEGER DEFAULT 100,
  weight INTEGER DEFAULT 1,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON exams;
CREATE POLICY "Enable all for authenticated" ON exams FOR ALL USING (true);

-- ==================== ACADEMIC CALENDAR TABLE ====================
CREATE TABLE IF NOT EXISTS academic_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  week TEXT NOT NULL,
  date_range TEXT NOT NULL,
  activity TEXT NOT NULL,
  status TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON academic_calendar;
CREATE POLICY "Enable all for authenticated" ON academic_calendar FOR ALL USING (true);
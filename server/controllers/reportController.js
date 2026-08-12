const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

const toOrdinal = (num) => {
  const n = Number(num);
  if (!n || n <= 0) return '-';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
};

const getNextGrade = (currentGrade) => {
  const gradeOptions = ['KG 1', 'KG 2', 'KG 3', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'];
  if (!currentGrade) return '--';
  
  // Normalize currentGrade (e.g., Primary 1 -> Basic 1)
  let str = String(currentGrade).trim();
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) str = `Basic ${primaryMatch[1]}`;
  
  // Find index in standard options
  const currentIndex = gradeOptions.findIndex(g => g.toLowerCase() === str.toLowerCase());
  if (currentIndex === -1 || currentIndex === gradeOptions.length - 1) return str; // Unrecognized or already highest
  return gradeOptions[currentIndex + 1];
};

const getInterpretation = (score, settings) => {
  const s = Number(score);
  const gradingSystem = settings?.grading_system || [];
  
  if (gradingSystem.length > 0) {
    const match = gradingSystem.find(g => s >= g.minScore && s <= g.maxScore);
    if (match) return match.remark || match.interpretation || 'N/A';
  }

  // Fallback
  if (s >= 90) return 'Highest';
  if (s >= 80) return 'Higher';
  if (s >= 70) return 'High';
  if (s >= 60) return 'High Avg';
  if (s >= 55) return 'Average';
  if (s >= 50) return 'Low Avg';
  if (s >= 40) return 'Low';
  if (s >= 35) return 'Lower';
  return 'Lowest';
};

const fallbackGradeBand = (score, settings) => {
  const s = Number(score);
  const gradingSystem = settings?.grading_system || [];

  if (gradingSystem.length > 0) {
    const match = gradingSystem.find(g => s >= g.minScore && s <= g.maxScore);
    if (match) return match.grade || match.letter_grade || '--';
  }

  // Fallback
  if (s >= 90) return '1';
  if (s >= 80) return '2';
  if (s >= 70) return '3';
  if (s >= 60) return '4';
  if (s >= 55) return '5';
  if (s >= 50) return '6';
  if (s >= 40) return '7';
  if (s >= 35) return '8';
  return '9';
};

const getGradeValue = (score, settings) => {
  const s = Number(score);
  const gradingSystem = settings?.grading_system || [];

  if (gradingSystem.length > 0) {
    const match = gradingSystem.find(g => s >= g.minScore && s <= g.maxScore);
    if (match) return match.gradePoint || match.value || 1;
  }

  // Fallback
  if (s >= 90) return 1;
  if (s >= 80) return 2;
  if (s >= 70) return 3;
  if (s >= 60) return 4;
  if (s >= 55) return 5;
  if (s >= 50) return 6;
  if (s >= 40) return 7;
  if (s >= 35) return 8;
  return 9;
};

const aggregateYearlyGrades = (grades) => {
  const grouped = {};
  grades.forEach((grade) => {
    const key = grade.course || grade.courseName || grade.subject;
    if (!key) return;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(grade);
  });

  return Object.values(grouped).map((courseGrades) => {
    const sample = courseGrades[0];
    const avg = (field) => Math.round(courseGrades.reduce((sum, g) => sum + Number(g[field] || 0), 0) / courseGrades.length);
    const classScore = avg('classwork') + avg('homework');
    const examScore = avg('final');
    const total = Math.round(
      courseGrades.reduce((sum, g) => sum + Number(g.total ?? (Number(g.classwork || 0) + Number(g.homework || 0) + Number(g.final || 0))), 0) / courseGrades.length
    );
    return {
      ...sample,
      classwork: classScore,
      homework: 0,
      final: examScore,
      total
    };
  });
};

const mapSubjectRows = (grades) => {
  const rows = grades.map((grade) => {
    // Assessments are stored in a JSON field in Supabase
    const assessments = grade.assessments || {};
    const classScore = Number(assessments.classwork || 0) + Number(assessments.homework || 0) + Number(assessments.midterm || 0);
    const examScore = Number(assessments.finalExam || assessments.final || 0);
    const total = Number(grade.total_score ?? grade.total ?? (classScore + examScore));
    
    return {
      name: grade.course_name || grade.subject_name || 'Subject',
      classScore,
      examScore,
      total,
      position: toOrdinal(grade.position),
      grade: grade.letter_grade || grade.grade || fallbackGradeBand(total),
      interpretation: getInterpretation(total)
    };
  });
  rows.sort((a, b) => b.total - a.total);
  return rows;
};

const buildStudentReportPayload = async ({ student, reportType, term: rawTerm, academicYear, month }, options = {}) => {
  const supabase = require('../config/supabase');
  
  // Normalize term (e.g., "FIRST TERM" -> "1st")
  const normalizeTerm = (t) => {
    const termStr = String(t).toLowerCase();
    if (termStr.includes('first')) return '1st';
    if (termStr.includes('second')) return '2nd';
    if (termStr.includes('third')) return '3rd';
    return t;
  };
  const term = normalizeTerm(rawTerm);
  
  const termVariants = [term, rawTerm];
  if (term === '1st') termVariants.push('First Term', 'Term 1');
  if (term === '2nd') termVariants.push('Second Term', 'Term 2');
  if (term === '3rd') termVariants.push('Third Term', 'Term 3');

  // 0. Fetch Metadata first to handle promotions correctly (if published report exists)
  let reportMetadata = options.allReportCards ? options.allReportCards.find(rc => rc.student_id === student.id) : null;
  if (!reportMetadata) {
    try {
      let query = supabase.from('report_cards').select('*').eq('student_id', student.id).in('term', termVariants);
      if (academicYear) query = query.eq('academic_year', academicYear);
      const { data: meta } = await query.maybeSingle();
      if (meta) reportMetadata = meta;
    } catch (e) {}
  }

  // Override grade and section for historical accuracy
  const effectiveGrade = reportMetadata?.grade || student.grade;
  const storedConduct = typeof reportMetadata?.conduct === 'object' ? reportMetadata.conduct : {};
  const effectiveSection = storedConduct?.section || student.section; // fallback to student.section

  // 1. Use pre-fetched Settings or fetch if missing
  const settings = options.settings || (await supabaseService.getAll('settings'))?.[0] || {};
  const schoolName = settings.school_name || 'UHAS BASIC SCHOOL';

  // 2. Fetch Class ID with normalization
  let classId = student.class_id;
  if (effectiveGrade) {
    const allClasses = options.allClasses || (await supabase.from(COLLECTIONS.ACADEMIC_CLASSES).select('id, name')).data;
    const targetGrade = String(effectiveGrade).toLowerCase().trim();
    
    const clean = (s) => s.toLowerCase().replace(/basic|primary|kindergarten|kg/g, '').trim();
    const targetClean = clean(targetGrade);

    const matchedClass = allClasses?.find(c => {
      const dbName = String(c.name).toLowerCase().trim();
      return dbName === targetGrade || 
             dbName === targetGrade.replace('basic', 'primary') ||
             dbName === targetGrade.replace('primary', 'basic') ||
             dbName === targetGrade.replace('kg', 'kindergarten') ||
             dbName === targetGrade.replace('kindergarten', 'kg') ||
             clean(dbName) === targetClean;
    });
    
    if (matchedClass) classId = matchedClass.id;
  }

  // 3. Fetch All Subjects for this Class Level (Highly Aggressive Discovery)
  let classSubjects = [];
  try {
    // Strategy A: Fetch via Class-Subject Relationship (Dynamic Subject Update)
    const allDefinitions = options.allDefinitions || (await supabase.from(COLLECTIONS.CLASS_SUBJECTS)
      .select('*, subject:subject_id(id, name, category), class:class_id(name)')).data;
    
    if (allDefinitions && allDefinitions.length > 0) {
      const targetGrade = String(effectiveGrade || '').toLowerCase().trim();
      const clean = (s) => s.toLowerCase().replace(/basic|primary|kindergarten|kg/g, '').trim();
      const targetClean = clean(targetGrade);

      // Filter for this specific class level
      let matched = allDefinitions.filter(d => {
        const dbClassName = String(d.class?.name || '').toLowerCase().trim();
        return (classId && d.class_id === classId) || 
               dbClassName === targetGrade || 
               dbClassName === targetGrade.replace('basic', 'primary') ||
               dbClassName === targetGrade.replace('primary', 'basic') ||
               dbClassName === targetGrade.replace('kg', 'kindergarten') ||
               dbClassName === targetGrade.replace('kindergarten', 'kg') ||
               clean(dbClassName) === targetClean;
      });

      classSubjects = matched;
    }

    // Fallbacks preserved for resilience...
    if (classSubjects.length === 0 && effectiveGrade) {
      const { data: courseData } = await supabase.from(COLLECTIONS.COURSES)
        .select('*')
        .ilike('grade', `%${effectiveGrade}%`);
      
      if (courseData && courseData.length > 0) {
        classSubjects = courseData.map(c => ({
          subject: { name: c.name, category: c.category || 'CORE' },
          section: c.section
        }));
      }
    }

    const seen = new Set();
    classSubjects = classSubjects.filter(item => {
      const name = item.subject?.name;
      if (!name || seen.has(name.toLowerCase().trim())) return false;
      seen.add(name.toLowerCase().trim());
      return true;
    });

  } catch (err) {
    console.error('Subject Discovery Failure:', err.message);
  }

  // 4. Fetch Student Grades for this term...

  let gradesQuery = supabase.from(COLLECTIONS.GRADES)
    .select('*')
    .eq('student_id', student.id)
    .in('term', termVariants);
  
  if (academicYear) gradesQuery = gradesQuery.eq('academic_year', academicYear);
  
  let gradesData = options.allGrades ? options.allGrades.filter(g => g.student_id === student.id) : (await gradesQuery).data;
  const grades = gradesData || [];

  // 5. Robust Subject Merging: Dynamic updates from CLASS_SUBJECTS
  const subjectMap = new Map();
  classSubjects.forEach(cs => {
    const sName = cs.subject?.name || 'Unknown Subject';
    const cat = (cs.subject?.category || 'CORE').toUpperCase();
    subjectMap.set(sName, {
      id: cs.subject_id || cs.id,
      name: sName,
      category: cat.includes('ELECTIVE') ? 'ELECTIVE' : 'CORE'
    });
  });

  // Global Recovery Fallback for missing definitions
  if (subjectMap.size === 0) {
    const { data: globalSubs } = await supabase.from(COLLECTIONS.SUBJECTS).select('name, category');
    if (globalSubs) {
      globalSubs.forEach(s => {
        const cat = (s.category || 'CORE').toUpperCase();
        subjectMap.set(s.name, { name: s.name, category: cat.includes('ELECTIVE') ? 'ELECTIVE' : 'CORE' });
      });
    }
  }

  // Fetch missing subject names from grades
  const unknownGradeCourseIds = grades
    .filter(g => !g.course_name && !g.subject_name)
    .map(g => g.course_id)
    .filter(id => id);

  let gradeSubjectNames = [];
  if (unknownGradeCourseIds.length > 0) {
    const { data: gsData } = await supabase.from(COLLECTIONS.CLASS_SUBJECTS)
      .select('id, subject:subject_id(name, category)')
      .in('id', unknownGradeCourseIds);
    gradeSubjectNames = gsData || [];
  }

  grades.forEach(g => {
    const gsDetail = gradeSubjectNames.find(gs => String(gs.id) === String(g.course_id));
    const sName = g.course_name || g.subject_name || gsDetail?.subject?.name || 'Unknown Subject';
    
    if (!subjectMap.has(sName)) {
      const cat = (gsDetail?.subject?.category || 'CORE').toUpperCase();
      subjectMap.set(sName, {
        id: g.course_id,
        name: sName,
        category: cat.includes('ELECTIVE') ? 'ELECTIVE' : 'CORE'
      });
    }
  });

  const mergedSubjects = [];
  for (const sInfo of subjectMap.values()) {
    const grade = grades.find(g => 
      (g.course_id && String(g.course_id) === String(sInfo.id)) || 
      (g.course_name === sInfo.name) || (g.subject_name === sInfo.name) ||
      (gradeSubjectNames.find(gs => String(gs.id) === String(g.course_id))?.subject?.name === sInfo.name)
    );
    
    let classScore = grade?.class_score ?? 0;
    let examScore = grade?.exam_score ?? 0;
    
    // Support assessments object or array (Dynamic Extraction)
    if (grade?.assessments && typeof grade.assessments === 'object') {
      if (Array.isArray(grade.assessments)) {
        // Handle Array format: [{ name: "Class Score", score: 20 }, ...]
        let cs = 0;
        let es = 0;
        grade.assessments.forEach(a => {
          const name = String(a.name || '').toLowerCase();
          const score = Number(a.score || 0);
          if (name.includes('class') || name.includes('homework') || name.includes('midterm') || name.includes('test')) {
            cs += score;
          } else if (name.includes('exam') || name.includes('final')) {
            es += score;
          }
        });
        // Only override if we found actual data
        if (cs > 0 || es > 0) {
          classScore = cs;
          examScore = es;
        }
      } else {
        // Handle Legacy Object format: { classwork: 10, homework: 5, ... }
        const a = grade.assessments;
        const cs = (Number(a.classwork || 0) + Number(a.homework || 0) + Number(a.midterm || 0));
        const es = Number(a.finalExam || a.final || 0);
        if (cs > 0 || es > 0) {
          classScore = cs;
          examScore = es;
        }
      }
    }

    const total = Number(grade?.total_score ?? (classScore + examScore));

    mergedSubjects.push({
      name: sInfo.name,
      category: sInfo.category,
      classScore,
      examScore,
      total,
      position: toOrdinal(grade?.position),
      grade: grade?.letter_grade || (total > 0 ? fallbackGradeBand(total, settings) : '--'),
      gradeValue: total > 0 ? getGradeValue(total, settings) : '--',
      interpretation: total > 0 ? getInterpretation(total, settings) : '--'
    });
  }

  // 6. Fetch Attendance
  let attendanceData = [];
  if (options.allAttendance) {
    attendanceData = options.allAttendance.filter(a => a.student_id === student.id);
  } else {
    let attendanceQuery = supabase.from(COLLECTIONS.ATTENDANCE)
      .select('status')
      .eq('student_id', student.id)
      .in('term', termVariants);
    if (academicYear) attendanceQuery = attendanceQuery.eq('academic_year', academicYear);
    const { data } = await attendanceQuery;
    attendanceData = data || [];
  }
  const attendancePresent = attendanceData ? attendanceData.filter(r => ['present', 'late'].includes(String(r.status || '').toLowerCase())).length : 0;

  // 7. Remarks and Metadata (already fetched at the top)

  // 8. Class Master & Position
  let teacherName = 'CLASS TEACHER';
  try {
    const { data: sectionInfo } = await supabase.from(COLLECTIONS.SECTIONS)
      .select('teacher:class_master_id(first_name, last_name), class_id')
      .eq('name', effectiveSection);
    let bestSection = sectionInfo?.find(s => s.class_id === classId) || sectionInfo?.[0];
    if (bestSection?.teacher) teacherName = `${bestSection.teacher.first_name} ${bestSection.teacher.last_name}`;
  } catch (e) {}

  let classPosition = '--';
  try {
    const { data: sectionStudents } = await supabase.from(COLLECTIONS.STUDENTS).select('id').eq('grade', effectiveGrade).eq('section', effectiveSection);
    if (sectionStudents?.length > 0) {
      const studentIds = sectionStudents.map(s => s.id);
      const { data: allGrades } = await supabase.from(COLLECTIONS.GRADES).select('student_id, total_score').in('student_id', studentIds).in('term', termVariants).eq('academic_year', academicYear);
      const aggregates = {};
      allGrades?.forEach(g => aggregates[g.student_id] = (aggregates[g.student_id] || 0) + Number(g.total_score || 0));
      const sorted = Object.entries(aggregates).map(([id, agg]) => ({ id, agg })).sort((a, b) => b.agg - a.agg);
      const rank = sorted.findIndex(s => s.id === student.id) + 1;
      if (rank > 0) classPosition = `${toOrdinal(rank)} of ${sectionStudents.length}`;
    }
  } catch (e) {}

  mergedSubjects.sort((a, b) => b.total - a.total);

  return {
    schoolName: schoolName.toUpperCase(),
    studentId: student.id,
    studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
    admissionNumber: student.admission_number || 'N/A',
    gender: student.gender || 'N/A',
    class: effectiveGrade || 'N/A',
    section: effectiveSection || 'N/A',
    year: academicYear || '2024-2025',
    term: rawTerm.toUpperCase(),
    month: month?.toUpperCase() || 'N/A',
    date: new Date().toLocaleDateString(),
    aggregate: mergedSubjects.reduce((sum, row) => sum + Number(row.total || 0), 0),
    classPosition,
    subjects: mergedSubjects.filter(s => s.category === 'CORE'),
    electives: mergedSubjects.filter(s => s.category === 'ELECTIVE'),
    attendance: attendanceData && attendanceData.length > 0 ? attendancePresent : (reportMetadata?.attendance_days || reportMetadata?.attendance || '--'),
    totalDays: settings.total_days || reportMetadata?.total_school_days || reportMetadata?.total_days || (attendanceData && attendanceData.length > 0 ? attendanceData.length : '--'),
    conduct: (() => {
      const c = reportMetadata?.conduct;
      const val = (typeof c === 'object' && c !== null) ? (c.conduct || 'VERY GOOD') : (c || 'VERY GOOD');
      return String(val).toUpperCase();
    })(),
    attitude: (() => {
      const c = reportMetadata?.conduct;
      const val = (typeof c === 'object' && c !== null) ? (c.attitude || 'CONSISTENT') : (reportMetadata?.attitude || 'CONSISTENT');
      return String(val).toUpperCase();
    })(),
    interest: (() => {
      const c = reportMetadata?.conduct;
      const val = (typeof c === 'object' && c !== null) ? (c.interest || 'ACADEMIC EXCELLENCE') : (reportMetadata?.interest || 'ACADEMIC EXCELLENCE');
      return String(val).toUpperCase();
    })(),
    teacherRemarks: reportMetadata?.class_teacher_remarks || reportMetadata?.teacher_remarks || 'A very good performance. Keep it up.',
    promotedTo: (() => {
      if (reportMetadata?.promoted_to) return String(reportMetadata.promoted_to).toUpperCase();
      if (student?.promoted_to) return String(student.promoted_to).toUpperCase();
      // Auto-calculate for Third Term
      if (term === '3rd') {
        const nextGrade = getNextGrade(effectiveGrade);
        return String(nextGrade).toUpperCase();
      }
      return '--';
    })(),
    teacherName: teacherName.toUpperCase()
  };
};

// @desc    Generate student report payload
// @route   GET /api/reports/student/:studentId
// @access  Private
const getStudentReport = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { reportType, type, term = 'First Term', academicYear, month } = req.query;
  const finalReportType = reportType || type || 'mid-term';

  const student = await supabaseService.getById(COLLECTIONS.STUDENTS, studentId);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Security check for teachers
  const user = req.user;
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (!teacherProfile) return res.status(403).json({ message: 'Teacher profile not found' });
    
    // Check if the student belongs to the section the teacher is Class Master of
    const { data: masteredSections } = await supabase
      .from(COLLECTIONS.SECTIONS)
      .select('id, name, class_id, class:class_id(name)')
      .eq('class_master_id', teacherProfile.id);
    
    const isMasterOfStudent = (masteredSections || []).some(s => {
      const matchesGrade = String(s.class?.name).toLowerCase() === String(student.grade).toLowerCase() || String(s.class_id) === String(student.class_id);
      
      const dbSec = String(s.name).toLowerCase().replace('section', '').trim();
      const stSec = String(student.section).toLowerCase().replace('section', '').trim();
      
      return matchesGrade && dbSec === stSec;
    });

    if (!isMasterOfStudent) {
      return res.status(403).json({ message: 'Access denied. You can only generate reports for students in the section you are the Class Master of.' });
    }
  }

  // Security check for parents — only allow access to published reports
  if (user.role === 'parent') {
    const termMapping = { 'First Term': '1st', 'Second Term': '2nd', 'Third Term': '3rd' };
    const reverseMapping = { '1st': 'First Term', '2nd': 'Second Term', '3rd': 'Third Term' };
    const dbTerm = termMapping[term] || term;
    const readableTerm = reverseMapping[term] || term;
    // Check all possible formats the term could be stored as
    const termVariants = [...new Set([term, dbTerm, readableTerm, term.toUpperCase(), term.toLowerCase()])];

    const { data: checkMeta } = await supabase.from('report_cards')
      .select('is_published')
      .eq('student_id', student.id)
      .in('term', termVariants)
      .maybeSingle();

    if (!checkMeta || !checkMeta.is_published) {
      return res.status(403).json({ 
        success: false, 
        message: 'The report for this academic term has not been published by the school administration yet.' 
      });
    }
  }

  const reportData = await buildStudentReportPayload({ student, reportType: finalReportType, term, academicYear, month });
  const allStudents = await supabaseService.getAll(COLLECTIONS.STUDENTS, { limit: 2000 });
  const sectionCount = allStudents.filter((s) => s.grade === student.grade && s.section === student.section).length || '-';
  reportData.numberOnRoll = sectionCount;

  res.json({
    success: true,
    data: reportData
  });
});

// @desc    Generate class-level report payload (bulk)
// @route   GET /api/reports/class/:grade
// @access  Private
const getClassReport = asyncHandler(async (req, res) => {
  const { grade } = req.params;
  const { reportType, type, term = 'First Term', academicYear, month, section } = req.query;
  const finalReportType = reportType || type || 'mid-term';
  const user = req.user;

  // Security check for teachers
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (!teacherProfile) return res.status(403).json({ message: 'Teacher profile not found' });
    
    // Check if teacher teaches this grade OR is Class Master for a section in this grade
    const { data: masteredSections } = await supabase
      .from(COLLECTIONS.SECTIONS)
      .select('id, name, class_id, class:class_id(name)')
      .eq('class_master_id', teacherProfile.id);
    
    // Check if teacher is Class Master for this grade and section
    const isMasterOfGrade = (masteredSections || []).some(s => {
      const matchesGrade = String(s.class?.name).toLowerCase() === String(grade).toLowerCase() || String(s.class_id) === String(grade);
      if (section && section !== 'All') {
        const targetSec = String(section).toLowerCase().replace('section', '').trim();
        const dbSec = String(s.name).toLowerCase().replace('section', '').trim();
        return matchesGrade && dbSec === targetSec;
      }
      return matchesGrade;
    });

    if (!isMasterOfGrade) {
      return res.status(403).json({ message: 'Access denied. You can only generate reports for the class and section you are the Class Master of.' });
    }
  }

  const gradeName = String(grade).toLowerCase();
  const gradeNumber = gradeName.replace(/basic|primary|kindergarten|kg|jhs|nursery/g, '').trim();
  
  let baseNames = [
    gradeName,
    gradeName.replace('primary', 'basic'),
    gradeName.replace('basic', 'primary'),
    gradeNumber
  ];

  const toTitleCase = (str) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  
  const expandedNames = new Set();
  baseNames.forEach(n => {
    if (!n) return;
    expandedNames.add(n);
    expandedNames.add(n.toUpperCase());
    expandedNames.add(toTitleCase(n));
  });

  const possibleNames = Array.from(expandedNames);

  // Targeted student fetch
  const { data: studentsData } = await supabase.from(COLLECTIONS.STUDENTS)
    .select('*')
    .in('grade', possibleNames);
  
  let students = studentsData || [];
  
  if (section && section !== 'All') {
    students = students.filter(s => s.section === section);
  }
  
  // Robust case-insensitive filtering for grade
  const searchNames = possibleNames.filter(n => n !== gradeNumber).map(n => n.toLowerCase().trim());
  students = students.filter(s => {
    const sGrade = String(s.grade || '').toLowerCase().trim();
    
    // First, try exact matches with known variants
    if (searchNames.includes(sGrade) || sGrade === gradeName.toLowerCase().trim()) return true;
    
    // If no exact match, try the number match ONLY if the tier (Basic/JHS/KG) also matches
    const sGradeNumber = sGrade.replace(/basic|primary|kindergarten|kg|jhs|nursery/g, '').trim();
    if (gradeNumber && sGradeNumber === gradeNumber) {
      const isBasic = gradeName.includes('basic') || gradeName.includes('primary');
      const isJHS = gradeName.includes('jhs');
      const isKG = gradeName.includes('kg') || gradeName.includes('kindergarten');
      const isNursery = gradeName.includes('nursery');
      
      const sIsBasic = sGrade.includes('basic') || sGrade.includes('primary');
      const sIsJHS = sGrade.includes('jhs');
      const sIsKG = sGrade.includes('kg') || sGrade.includes('kindergarten');
      const sIsNursery = sGrade.includes('nursery');
      
      if (isBasic && sIsBasic) return true;
      if (isJHS && sIsJHS) return true;
      if (isKG && sIsKG) return true;
      if (isNursery && sIsNursery) return true;
      
      // If neither has a clear tier, allow number match as fallback
      if (!isBasic && !isJHS && !isKG && !sIsBasic && !sIsJHS && !sIsKG) return true;
    }
    
    return false;
  });
  
  if (section) {
    const targetSec = String(section).toLowerCase().replace('section', '').trim();
    students = students.filter(s => {
      const dbSec = String(s.section || '').toLowerCase().replace('section', '').trim();
      return dbSec === targetSec || String(s.section || '').toLowerCase() === String(section).toLowerCase();
    });
  }
  
  // Remove academicYear filtering for students - we only care about their current grade/section
  // and we will filter THEIR GRADES by academicYear later in buildStudentReportPayload.

  students.sort((a, b) => `${a.last_name || ''}${a.first_name || ''}`.localeCompare(`${b.last_name || ''}${b.first_name || ''}`));

  // 2. BULK DATA RETRIEVAL (The "Needed Data")
  console.log(`[REPORT] Starting bulk retrieval for ${students.length} students...`);
  const studentIds = students.map(s => s.id);
  const termVariants = [term];
  if (term === 'First Term' || term === '1st') termVariants.push('First Term', '1st', 'Term 1');
  if (term === 'Second Term' || term === '2nd') termVariants.push('Second Term', '2nd', 'Term 2');
  if (term === 'Third Term' || term === '3rd') termVariants.push('Third Term', '3rd', 'Term 3');

  const [
    settingsResult,
    classesResult,
    definitionsResult,
    allGradesResult,
    allAttendanceResult,
    allReportCardsResult
  ] = await Promise.all([
    supabaseService.getAll('settings'),
    supabase.from(COLLECTIONS.ACADEMIC_CLASSES).select('id, name'),
    supabase.from(COLLECTIONS.CLASS_SUBJECTS).select('*, subject:subject_id(id, name, category), class:class_id(name)'),
    supabase.from(COLLECTIONS.GRADES).select('*').in('student_id', studentIds).in('term', termVariants).eq('academic_year', academicYear),
    supabase.from(COLLECTIONS.ATTENDANCE).select('*').in('student_id', studentIds).in('term', termVariants).eq('academic_year', academicYear),
    supabase.from('report_cards').select('*').in('student_id', studentIds).in('term', termVariants)
  ]);

  const bulkOptions = {
    settings: settingsResult?.[0] || {},
    allClasses: classesResult?.data || [],
    allDefinitions: definitionsResult?.data || [],
    allGrades: allGradesResult?.data || [],
    allAttendance: allAttendanceResult?.data || [],
    allReportCards: allReportCardsResult?.data || []
  };

  const reports = [];
  for (const student of students) {
    try {
      const payload = await buildStudentReportPayload(
        { student, reportType: finalReportType, term, academicYear, month },
        bulkOptions
      );
      payload.numberOnRoll = students.length;
      reports.push(payload);
    } catch (err) {
      console.error(`[REPORT] Synthesis failed for ${student.id}:`, err.message);
    }
  }

  const classAverage = reports.length
    ? Number((reports.reduce((sum, r) => sum + Number(r.aggregate || 0), 0) / reports.length).toFixed(2))
    : 0;

  res.json({
    success: true,
    data: {
      grade,
      reportType,
      term: reportType === 'end-year' ? 'YEARLY' : String(term).toUpperCase(),
      academicYear: academicYear || 'N/A',
      totalStudents: reports.length,
      classAverage,
      reports
    }
  });
});

// @desc    Send report to parents
// @route   POST /api/reports/send
// @access  Private
const sendReportToParents = asyncHandler(async (req, res) => {
  const { reports } = req.body;
  if (!reports || reports.length === 0) {
    return res.status(400).json({ success: false, message: 'No reports to send.' });
  }

  const supabase = require('../config/supabase');

  const termMapping = {
    'First Term': '1st',
    'Second Term': '2nd',
    'Third Term': '3rd'
  };

  const results = [];

  for (const r of reports) {
    const rawTerm = r.term || 'First Term';
    const term = termMapping[rawTerm] || String(rawTerm).toLowerCase().replace(' ', '');
    // Normalize academic year: both "2024/2025" and "2024-2025" → "2024-2025"
    const academic_year = (r.year || r.academic_year || '2024-2025').replace('/', '-');
    const student_id = r.studentId || r.student_id;
    const grade = r.class || r.studentGrade || r.grade || 'N/A';

    console.log(`[SEND REPORT] student_id=${student_id} term=${term} year=${academic_year} grade=${grade}`);

    if (!student_id) {
      console.warn('[SEND REPORT] Skipping report with no student_id:', JSON.stringify(r).substring(0, 200));
      results.push({ success: false, reason: 'Missing student_id' });
      continue;
    }

    const reportPayload = {
      student_id,
      grade,
      term,
      academic_year,
      // conduct is a JSONB column — store all behavioral fields inside it
      conduct: {
        conduct: String(r.conduct || 'VERY GOOD'),
        attitude: String(r.attitude || 'CONSISTENT'),
        interest: String(r.interest || 'ACADEMIC EXCELLENCE'),
        report_type: r.type || r.reportType || 'Terminal Report',
        section: String(r.section || 'A')
      },
      class_teacher_remarks: r.teacherRemarks || r.teacher_remarks || 'A very good performance. Keep it up.',
      attendance_days: Number(r.attendance || 0),
      total_school_days: Number(r.totalDays || r.total_days || 0),
      is_published: true
    };

    const { data: existing } = await supabase.from('report_cards')
      .select('id')
      .eq('student_id', student_id)
      .eq('term', term)
      .eq('academic_year', academic_year)
      .maybeSingle();

    let opResult;
    if (existing) {
      console.log(`[SEND REPORT] Updating existing record id=${existing.id}`);
      opResult = await supabase.from('report_cards').update(reportPayload).eq('id', existing.id);
    } else {
      console.log(`[SEND REPORT] Inserting new record for student_id=${student_id}`);
      opResult = await supabase.from('report_cards').insert([reportPayload]);
    }

    if (opResult.error) {
      console.error('[SEND REPORT] DB error:', JSON.stringify(opResult.error));
      results.push({ success: false, error: opResult.error.message });
    } else {
      results.push({ success: true, student_id, term });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`[SEND REPORT] Done: ${successCount} saved, ${failCount} failed`);

  if (successCount === 0) {
    return res.status(500).json({
      success: false,
      message: `Failed to save reports. Errors: ${results.map(r => r.error || r.reason).join(', ')}`
    });
  }

  res.json({
    success: true,
    message: `${successCount} report(s) successfully dispatched and are now accessible in the Parent Portal.`,
    saved: successCount,
    failed: failCount
  });
});

// @desc    Get published reports for a parent's children
// @route   GET /api/reports/published
// @access  Private (Parent)
const getPublishedReports = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.role !== 'parent') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const supabase = require('../config/supabase');
  const { COLLECTIONS } = require('../services/supabaseService');

  const { data: parentProfile } = await supabase
    .from(COLLECTIONS.PARENTS)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!parentProfile) return res.status(404).json({ success: false, message: 'Parent profile not found.' });

  // Students store parent links as an array field: parent_ids
  const { data: children } = await supabase
    .from(COLLECTIONS.STUDENTS)
    .select('id, first_name, last_name, admission_number, grade')
    .contains('parent_ids', [parentProfile.id]);

  if (!children || children.length === 0) return res.json({ success: true, data: [] });

  const childIds = children.map(c => c.id);

  const { data: publishedReports } = await supabase
    .from('report_cards')
    .select('*')
    .in('student_id', childIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const reportsWithStudent = (publishedReports || []).map(report => {
    const student = children.find(c => c.id === report.student_id);
    return {
      ...report,
      student
    };
  });

  res.json({ success: true, data: reportsWithStudent });
});

// @desc    Delete a published report (Parent)
// @route   DELETE /api/reports/published/:id
// @access  Private (Parent)
const deletePublishedReport = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  if (user.role !== 'parent') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const supabase = require('../config/supabase');
  const { COLLECTIONS } = require('../services/supabaseService');

  // Verify the parent actually owns this report
  const { data: parentProfile } = await supabase
    .from(COLLECTIONS.PARENTS)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!parentProfile) return res.status(404).json({ success: false, message: 'Parent profile not found.' });

  // Get the report to verify it belongs to one of their children
  const { data: report } = await supabase
    .from('report_cards')
    .select('student_id')
    .eq('id', id)
    .maybeSingle();

  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found.' });
  }

  const { data: children } = await supabase
    .from(COLLECTIONS.STUDENTS)
    .select('id')
    .contains('parent_ids', [parentProfile.id]);
    
  const childIds = children?.map(c => c.id) || [];
  
  if (!childIds.includes(report.student_id)) {
    return res.status(403).json({ success: false, message: 'Access denied to this report.' });
  }

  // Soft delete or just remove from this parent's view? Since report_cards are tied to students, we'll hard delete it 
  // or set is_published to false. Since it's a "Delete report sent" action, we'll delete it.
  const { error } = await supabase.from('report_cards').delete().eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete report.' });
  }

  res.json({ success: true, message: 'Report successfully deleted.' });
});

module.exports = {
  getStudentReport,
  getClassReport,
  sendReportToParents,
  getPublishedReports,
  deletePublishedReport
};

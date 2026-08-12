const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th'],
    required: true
  },
  assessments: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['classScore', 'examScore', 'classwork', 'homework', 'quiz', 'test', 'midterm', 'final', 'project', 'assignment'],
      required: true
    },
    maxScore: {
      type: Number,
      required: true,
      default: 100
    },
    score: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      default: 1
    },
    date: {
      type: Date,
      default: Date.now
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    comments: String
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  letterGrade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'N/A']
  },
  gradePoint: {
    type: Number,
    min: 0,
    max: 4.0
  },
  rank: {
    type: Number
  },
  remarks: String,
  isFinalized: {
    type: Boolean,
    default: false
  },
  finalizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  finalizedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total score and letter grade before saving
gradeSchema.pre('save', function(next) {
  if (this.assessments && this.assessments.length > 0) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    this.assessments.forEach(assessment => {
      const percentage = (assessment.score / assessment.maxScore) * 100;
      weightedSum += percentage * assessment.weight;
      totalWeight += assessment.weight;
    });
    
    this.totalScore = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : 0;
    this.letterGrade = this.calculateLetterGrade(this.totalScore);
    this.gradePoint = this.calculateGradePoint(this.letterGrade);
  }
  this.updatedAt = Date.now();
  next();
});

gradeSchema.methods.calculateLetterGrade = function(score) {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D+';
  if (score >= 40) return 'D';
  if (score >= 35) return 'D-';
  return 'F';
};

gradeSchema.methods.calculateGradePoint = function(letterGrade) {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  return gradePoints[letterGrade] || 0;
};

// Compound index for unique grade per student per course per term
gradeSchema.index({ student: 1, course: 1, academicYear: 1, term: 1 }, { unique: true });

gradeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Grade', gradeSchema);


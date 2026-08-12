const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
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
  grade: {
    type: String,
    required: true
  },
  assignmentType: {
    type: String,
    enum: ['homework', 'classwork', 'quiz', 'test', 'project', 'assignment'],
    default: 'homework'
  },
  maxScore: {
    type: Number,
    required: true,
    default: 100
  },
  weight: {
    type: Number,
    default: 1
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  instructions: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    submittedAt: Date,
    score: Number,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    gradedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'submitted', 'graded', 'late'],
      default: 'pending'
    },
    submissionText: String,
    attachments: [{
      name: String,
      url: String
    }]
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    type: Number,
    default: 0 // percentage
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for searching
assignmentSchema.index({ title: 'text', description: 'text' });
assignmentSchema.index({ course: 1, academicYear: 1, term: 1 });

assignmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Assignment', assignmentSchema);


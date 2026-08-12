const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String
  },
  grade: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: 'All'
  },
  academicYear: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  credits: {
    type: Number,
    default: 0
  },
  hoursPerWeek: {
    type: Number,
    default: 0
  },
  room: String,
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    startTime: String,
    endTime: String
  }],
  syllabus: [{
    week: Number,
    topic: String,
    objectives: [String],
    activities: String,
    resources: String,
    assessment: String
  }],
  materials: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'document']
    },
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  gradingScheme: {
    classwork: {
      type: Number,
      default: 20
    },
    homework: {
      type: Number,
      default: 20
    },
    midterm: {
      type: Number,
      default: 20
    },
    final: {
      type: Number,
      default: 40
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  tags: [String],
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
courseSchema.index({ name: 'text', code: 'text' });

courseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);


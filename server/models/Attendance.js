const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
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
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  arrivalTime: String,
  departureTime: String,
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  notes: String,
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
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

// Compound index for unique attendance per student per date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ academicYear: 1, term: 1 });
attendanceSchema.index({ course: 1, date: 1 });

attendanceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Attendance', attendanceSchema);


const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    field: String
  }],
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  grades: [{
    type: String // Grade levels they teach
  }],
  dateOfEmployment: {
    type: Date,
    default: Date.now
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  salary: {
    type: Number,
    default: 0
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  socialSecurity: {
    type: String // SSN or equivalent
  },
  schedule: [{
    day: String,
    periods: [{
      period: Number,
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      grade: String,
      section: String
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
    default: 'active'
  },
  profileImage: String,
  bio: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for full name
teacherSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for searching
teacherSchema.index({ firstName: 'text', lastName: 'text', employeeId: 'text' });

teacherSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Teacher', teacherSchema);


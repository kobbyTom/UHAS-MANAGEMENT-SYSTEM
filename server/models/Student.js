const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admissionNumber: {
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
  grade: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: 'A'
  },
  academicYear: {
    type: String,
    required: true
  },
  dateOfAdmission: {
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
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    medicalConditions: [String],
    medications: String
  },
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  }],
  attendance: [{
    date: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'present'
    },
    notes: String
  }],
  grades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade'
  }],
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'suspended', 'transferred'],
    default: 'active'
  },
  profileImage: String,
  notes: String,
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
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Calculate age
studentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Index for searching
studentSchema.index({ firstName: 'text', lastName: 'text', admissionNumber: 'text' });

studentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);


const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  relationship: {
    type: String,
    enum: ['father', 'mother', 'guardian', 'other'],
    required: true
  },
  occupation: String,
  company: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  phone: {
    type: String,
    required: true
  },
  alternativePhone: String,
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['academic', 'attendance', 'fee', 'general']
    },
    title: String,
    message: String,
    isRead: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferredLanguage: {
    type: String,
    default: 'en'
  },
  receiveSMS: {
    type: Boolean,
    default: true
  },
  receiveEmail: {
    type: Boolean,
    default: true
  },
  profileImage: String,
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
parentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

parentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Parent', parentSchema);


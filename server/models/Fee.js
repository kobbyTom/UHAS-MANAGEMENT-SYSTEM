const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th', 'all'],
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'GHS'
  },
  dueDate: {
    type: Date,
    required: true
  },
  lateFee: {
    type: Number,
    default: 0
  },
  lateFeeAfter: {
    type: Date
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  components: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: String
  }],
  paymentMethods: [{
    type: String,
    enum: ['cash', 'mobile_money', 'bank_transfer', 'card']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

feeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Fee', feeSchema);


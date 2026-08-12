const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
  fee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fee',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile_money', 'bank_transfer', 'card', 'online'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptGeneratedAt: Date,
  paymentDetails: {
    mobileMoneyNumber: String,
    mobileMoneyProvider: String,
    bankName: String,
    accountNumber: String,
    cardLast4: String,
    transactionRef: String
  },
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate receipt number before saving
paymentSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.receiptNumber = `RCP-${year}${month}-${String(count).padStart(5, '0')}`;
    this.receiptGenerated = true;
    this.receiptGeneratedAt = new Date();
  }
  
  // Generate transaction ID
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Calculate balance
paymentSchema.methods.calculateBalance = function() {
  this.balance = this.amount - this.amountPaid;
  return this.balance;
};

// Indexes
paymentSchema.index({ student: 1, academicYear: 1, term: 1 });
paymentSchema.index({ receiptNumber: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentDate: 1 });

paymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);


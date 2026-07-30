const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  tableNum: {
    type: Number,
    required: true
  },
  customerName: {
    type: String,
    required: true,
    default: 'Customer'
  },
  loginType: {
    type: String,
    enum: ['guest', 'member'],
    default: 'guest'
  },
  status: {
    type: String,
    enum: [
      'Active',
      'Checkout Requested',
      'Awaiting Cash Payment',
      'Awaiting Demo Online Payment',
      'Payment Completed',
      'Cleaning Pending',
      'Cleaning In Progress',
      'Cleaning Completed',
      'Vacated'
    ],
    default: 'Active'
  },
  orderId: {
    type: String,
    default: ''
  },
  items: [
    {
      name: String,
      price: Number,
      qty: Number,
      subtotal: Number
    }
  ],
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['pending', 'cash', 'demo_upi', 'demo_card', 'demo_netbanking', 'demo_wallet'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'awaiting_cash', 'paid', 'delayed'],
    default: 'unpaid'
  },
  demoTransactionId: {
    type: String,
    default: ''
  },
  sessionStart: {
    type: Date,
    default: Date.now
  },
  billRequestedAt: {
    type: Date
  },
  paymentStartedAt: {
    type: Date
  },
  paymentCompletedAt: {
    type: Date
  },
  cashTimerEndAt: {
    type: Date
  },
  vacatingTimerEndAt: {
    type: Date
  },
  cleaningStartedAt: {
    type: Date
  },
  cleaningCompletedAt: {
    type: Date
  },
  tableVacatedAt: {
    type: Date
  }
}, {
  timestamps: true,
  bufferCommands: false
});

module.exports = mongoose.model('Session', sessionSchema);

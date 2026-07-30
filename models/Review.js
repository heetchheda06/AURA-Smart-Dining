const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true
  },
  avatar: {
    type: String,
    default: function() {
      const name = this.customerName || 'Customer';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1E3A5F&color=fff&bold=true`;
    }
  },
  isVerified: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  bufferCommands: false,
  bufferTimeoutMS: 8000
});

module.exports = mongoose.model('Review', reviewSchema);

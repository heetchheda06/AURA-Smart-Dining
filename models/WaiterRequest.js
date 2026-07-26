const mongoose = require('mongoose');

const waiterRequestSchema = new mongoose.Schema({
  tableNum: {
    type: Number,
    required: true
  },
  serviceName: {
    type: String,
    required: true,
    enum: ['Water Refill', 'Extra Cutlery / Napkins', 'Clean Table', 'Speak with Sommelier']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WaiterRequest', waiterRequestSchema);

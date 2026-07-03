// model/Leave.js
const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users', // References your User model (mymodel)
    required: true,
  },
  leaveDate: {
    type: Date,
    required: true,
  },
  leaveType: {
    type: String,
    enum: ['Casual Leave', 'Sick Leave', 'Earned Leave'], // You can expand this
    default: 'Casual Leave',
    required: true,
  },
  
}, { timestamps: true });

// Ensure unique leave per user per day for a specific leave type
leaveSchema.index({ userId: 1, leaveDate: 1, leaveType: 1 }, { unique: true });

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;

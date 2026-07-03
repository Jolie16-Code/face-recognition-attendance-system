const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users', 
    required: true,
  },
  
  attendanceDate: {
    type: Date,
    default: () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return new Date(`${yyyy}-${mm}-${dd}`);
    },
  },
  checkInTime: {
  type: String,
  default: () => {
    const now = new Date();
    return now.toTimeString().slice(0, 8); // "HH:MM:SS"
  },
},

attendanceStatus: {
  type: String,
  enum: ["Accepted", "Late", "Weekend"],
  default: "Accepted"
}


  
});

const Attendance = mongoose.model('attendances', attendanceSchema);

module.exports = Attendance;

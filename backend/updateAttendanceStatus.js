require("dotenv").config();
const mongoose = require("mongoose");
const Attendance = require("./model/model2");

mongoose.connect(process.env.URI);

async function updateAttendanceStatus() {
  try {
    const records = await Attendance.find();

    console.log(`Found ${records.length} attendance records.\n`);

    let updated = 0;

    for (const record of records) {

      if (!record.checkInTime) continue;

      const attendanceDate = new Date(record.attendanceDate);

      const day = attendanceDate.getDay();

      const [hour, minute, second] =
        record.checkInTime.split(":").map(Number);

      const loginSeconds = hour * 3600 + minute * 60 + second;

      const start = 9 * 3600;          // 09:00:00
      const end = 11 * 3600;           // 11:00:00

      let status;

      if (day === 0 || day === 6) {
        status = "Weekend";
      }
      else if (loginSeconds >= start && loginSeconds <= end) {
        status = "Accepted";
      }
      else {
        status = "Late";
      }

      record.attendanceStatus = status;

      await record.save();

      updated++;

      console.log(
        `${attendanceDate.toDateString()} | ${record.checkInTime} -> ${status}`
      );
    }

    console.log("\n================================");
    console.log(`Updated ${updated} records.`);
    console.log("Migration completed successfully.");
    console.log("================================");

    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateAttendanceStatus();
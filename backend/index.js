const dotenv= require('dotenv');
dotenv.config();
const express= require('express');
const app= express();
const faceRouter = require('./routes/registration')
const Attendance = require("./model/model2")
const connectDb = require('./db1/config');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const mymodel = require('./model/model1')

const Leave = require('./model/leave'); 

const nodemailer = require('nodemailer'); // Import nodemailer

const cors = require("cors")

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const directoryPath = path.join(__dirname, '../frontend/public/uploads');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors())
app.use(bodyParser.json())



const port = process.env.PORT||8001;

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use 'outlook', 'yahoo', or a custom host
    auth: {
        user: process.env.EMAIL_USER, // Your admin email from .env
        pass: process.env.EMAIL_PASS  // Your app password or regular password from .env
    }
});


app.use('/', faceRouter)

app.get('/filenames',(req,res) =>{
    fs.readdir(directoryPath, (err,files) =>{
     if (err){
        console.error('Error readin directory :',err);
        return res.status(500).send('error reading directory');
     }  
     
     const filenamesString=files.join(',');
     res.send(filenamesString);
    });

});

app.get('/find-user', async (req, res) => {
    try {
      const imageName = req.query.image; // example: "user1.jpg"
     
   
      if (!imageName) {
        return res.status(400).json({ message: 'Image name required' });
      }
  console.log("Image received from frontend:", imageName);
      const user = await mymodel.findOne({  userImage: imageName } );
      console.log("User found:", user);
  
      if (user) {
        //const today = new Date().toLocaleDateString();
        //const attendanceDate = new Date(today.setHours(0, 0, 0, 0)); // normalize to date only
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const attendanceDate=new Date(`${yyyy}-${mm}-${dd}`);
        
        const alreadyMarked = await Attendance.findOne({
        userId: user._id,
        attendanceDate: attendanceDate
        
      });
      console.log("Already Marked Record:", alreadyMarked);

      if (!alreadyMarked) {
const now = new Date();
  const day = now.getDay();

const loginSeconds =
  now.getHours() * 3600 +
  now.getMinutes() * 60 +
  now.getSeconds();

const start = 9 * 3600;     // 09:00:00
const end = 11 * 3600;      // 11:00:00

let attendanceStatus;

if (day === 0 || day === 6) {
  attendanceStatus = "Weekend";
}
else if (loginSeconds >= start && loginSeconds <= end) {
  attendanceStatus = "Accepted";
}
else {
  attendanceStatus = "Late";
}
console.log("Attendance Status:", attendanceStatus);
  const newAttendance = new Attendance({
    userId: user._id,
    attendanceStatus
   
  });

  await newAttendance.save();
        console.log(`✅ Attendance saved for ${user.name}`);

        // --- Send Email Notification (NEW LOGIC) ---
        // Only send email if the user is NOT an Admin
        if (user.userType !== 'Admin') {
            const mailOptions = {
                from: process.env.ADMIN_EMAIL, // Sender address (your admin email from .env)
                to: user.email,               // Recipient's email (the user who just logged in)
                subject: 'Attendance Marked Successfully',
                html: `
                    <p>Dear ${user.name},</p>
                    <p>Your attendance for today, <strong>${attendanceDate.toLocaleDateString()}</strong>, has been successfully marked at <strong>${newAttendance.checkInTime}</strong>.</p>
                    <p>Thank you!</p>
                    <p>Regards,</p>
                    <p>The Facade Team</p>
                   
                `
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`📧 Attendance email sent to ${user.email}`);
            } catch (emailError) {
                console.error(`❌ Error sending attendance email to ${user.email}:`, emailError);
            }
        }



      } else {
        console.log(`📌 Attendance already marked for ${user.name} today`);
      }
        res.json(user);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Error finding user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  
  

  app.get('/attendance/user/:userId', async (req, res) => {
    try {
      const attendance = await Attendance.find({ userId: req.params.userId })
      
     .populate('userId', 'name email userType')
     .sort({ attendanceDate: -1 })
     //.exec();
     console.log("Fetched Attendance from DB:", attendance); // 👈 ADD THIS
      res.json(attendance);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching user attendance' });
    }
  });

  app.get('/attendance/all', async (req, res) => {
    try {
      const { userType, name, attendanceDate } = req.query;
  
      // Step 1: Get all attendance records with populated user data
      const attendanceRecords = await Attendance.find({})
        .populate('userId', 'name email userType')
        .sort({ attendanceDate: -1 });
  
      // Step 2: Filter records manually based on userType, name, and attendanceDate
      const filtered = attendanceRecords.filter(record => {
        if (!record.userId) return false; // skip orphaned records
  
        let matches = true;
  
        // Filter by userType if provided
        if (userType && record.userId.userType !== userType) {
          matches = false;
        }
  
        // Filter by name if provided (case-insensitive substring match)
        if (name && !record.userId.name.toLowerCase().includes(name.toLowerCase())) {
          matches = false;
        }
  
        // Filter by attendanceDate if provided
        if (attendanceDate) {
          const filterDate = new Date(attendanceDate);
          filterDate.setHours(0, 0, 0, 0);
  
          const recordDate = new Date(record.attendanceDate);
          recordDate.setHours(0, 0, 0, 0);
  
          if (recordDate.getTime() !== filterDate.getTime()) {
            matches = false;
          }
        }
  
        return matches;
      });
  
      res.json(filtered);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Route to apply for casual leave (NEW)
app.post('/apply-casual-leave', async (req, res) => {
  const { userId, leaveDate } = req.body; // leaveDate should be in YYYY-MM-DD format
  const MAX_CASUAL_LEAVES_PER_MONTH = 2; // Define max leaves here

  if (!userId || !leaveDate) {
    return res.status(400).json({ message: 'User ID and leave date are required.' });
  }

  try {
    const user = await mymodel.findById(userId);
    if (!user || user.userType !== 'Teacher') {
      return res.status(403).json({ message: 'Only teachers can apply for casual leave.' });
    }

    const parsedLeaveDate = new Date(leaveDate);
    if (isNaN(parsedLeaveDate.getTime())) {
      return res.status(400).json({ message: 'Invalid leave date format.' });
    }
    parsedLeaveDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day UTC

    // Check if leave already applied for this date
    const existingLeave = await Leave.findOne({
      userId: user._id,
      leaveDate: parsedLeaveDate,
      leaveType: 'Casual Leave'
    });

    if (existingLeave) {
      return res.status(400).json({ message: 'Casual leave already applied for this date.' });
    }

    // Check how many casual leaves taken this month
    const startOfMonth = new Date(Date.UTC(parsedLeaveDate.getFullYear(), parsedLeaveDate.getMonth(), 1));
    const endOfMonth = new Date(Date.UTC(parsedLeaveDate.getFullYear(), parsedLeaveDate.getMonth() + 1, 0, 23, 59, 59, 999));

    const leavesThisMonth = await Leave.countDocuments({
      userId: user._id,
      leaveType: 'Casual Leave',
      leaveDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    if (leavesThisMonth >= MAX_CASUAL_LEAVES_PER_MONTH) {
      return res.status(400).json({ message: `Maximum ${MAX_CASUAL_LEAVES_PER_MONTH} casual leaves allowed per month.` });
    }

    // Record the new casual leave
    const newLeave = new Leave({
      userId: user._id,
      leaveDate: parsedLeaveDate,
      leaveType: 'Casual Leave'
    });
    await newLeave.save();

    res.status(201).json({ message: 'Casual leave applied successfully!', newLeave });

  } catch (error) {
    console.error('Error applying casual leave:', error);
    res.status(500).json({ message: 'Server error applying casual leave.' });
  }
});

  

app.get('/attendance/summary', async (req, res) => {
  try {
    const { userType, name, month, startDate, endDate, userId } = req.query;

    let userFilter = {};

    if (userId) {
      userFilter._id = userId;
    } else {
      userFilter.userType = { $ne: 'Admin' };
      if (userType) {
        userFilter.userType = userType;
      }
      if (name) {
        userFilter.name = { $regex: name, $options: 'i' };
      }
    }

    const users = await mymodel.find(userFilter).sort({ name: 1 }).lean();

    if (users.length === 0) {
      return res.json([]);
    }

    const userIds = users.map(u => u._id);

    // Determine the date range for both attendance and leaves
    let startPeriod, endPeriod;
    if (month) {
      const [year, monthPart] = month.split('-');
      startPeriod = new Date(Date.UTC(parseInt(year), parseInt(monthPart) - 1, 1));
      endPeriod = new Date(Date.UTC(parseInt(year), parseInt(monthPart), 0, 23, 59, 59, 999));
    } else if (startDate && endDate) {
      startPeriod = new Date(startDate);
      endPeriod = new Date(endDate);
      endPeriod.setUTCHours(23, 59, 59, 999);
    } else {
      // Default to current month if no filters are provided
      const today = new Date();
      startPeriod = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
      endPeriod = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999));
    }

    const attendanceFilter = {
      userId: { $in: userIds },
      attendanceDate: { $gte: startPeriod, $lte: endPeriod }
    };

    const leaveFilter = {
      userId: { $in: userIds },
      leaveType: 'Casual Leave', // Only count casual leaves
      leaveDate: { $gte: startPeriod, $lte: endPeriod }
    };

    const attendanceRecords = await Attendance.find(attendanceFilter)
      .populate('userId', 'name email userType')
      .lean();

    const leaveRecords = await Leave.find(leaveFilter) // Fetch leave records
      .populate('userId', 'name email userType') // Populate to get user details for mapping
      .lean();

    const attendanceMap = {};
    // Initialize map with attendance counts
    for (const record of attendanceRecords) {
      const user = record.userId;
      if (!user || !user.email) continue;

      if (!attendanceMap[user.email]) {
        attendanceMap[user.email] = {
          daysPresent: 0,
          presentDates: new Set(),
          casualLeavesTaken: 0, // Initialize casual leaves for each user
        };
      }
      //attendanceMap[user.email].presentDates.add(new Date(record.attendanceDate).toDateString());
      if (record.attendanceStatus === "Accepted") {
    attendanceMap[user.email].presentDates.add(
        new Date(record.attendanceDate).toDateString()
    );
}
    }

    // Add casual leave counts to the map, specifically for teachers
    for (const leave of leaveRecords) {
      const user = leave.userId;
      // Ensure it's a teacher and the leave is casual leave
      if (!user || !user.email || user.userType !== 'Teacher' || leave.leaveType !== 'Casual Leave') continue;

      if (!attendanceMap[user.email]) {
        // This case should ideally not happen if users are correctly filtered,
        // but good for robustness if a teacher has only leaves and no attendance
        attendanceMap[user.email] = {
          daysPresent: 0,
          presentDates: new Set(),
          casualLeavesTaken: 0,
        };
      }
      attendanceMap[user.email].casualLeavesTaken = (attendanceMap[user.email].casualLeavesTaken || 0) + 1;
    }


    const summary = users.map(user => {
      const userAttendance = attendanceMap[user.email] || {
        daysPresent: 0,
        presentDates: new Set(),
        casualLeavesTaken: 0,
      };
      return {
        name: user.name,
        email: user.email,
        userType: user.userType,
        _id: user._id,
        daysPresent: userAttendance.presentDates.size,
        presentDates: Array.from(userAttendance.presentDates),
        casualLeavesTaken: userAttendance.casualLeavesTaken, // Include casualLeavesTaken
      };
    });

    res.json(summary);
  } catch (err) {
    console.error('Error fetching attendance summary:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/user/:id', async (req, res) => {
  try {
    const user = await mymodel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/user/:id', async (req, res) => {
    const userIdToDelete = req.params.id;

    try {
        // 1. Find the user to get their image filename and email
        const user = await mymodel.findById(userIdToDelete);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const userEmail = user.email;
        const userName = user.name;
        const userImageFilename = user.userImage;
        const userType = user.userType;

        // 2. Delete user from the database
        await mymodel.findByIdAndDelete(userIdToDelete);
        console.log(`✅ User profile ${userName} (${userIdToDelete}) deleted from DB.`);

        // 3. Delete associated attendance records
        const attendanceDeleteResult = await Attendance.deleteMany({ userId: userIdToDelete });
        console.log(`✅ Deleted ${attendanceDeleteResult.deletedCount} attendance records for user ${userIdToDelete}.`);

        // 4. Delete associated leave records
        const leaveDeleteResult = await Leave.deleteMany({ userId: userIdToDelete });
        console.log(`✅ Deleted ${leaveDeleteResult.deletedCount} leave records for user ${userIdToDelete}.`);

        // 5. Delete profile picture from uploads folder
        if (userImageFilename) {
            const filePath = path.join(directoryPath, userImageFilename);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`❌ Error deleting profile picture file ${userImageFilename}:`, err);
                    // Continue execution even if file deletion fails, as DB records are gone
                } else {
                    console.log(`✅ Profile picture file ${userImageFilename} deleted.`);
                }
            });
        }

        // 6. Send registration cancellation email
        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: userEmail,
            subject: 'FACADE Account Deletion Confirmation',
            html: `
                <p>Dear ${userName},</p>
                <p>This email confirms that your FACADE account, associated with the email <strong>${userEmail}</strong> and user type <strong>${userType}</strong>, has been successfully deleted as per your request or administrative action.</p>
                <p>All your associated records, including attendance and leave data, have also been removed from our system.</p>
                <p>If you believe this was an error, please contact the system administrator immediately.</p>
                <p>Regards,</p>
                <p>The FACADE Team</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Account deletion confirmation email sent to ${userEmail}`);
        } catch (emailError) {
            console.error(`❌ Error sending deletion confirmation email to ${userEmail}:`, emailError);
            // Continue execution even if email sending fails
        }

        res.status(200).json({ message: 'User profile and all associated data deleted successfully.' });

    } catch (error) {
        console.error('Error during user profile deletion:', error);
        res.status(500).json({ message: 'Server error during profile deletion.' });
    }
});


// Example route: POST /verify-admin
app.post('/verify-admin', async (req, res) => {
  const { userId, passkey } = req.body;

  const correctPasskey = process.env.ADMIN_PASSKEY; // Replace with env in production

  try {
    const user = await mymodel.findById(userId); // ✅ FIXED

    if (!user || user.userType !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not an admin user' });
    }

    if (passkey === correctPasskey) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: 'Incorrect passkey' });
    }
  } catch (err) {
    console.error('Error in /verify-admin:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// New route: PUT /update-user/:id to update user profile
app.put('/update-user/:id', async (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, userType } = req.body;

  try {
    const updatedUser = await mymodel.findByIdAndUpdate(
      userId,
      { name, email, phone, userType },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
  


// NEW ROUTE: For fetching raw attendance data for the graph
app.get('/attendance/graph-data', async (req, res) => {
  try {
    const { userType, name, userId } = req.query;

    let userFilter = {};

    if (userId) {
      userFilter._id = userId;
    } else {
      userFilter.userType = { $ne: 'Admin' };
      if (userType) {
        userFilter.userType = userType;
      }
      if (name) {
        userFilter.name = { $regex: name, $options: 'i' };
      }
    }

    const users = await mymodel.find(userFilter).lean();
    const userIds = users.map(u => u._id);

    if (userIds.length === 0) {
      return res.json([]);
    }

    // Ensure 'name' is populated so frontend can access record.userId.name
    const attendanceRecords = await Attendance.find({
      userId: { $in: userIds }
    })
    .populate('userId', 'name') // CRITICAL FIX: Ensure 'name' is included in population
    .lean();

    res.json(attendanceRecords);
  } catch (err) {
    console.error('Error fetching graph data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get("/",cors(),(req,res)=>{

})




connectDb();


const startServer = async () => {
  try {
    await connectDb();

    app.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

    await cleanupOrphans();

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
/*app.listen(port, async () => {
  console.log(`✅ Server running on port ${port}`);

  try {
    const existingUserIds = await mymodel.find().distinct('_id');
    const result = await Attendance.deleteMany({ userId: { $nin: existingUserIds } });
    console.log(`🧹 Deleted ${result.deletedCount} orphaned attendance records`);
  } catch (err) {
    console.error('Auto-cleanup error:', err);
  }
});*/

const express= require('express');
const router = express.Router();
const multer = require("multer");
const Reg = require("../model/model1")
//const mongoose=require("mongoose")
//const connectDb = require('../db1/config')
const nodemailer = require('nodemailer'); 
const cloudinary = require("../config1/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
/*mongoose.connect("mongodb://localhost:27017/faceRecDb")
.then(()=>{
    console.log("mongodb connected");
})
.catch(()=>{
    console.log('failed');
})

connectDb()*/

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    requireTLS: true,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000
});
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ EMAIL TRANSPORTER ERROR:", error);
    } else {
        console.log("✅ EMAIL TRANSPORTER READY");
    }
});

/*const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "../frontend/public/uploads");
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    }
})

const upload = multer({storage: storage});*/
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "facade-users",
        allowed_formats: ["jpg", "jpeg", "png"],
        public_id: (req, file) => {
            return Date.now() + "-" + file.originalname.split(".")[0];
        }
    }
});

const upload = multer({ storage });

router.post("/faceregister", upload.single("userImage") ,  async(req, res) => {
    try {
        console.log("Uploaded file:", req.file);

        if (!req.file) {
            return res.status(400).json({
                message: "Image upload failed. Please try again."
            });
        }

        console.log("Cloudinary URL:", req.file.path);
        const { name, email, phone, userType } = req.body; // Destructure all fields from body
        const userImage = req.file ? req.file.path : null; // Get filename from uploaded file
        const userImagePublicId = req.file ? req.file.filename : null;

        // --- NEW: Check for existing email ---
        const existingUserByEmail = await Reg.findOne({ email: email });
        if (existingUserByEmail) {
            console.log(`Registration failed: Email ID ${email} already exists.`);
            return res.status(400).json({ message: 'Email ID already registered. Please use a different email.' });
        }

        // --- NEW: Check for existing phone number ---
        const existingUserByPhone = await Reg.findOne({ phone: phone });
        if (existingUserByPhone) {
            console.log(`Registration failed: Phone number ${phone} already exists.`);
            return res.status(400).json({ message: 'Phone number already registered. Please use a different phone number.' });
        }
   const newUser = new Reg({
     name: req.body.name,
     email: req.body.email,
     phone: req.body.phone,
     userType: req.body.userType,
     userImage: userImage,
     userImagePublicId: userImagePublicId
    
   });

   await newUser.save();

     console.log('User registered successfully:', newUser.email);

     // --- Send Registration Confirmation Email (NEW LOGIC) ---
        const mailOptions = {
            from: process.env.ADMIN_EMAIL, // Sender address (your admin email from .env)
            to: newUser.email,             // Recipient's email (the newly registered user)
            subject: 'Welcome to FACADE - Registration Successful!',
            html: `
                <p>Dear ${newUser.name},</p>
                <p>Thank you for registering with FACADE as a <strong>${newUser.userType}</strong>!</p>
                <p>Your account details are:</p>
                <ul>
                    <li><strong>Email:</strong> ${newUser.email}</li>
                    <li><strong>Phone:</strong> ${newUser.phone}</li>
                    <li><strong>User Type:</strong> ${newUser.userType}</li>
                </ul>
                 ${newUser.userType === 'Admin' ? `
                 <hr>

                <h3>🔐 Administrator Access</h3>

             <p>
                     Since you registered as an Admin, you will need the
                    following Admin Passkey to access attendance records:
            </p>

                <h2>${process.env.ADMIN_PASSKEY}</h2>

                <p>
                Please keep this passkey confidential. Do not share it
                publicly.
                </p>
    `       : ''}
                <p>You can now log in to the system using your registered face.</p>
                <p>Welcome aboard!</p>
                <p>Regards,</p>
                <p>The FACADE Team</p>
            `
        };

        // Send success response immediately
res.status(201).json({
    message: 'Registered successfully!'
});

console.log(`🚀 Registration response sent for ${newUser.email}`);

// Send email after responding to frontend
try {
    await transporter.sendMail(mailOptions);

    console.log(
        `📧 Registration confirmation email sent to ${newUser.email}`
    );

} catch (emailError) {
    console.error(
        `❌ Error sending registration email to ${newUser.email}:`,
        emailError
    );
}
    } catch (err) {
        console.error('Error during registration (catch block):', err);
        // Generic error for other issues during save, as specific duplicates are handled above
        res.status(500).json({ message: 'Server error during registration. Please try again.' });
    }
});

module.exports = router;
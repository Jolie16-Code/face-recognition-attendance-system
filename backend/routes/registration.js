const express = require('express');
const router = express.Router();
const multer = require("multer");
const Reg = require("../model/model1");
const { sendEmail } = require("../emailService");
const cloudinary = require("../config1/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary storage configuration
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


// ===============================
// USER REGISTRATION
// ===============================

router.post(
    "/faceregister",
    upload.single("userImage"),
    async (req, res) => {

        try {
            console.log("Uploaded file:", req.file);

            // Check image upload
            if (!req.file) {
                return res.status(400).json({
                    message: "Image upload failed. Please try again."
                });
            }

            console.log("Cloudinary URL:", req.file.path);

            const { name, email, phone, userType } = req.body;

            const userImage = req.file.path;
            const userImagePublicId = req.file.filename;


            // ===============================
            // CHECK EXISTING EMAIL
            // ===============================

            const existingUserByEmail = await Reg.findOne({
                email: email
            });

            if (existingUserByEmail) {
                console.log(
                    `Registration failed: Email ID ${email} already exists.`
                );

                return res.status(400).json({
                    message:
                        "Email ID already registered. Please use a different email."
                });
            }


            // ===============================
            // CHECK EXISTING PHONE
            // ===============================

            const existingUserByPhone = await Reg.findOne({
                phone: phone
            });

            if (existingUserByPhone) {
                console.log(
                    `Registration failed: Phone number ${phone} already exists.`
                );

                return res.status(400).json({
                    message:
                        "Phone number already registered. Please use a different phone number."
                });
            }


            // ===============================
            // CREATE NEW USER
            // ===============================

            const newUser = new Reg({
                name: name,
                email: email,
                phone: phone,
                userType: userType,
                userImage: userImage,
                userImagePublicId: userImagePublicId
            });

            await newUser.save();

            console.log(
                "User registered successfully:",
                newUser.email
            );


            // ===============================
            // REGISTRATION EMAIL
            // ===============================

            const mailOptions = {
                to: newUser.email,

                subject:
                    "Welcome to FACADE - Registration Successful!",

                html: `
                    <p>Dear ${newUser.name},</p>

                    <p>
                        Thank you for registering with FACADE as a
                        <strong>${newUser.userType}</strong>!
                    </p>

                    <p>Your account details are:</p>

                    <ul>
                        <li>
                            <strong>Email:</strong>
                            ${newUser.email}
                        </li>

                        <li>
                            <strong>Phone:</strong>
                            ${newUser.phone}
                        </li>

                        <li>
                            <strong>User Type:</strong>
                            ${newUser.userType}
                        </li>
                    </ul>

                    ${
                        newUser.userType === 'Admin'
                            ? `
                                <hr>

                                <h3>🔐 Administrator Access</h3>

                                <p>
                                    Since you registered as an Admin,
                                    you will need the following Admin
                                    Passkey to access attendance records:
                                </p>

                                <h2>${process.env.ADMIN_PASSKEY}</h2>

                                <p>
                                    Please keep this passkey confidential.
                                    Do not share it publicly.
                                </p>
                            `
                            : ''
                    }

                    <p>
                        You can now log in to the system using
                        your registered face.
                    </p>

                    <p>Welcome aboard!</p>

                    <p>Regards,</p>
                    <p>The FACADE Team</p>
                `
            };


            // ===============================
            // SEND SUCCESS RESPONSE
            // ===============================

            res.status(201).json({
                message: "Registered successfully!"
            });

            console.log(
                `🚀 Registration response sent for ${newUser.email}`
            );


            // ===============================
            // SEND EMAIL USING RESEND
            // ===============================

            const emailResult = await sendEmail({
                to: newUser.email,
                subject: mailOptions.subject,
                html: mailOptions.html
            });

            if (emailResult.success) {

                console.log(
                    `📧 Registration confirmation email sent to ${newUser.email}`
                );

            } else {

                console.error(
                    `❌ Registration email failed for ${newUser.email}`
                );
            }

        } catch (err) {

            console.error(
                "Error during registration (catch block):",
                err
            );

            return res.status(500).json({
                message:
                    "Server error during registration. Please try again."
            });
        }
    }
);


module.exports = router;
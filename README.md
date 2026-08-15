# FACADE — Face Recognition Attendance System

> A full-stack, automated attendance management system built with the MERN stack and real-time face recognition.

FACADE is a web-based face recognition attendance system designed to automate attendance marking through facial verification. The application provides separate workflows for users and administrators, stores attendance records in MongoDB, and automates attendance-related email notifications.

## 🌐 Live Demo

[Launch FACADE](https://face-recognition-attendance-system-eosin-eight.vercel.app/)

The application is deployed and accessible through Vercel.

## ✨ Features

- 🔐 **Face Recognition Authentication**
  - Detects and recognizes registered users through a live camera feed.
  - Uses facial descriptors for identity verification.

- 📝 **User Registration**
  - Stores user details including name, email, phone, user type and profile image.
  - Generates and stores facial descriptors for future recognition.

- 📸 **Camera-Based Attendance**
  - Users can mark attendance through real-time facial recognition.
  - Eliminates the need for manual attendance entry.

- ⏰ **Automated Attendance Status**
  - Attendance is evaluated based on the time of check-in.
  - Supports `Accepted`, `Late`, and `Weekend` statuses.

- 👨‍💼 **Admin Panel**
  - Provides administrative access for managing users and attendance records.

- 📧 **Automated Email Notifications**
  - Sends attendance-related email notifications automatically.

- ☁️ **Cloud Image Storage**
  - Supports Cloudinary for storing registered profile images.

- 📱 **Responsive Interface**
  - Designed for desktop and mobile screen sizes.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Face Recognition | face-api.js |
| HTTP Client | Axios |
| Routing | React Router |
| Image Storage | Cloudinary |
| Email Service | Nodemailer |
| Deployment | Vercel / Render |

## 🔄 How It Works

```text
User Registration
       ↓
Capture Face
       ↓
Generate Facial Descriptor
       ↓
Store User + Descriptor
       ↓
Live Camera Verification
       ↓
Match Registered Face
       ↓
Identity Verified
       ↓
Attendance Recorded
       ↓
Email Notification
```

## 🚀 Deployment

### Frontend

The frontend is deployed on Vercel.

**Live Application:**  
https://face-recognition-attendance-system-eosin-eight.vercel.app/

### Backend

The backend is deployed separately and communicates with the frontend through REST APIs.

### Supporting Services

- MongoDB Atlas — database
- Cloudinary — image storage
- Nodemailer — email notifications

##  Author

**Debanjali Adhikary**

MCA Student | Full-Stack Development | Data Analytics | Machine Learning

##  Acknowledgement

This project would not have been possible without the support, collaboration, and contributions of my graduation project team members.

A heartfelt thanks to **Aditi Saha, Priyanjali Baidya, and Rishita Das** for their valuable contributions, teamwork, and support throughout the development of this project.

It was a wonderful experience learning, building, and completing this project together. 

##  Feedback
I'd love for you to try out **FACADE** and share your feedback!
You can:
- 📝 Register as a **Student, Teacher, or Admin**
- 📸 Upload your profile picture and complete registration
- 🔐 Log in using **face recognition**
- 📊 Explore the attendance management features
- 📧 Experience the automated email notifications

If you try the application, I'd really appreciate your feedback on the **user experience, functionality, and overall design**. Your suggestions will help me improve the project further.

**Thank you for taking the time to explore FACADE!

##  License

This project is intended for educational and portfolio purposes.

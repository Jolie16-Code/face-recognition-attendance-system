// src/components/RegistrationForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../config';







const Register = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userImage: null,
  });

  const [userType, setuserType] = useState('');

  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      userImage: e.target.files[0],
    });
  };

  // NEW: Email validation function
  const isValidEmail = (email) => {
    // Regex to check for @ and ends with .com or .co.in
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|co\.in)$/i;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
     // NEW: Perform email validation before proceeding
    if (!isValidEmail(formData.email)) {
      setMessage('Invalid email format. Email must contain "@" and end with ".com" or ".co.in".');
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 5000); // Clear message after 5 seconds
      return; // Stop the submission
    }

    // Phone number validation (optional: you could add regex for phone numbers too)
    // For now, relying on backend for phone existence check and browser's type="tel" for basic input.
    // Basic length check for phone number
    if (!formData.phone || formData.phone.length < 10) {
        setMessage('Please enter a valid phone number ( 10 digits).'); // Added a more descriptive message
        setIsSubmitting(false);
        setTimeout(() => setMessage(''), 5000);
        return;
    }


    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('userType', userType);
    data.append('userImage', formData.userImage);
   

    try {
      const response = await axios.post(`${BASE_URL}/faceregister`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data.message);
     
      setTimeout(() => {
        if (onSuccess) onSuccess();
        //navigate('/');
      }, 2000);
    
    } catch (error) {
      // THIS CATCH BLOCK HANDLES ERRORS COMING *FROM THE BACKEND*
      // (e.g., "Email ID already registered" or general server errors)
      if (error.response && error.response.data && error.response.data.message) {
        const backendMessage = error.response.data.message;
        if (backendMessage.includes('Email ID already registered')) {
          setMessage('This email ID is already registered. Please use a different email.');
        } else if (backendMessage.includes('Phone number already registered')) {
          setMessage('This phone number is already registered. Please use a different phone number.');
        } else {
          setMessage(`Registration failed: ${backendMessage}`);
        }
      } else {
        setMessage('Error registering your profile. Please try again.');
      }
      setTimeout(() => setMessage(''), 5000);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='contain'>
    <div className='formcontainer'>
      <h2>Registration</h2>
      {/* Added dynamic class for error messages */}
        {message && <p className={message.includes('Error') || message.includes('Invalid') || 
            message.includes('failed') || 
            message.includes('Please')  || 
            message.includes('already')   ? 'error-message' : 'success-message'}>{message}</p>}
      <form onSubmit={handleSubmit} >
        <input className='inputFields'
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        ></input>
        <input className='inputFields'
          type="email"
          name="email"
          placeholder="Email ID"
          value={formData.email}
          onChange={handleChange}
          required
        ></input>
        <input className='inputFields'
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        ></input> 
         <div className="user-type-options">

  <label className="user-type-option">
    <input
      type="radio"
      name="teacher"
      checked={userType === 'Admin'}
      value="Admin"
      onChange={(e) => setuserType(e.target.value)}
      required
    />
    <span>Admin</span>
  </label>

  <label className="user-type-option">
    <input
      type="radio"
      name="teacher"
      checked={userType === 'Teacher'}
      value="Teacher"
      onChange={(e) => setuserType(e.target.value)}
      required
    />
    <span>Teacher</span>
  </label>

  <label className="user-type-option">
    <input
      type="radio"
      name="teacher"
      checked={userType === 'Student'}
      value="Student"
      onChange={(e) => setuserType(e.target.value)}
      required
    />
    <span>Student</span>
  </label>

</div> 
       <label className="upload-label"> 
        <input className='inputFields'
          type="file"
          name="userImage"
          accept=".jpg,.jpeg,.png"
          onChange={handleFileChange}
          required
        ></input> ***Upload profile pic: JPG, JPEG & PNG only*** </label><br></br> <br></br>
        <button type="submit" className='reg2Bttn' disabled={isSubmitting}>{isSubmitting ? (
    <>
      <span className="spinner"></span>
      Registering...
    </>
  ) : (
    'Save'
  )}</button><br></br>
      </form>
    </div>
    </div>
  );
};

export default Register;

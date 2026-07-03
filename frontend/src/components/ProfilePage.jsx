import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ImSwitch } from "react-icons/im";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const { state } = useLocation();
  const imageName = state?.imageName;
  const detectedMood = state?.detectedMood;
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [moodMessage, setMoodMessage] = useState('');
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [showPasskeyPrompt2, setShowPasskeyPrompt2] = useState(false);
  const [adminPasskey, setAdminPasskey] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://localhost:8001/find-user?image=${imageName}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setEditedUser({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            userType: userData.userType,
          });
        } else {
          console.error('User not found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (imageName) {
      fetchUserProfile();
    }
  }, [imageName]);

  const dynamicQuotes = {
    happy: ["😀 Keep smiling, because life is a beautiful thing!", "😀 Happiness is not by chance, but by choice.", "😀 The best way to predict the future is to create it."],
    sad: ["🥺 Every day may not be good, but there's something good in every day. Stay strong , you got this!", "🥺 When one door of happiness closes, another opens.", "🥺 Sadness flies away on the wings of time."],
    angry: ["😠 Anger is a wind which blows out the lamp of the mind.", "😠 The best way to calm yourself is to think before you act.", "😠 Let your smile change the world, but don't let the world change your smile.", "😠 Anger is never without a reason, but seldom with a good one."],
    neutral: ["😐 Stay calm, be determined. Great things are coming!", "😐 In the middle of difficulty lies opportunity.", "😐 The best way to predict your future is to create it."],
    surprised: ["😯 Surprises make life more interesting. Stay curious!", "😯 You never know what life is going to throw at you.", "😯 Surprise is the greatest gift which life can grant us."],
    fearful: ["😨Courage doesn't mean you don't get afraid. Courage means you don't let fear stop you.", "😨 Be fearless. Fearless isn't not having fears, it is having a lot of fears, but you jump anyway.", "😨 Fear is a natural reaction to moving closer to the truth.", "😨 Do one thing every day that scares you."],
    disgusted: ["🤢 Focus on the good. Let negativity slide away.", "🤢 Life is too important to be taken seriously.", "🤢 Don’t let negative people drag you down."]
  };

  const getRandomQuote = (mood) => {
    const quotes = dynamicQuotes[mood];
    if (!quotes) return "Keep going, you're doing amazing!";
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  useEffect(() => {
    if (detectedMood) {
      setMoodMessage(getRandomQuote(detectedMood));
    }
  }, [detectedMood]);

  const verifyPasskey = async () => {
    try {
      const response = await fetch('http://localhost:8001/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, passkey: adminPasskey }),
      });

      const data = await response.json();

      if (data.success) {
        setShowPasskeyPrompt(false);
        navigate('/attend', { state: { isAdminView: true } });
      } else {
        alert(data.message || 'Incorrect passkey');
      }
    } catch (err) {
      console.error('Error verifying admin:', err);
      alert('Something went wrong. Try again.');
    }
  };
   const verifyPasskey2 = async () => {
    try {
      const response = await fetch('http://localhost:8001/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, passkey: adminPasskey }),
      });

      const data = await response.json();

      if (data.success) {
        setShowPasskeyPrompt2(false);
        navigate('/summary', { state: { isAdminView: true } });
      } else {
        alert(data.message || 'Incorrect passkey');
      }
    } catch (err) {
      console.error('Error verifying admin:', err);
      alert('Something went wrong. Try again.');
    }
  };

  const goToAttendance = () => {
    if (!user) return;
    if (user.userType === 'Admin') {
      setShowPasskeyPrompt(true);
    } else {
      navigate('/attend', { state: { userId: user._id } });
    }
  };
  const goToAttendancesummary = () => {
    if (!user) return;
    if (user.userType === 'Admin') {
      setShowPasskeyPrompt2(true);
    } else {
      navigate('/summary', { state: { userId: user._id, isAdminView: false, userType: user.userType }}); // Pass userId and explicitly set isAdminView to false
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8001/update-user/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedUser),
      });
  
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        toast.success('✅ Profile updated successfully!');
      } else {
        toast.error('❌ Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('⚠️ An error occurred while updating the profile.');
    }
  };
  

  return (
    <div className="profile-wrapper">

      <div className={`menu-dots ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <span></span><span></span><span></span>
      </div>

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="logbttn"><Link to="/" ><ImSwitch className="text-white" /></Link></button>
        <button onClick={goToAttendance} className="attbttn">View Attendance</button>
        <button onClick={() => setIsEditing(true)} className="attbttn">Update Profile</button>
        <button onClick={goToAttendancesummary} className="attbttn">Summary</button>
      </div>

      <div className='profilecontainer'>
        <h2 className="welcome-message">Welcome !</h2>

        {user ? (
          <div className='userprofile'>
            <img className='userimg' src={`/uploads/${user.userImage}`} alt={user.name} />

            {isEditing ? (
              <div className="edit-profile-form">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={editedUser.name}
                  onChange={handleInputChange}
                />

                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editedUser.email}
                  onChange={handleInputChange}
                />

                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editedUser.phone}
                  onChange={handleInputChange}
                />

                <label>User Type</label>
                <select
                  name="userType"
                  value={editedUser.userType}
                  onChange={handleInputChange}
                >
                  <option value="Admin">Admin</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Student">Student</option>
                  
                </select>

                <div style={{ marginTop: '10px' }}>
                  <button onClick={updateUserProfile}>Save</button>
                  <button onClick={() => setIsEditing(false)} style={{ marginLeft: '10px' , backgroundColor: 'red'}}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone}</p>
                <p><strong>User Type:</strong> {user.userType}</p>
              </>
            )}
          </div>
        ) : (
          <p>Loading user profile...</p>
        )}

        {detectedMood && (
          <div className={`usermood ${detectedMood}`}>
            <h2>Mood: {detectedMood}</h2>
            <div className="marquee"><p>{moodMessage}</p></div>
          </div>
        )}
      </div>

      {showPasskeyPrompt && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-button1" onClick={() => setShowPasskeyPrompt(false)}>×</button>
            <h3>Enter Admin Passkey</h3>
            <input
              type="password"
              value={adminPasskey}
              onChange={(e) => setAdminPasskey(e.target.value)}
              placeholder="Admin Passkey"
            />
            <div style={{ marginTop: '1rem' }}>
              <button className="submit-button" onClick={verifyPasskey}>Submit</button>
              <button className="submit-button"  onClick={() => setShowPasskeyPrompt(false)} style={{ marginLeft: '10px'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showPasskeyPrompt2 && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-button1" onClick={() => setShowPasskeyPrompt2(false)}>×</button>
            <h3>Enter Admin Passkey</h3>
            <input
              type="password"
              value={adminPasskey}
              onChange={(e) => setAdminPasskey(e.target.value)}
              placeholder="Admin Passkey"
            />
            <div style={{ marginTop: '1rem' }}>
              <button className="submit-button" onClick={verifyPasskey2}>Submit</button>
              <button className="submit-button"  onClick={() => setShowPasskeyPrompt2(false)} style={{ marginLeft: '10px'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="top-center" autoClose={3000} />

    </div>
  );
};

export default ProfilePage;

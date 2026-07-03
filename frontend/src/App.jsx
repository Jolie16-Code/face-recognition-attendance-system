       
import React from 'react'
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Home from './components/Home'
import Register from './components/Register'
import ProfilePage from './components/ProfilePage'

import AttendancePage from './components/AttendancePage';
import Summary from './components/Summary';


function App() {
  return(
  
    <Router>
      <Routes>
        <Route path="/register" element={<Register/>}/>
        <Route path="/attend" element={<AttendancePage/>}/>
        <Route path="/summary" element={<Summary/>}/>
       
        <Route path="/profile" element={<ProfilePage/>} />
       
         <Route path="/"  element={<Home/>}/>
         
      </Routes>
      </Router>
      
  );
}

export default App;
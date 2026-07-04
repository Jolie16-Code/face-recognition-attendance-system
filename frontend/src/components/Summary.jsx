import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';

import jsPDF from 'jspdf';
import 'jspdf-autotable'; // This extends jsPDF with the autoTable method
// Register the necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);
import { BASE_URL } from '../config';
const Summary = () => {
  const { state } = useLocation();
   console.log("State received in Summary component:", state); 
    const { email, userId, isAdminView, userType: loggedInUserType } = state || {}; 
  const [records, setRecords] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [workingDays, setWorkingDays] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // State for editing user profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(''); // For success/error messages in popup

  const [selectedLeaveDate, setSelectedLeaveDate] = useState('');

  // Calculate today's date in YYYY-MM-DD format for the max attribute
  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];
  
   // State for casual leave messages and constant
  const [casualLeaveMessage, setCasualLeaveMessage] = useState('');
  const TOTAL_CASUAL_LEAVES_ALLOWED_FRONTEND = 2; // Max casual leaves per month for teachers

  // NEW STATES for Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  // Memoize chartOptions: This object will only be created once
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false, // Allows the chart to resize freely within its container
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'black' // Legend label color
        }
      },
      title: {
        display: true,
        text: 'Monthly Attendance Trends',
        color: 'black' // Title color
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y} days`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month',
          color: 'black'
        },
        stacked: false,
        ticks: {
          color: 'black' // X-axis label color
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)' // Light grid lines
        }
      },
      y: {
        title: {
          display: true,
          text: 'Days Present',
          color: 'black'
        },
        beginAtZero: true,
        stacked: false,
        ticks: {
          color: 'black',
          stepSize: 1 // Ensure whole numbers for days
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
    },
  }), []); // Empty dependency array: ensures it's created only once

  // Memoized function to fetch and set summary records for the table
  const fetchSummaryRecords = useCallback(() => {
    const query = new URLSearchParams();
    // If it's an admin, apply all filters, otherwise, filter by the current userId
    if (isAdminView) {
      if (userTypeFilter) query.append('userType', userTypeFilter);
      if (nameFilter) query.append('name', nameFilter);
      if (monthFilter) query.append('month', monthFilter);
      if (startDateFilter) query.append('startDate', startDateFilter);
      if (endDateFilter) query.append('endDate', endDateFilter);
    } else if (userId) { // For non-admin, only fetch their own records using userId
      query.append('userId', userId);
      // For non-admin, month/date filters might still apply to their own data
      if (monthFilter) query.append('month', monthFilter);
      if (startDateFilter) query.append('startDate', startDateFilter);
      if (endDateFilter) query.append('endDate', endDateFilter);
    } else {
      // If no userId and not admin, do not fetch
      setRecords([]);
      return;
    }


    const url = `${BASE_URL}/attendance/summary?${query.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error('Error fetching summary for table:', err));
  }, [userId, isAdminView, userTypeFilter, nameFilter, monthFilter, startDateFilter, endDateFilter]);


  // Memoized function to fetch and set individual attendance data for the graph
  const fetchGraphData = useCallback(() => {
    let graphQuery = new URLSearchParams();
    // Graph data should generally reflect the current user's context or a broad view
    // If isAdminView, apply admin filters. If not, apply logged-in user's userId.
    if (isAdminView) {
      if (userTypeFilter) graphQuery.append('userType', userTypeFilter);
      if (nameFilter) graphQuery.append('name', nameFilter);
    } else if (userId) {
      graphQuery.append('userId', userId);
    } else {
      setAllAttendanceData([]);
      return;
    }

    const graphUrl = `${BASE_URL}/attendance/graph-data?${graphQuery.toString()}`;

    fetch(graphUrl)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched Individual Attendance Records for Graph (from /graph-data):", data);
        setAllAttendanceData(data);
      })
      .catch((err) => console.error('Error fetching graph data from /graph-data:', err));
  }, [userId, isAdminView, userTypeFilter, nameFilter]);

  // Combined useEffect for initial data fetches and re-fetches based on filters
  useEffect(() => {
    fetchSummaryRecords(); // Call the memoized function for table data
    fetchGraphData();     // Call the memoized function for graph data
  }, [fetchSummaryRecords, fetchGraphData]); // Dependencies are the memoized fetch functions themselves


  const resetFilters = useCallback(() => {
    setUserTypeFilter('');
    setNameFilter('');
    setMonthFilter(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    setStartDateFilter('');
    setEndDateFilter('');
    setWorkingDays('');
  }, []);


  const handleViewProfile = useCallback(async (id) => { // 'id' is the parameter from the table row
    try {
      const response = await fetch(`${BASE_URL}/user/${id}`);
      const data = await response.json();
      setSelectedUser(data);
      setEditedUser(data); // Initialize editedUser with selectedUser data for editing
      setIsEditingProfile(false); // Start in view mode
      setShowPopup(true);
      setUpdateMessage(''); // Clear any previous update messages
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUpdateMessage('Error fetching user profile.');
    }
  }, []);


  const handleEditClick = useCallback(() => {
    setIsEditingProfile(true);
  }, []);


  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  }, []);


  const handleSaveChanges = useCallback(async () => {
    if (!editedUser || !editedUser._id) {
      setUpdateMessage('Error: No user selected for update.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/update-user/${editedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user profile.');
      }

      const updatedUser = await response.json();
      setSelectedUser(updatedUser);
      setIsEditingProfile(false);
      setUpdateMessage('Profile updated successfully!');

      fetchSummaryRecords();
      fetchGraphData();

      // Auto-close popup after 2 seconds
      setTimeout(() => {
        setShowPopup(false);
        setUpdateMessage('');
      }, 2000);

    } catch (error) {
      console.error('Error updating user profile:', error);
      setUpdateMessage(`Update failed: ${error.message}`);
    }
  }, [editedUser, fetchSummaryRecords, fetchGraphData]);


  const handleCancelEdit = useCallback(() => {
    setIsEditingProfile(false);
    setEditedUser(selectedUser);
    setUpdateMessage('');
  }, [selectedUser]);


  const getGraphData = useCallback(() => {
    if (!allAttendanceData || allAttendanceData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const userMonthlyAttendance = {};
    const allMonths = new Set();

    allAttendanceData.forEach(record => {
      if (!record || !record.attendanceDate || typeof record.attendanceDate !== 'string') {
        console.warn("Skipping record due to missing or invalid 'attendanceDate':", record);
        return;
      }

      // CRITICAL FIX: Ensure record.userId exists before accessing .name
      const userName = record.userId && record.userId.name; 
      if (!userName) {
        console.warn("Skipping record due to missing 'name' field in userId or missing userId object:", record);
        return;
      }

      const date = new Date(record.attendanceDate);

      if (isNaN(date.getTime())) {
        console.warn("Skipping record due to invalid date format:", record.attendanceDate);
        return;
      }

      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      if (!userMonthlyAttendance[userName]) {
        userMonthlyAttendance[userName] = {};
      }
      userMonthlyAttendance[userName][monthYear] = (userMonthlyAttendance[userName][monthYear] || 0) + 1;
      allMonths.add(monthYear);
    });

    if (Object.keys(userMonthlyAttendance).length === 0) {
      return { labels: [], datasets: [] };
    }

    const sortedMonths = Array.from(allMonths).sort((a, b) => new Date(a) - new Date(b));

    const datasets = Object.keys(userMonthlyAttendance)
      .filter(userName => {
        const totalAttendance = Object.values(userMonthlyAttendance[userName]).reduce((sum, count) => sum + count, 0);
        return totalAttendance > 0;
      })
      .map((userName, index) => {
        const data = sortedMonths.map(month => {
          return userMonthlyAttendance[userName][month] || 0;
        });

        const color = `hsl(${index * 50 % 360}, 70%, 50%)`;
        return {
          label: userName,
          data: data,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1,
        };
      });

    return {
      labels: sortedMonths,
      datasets: datasets,
    };
  }, [allAttendanceData]);

 // Calculate the student with the highest attendance for admin view
  const highestAttendanceStudentId = useMemo(() => {
    if (!isAdminView || !records.length || workingDays <= 0) {
      return []; // Only for admin, if records exist, and workingDays is valid
    }

    let maxAttendance = -1;
    let studentId = [];

    records.forEach(user => {
      if (user.userType === 'Student') { // Only consider students
        const daysPresent = user.daysPresent || 0;
        const currentAttendance = (daysPresent / workingDays) * 100;
        if (currentAttendance > maxAttendance) {
          maxAttendance = currentAttendance;
          studentId = [user._id];
        } else if (currentAttendance === maxAttendance && maxAttendance !== -1) {
        // If current attendance is equal to the max AND maxAttendance is not the initial -1
        studentId.push(user._id); // Add to the array
      }
      }
    });
    return studentId;
  }, [records, isAdminView, workingDays]);

   // Callback to handle applying for casual leave (for teachers)
  const handleApplyCasualLeave = useCallback(async () => {
  if (!userId || loggedInUserType !== 'Teacher') {
    setCasualLeaveMessage('Only teachers can apply for casual leave.');
    return;
  }

  const leaveDate = selectedLeaveDate || new Date().toISOString().split('T')[0];

  try {
    const response = await fetch(`${BASE_URL}/apply-casual-leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, leaveDate }),
    });

    const data = await response.json();
    if (response.ok) {
      setCasualLeaveMessage(data.message);
      fetchSummaryRecords(); // Re-fetch summary to update casual leave count in table
    } else {
      setCasualLeaveMessage(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Error applying casual leave:', error);
    setCasualLeaveMessage('Failed to apply casual leave. Server error.');
  }

  setTimeout(() => setCasualLeaveMessage(''), 5000);
}, [userId, loggedInUserType, selectedLeaveDate, fetchSummaryRecords]);

  // --- NEW: Delete Profile Handlers ---
  const handleDeleteClick = useCallback((user) => {
    setUserToDelete(user);
    setDeleteMessage(''); // Clear any previous delete messages
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!userToDelete || !userToDelete._id) {
      setDeleteMessage('Error: No user selected for deletion.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/user/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // You might add an Authorization header here for admin token if implementing later
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user profile.');
      }

      setDeleteMessage('User profile deleted successfully!');
      fetchSummaryRecords(); // Refresh table data
      fetchGraphData(); // Refresh graph data
     
      
      // Auto-close confirmation popup after a delay
      setTimeout(() => {
         setUserToDelete(null); // Clear user to delete
        setShowDeleteConfirm(false);
        setDeleteMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error deleting user profile:', error);
      setDeleteMessage(`Deletion failed: ${error.message}`);
      // Keep popup open for error message, maybe auto-close after longer timeout
      setTimeout(() => {
        setDeleteMessage('');
      }, 5000);
    }
  }, [userToDelete, fetchSummaryRecords, fetchGraphData]);

  const cancelDelete = useCallback(() => {
    setUserToDelete(null);
    setShowDeleteConfirm(false);
    setDeleteMessage('');
  }, []);

  // --- NEW: Export Handlers ---
  const handleExportCSV = useCallback(() => {
     console.log("Attempting to export CSV..."); // Debug log
    if (!records || records.length === 0) {
      alert("No data to export to CSV."); // Using alert as per previous guidance for temporary popups
      return;
    }

    const headers = [
      "Name", "User Type", "Days Present", "Attendance %", "Eligibility",
      "Casual Leave (Allowed)", "Casual Leave (Taken)"
    ];
    // Filter out _id, email, presentDates, and image from records for CSV export
    const csvRows = records.map(record => {
      const actualDaysPresent = record.daysPresent || 0;
      const casualLeavesTaken = record.casualLeavesTaken || 0;
      let daysForPercentageCalculation = actualDaysPresent;
      if (record.userType === 'Teacher') {
        daysForPercentageCalculation += casualLeavesTaken;
      }

      let attendancePercent;
      if (workingDays <= 0) {
        attendancePercent = '0.00%';
      } else {
        const rawPercentage = (daysForPercentageCalculation / workingDays) * 100;
        attendancePercent = `${Math.min(rawPercentage, 100).toFixed(2)}%`;
      }

      let eligibilityDisplay;
      if (record.userType === 'Teacher') {
        eligibilityDisplay = 'N/A';
      } else {
        const isEligible = parseFloat(attendancePercent) >= 75;
        eligibilityDisplay = isEligible ? 'Eligible' : 'Not Eligible';
      }

      // Format casual leave for CSV
      const casualLeaveInfoAllowed = record.userType === 'Teacher' ? TOTAL_CASUAL_LEAVES_ALLOWED_FRONTEND : 'N/A';
      const casualLeaveInfoTaken = record.userType === 'Teacher' ? casualLeavesTaken : 'N/A';

      return [
        record.name,
        record.userType,
        actualDaysPresent,
        attendancePercent,
        eligibilityDisplay,
        casualLeaveInfoAllowed,
        casualLeaveInfoTaken,
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Enclose in quotes, escape double quotes
    });

    const csvString = [
      headers.map(header => `"${header}"`).join(','), // Quote headers too
      ...csvRows
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection for download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'attendance_summary.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback for browsers that don't support download attribute
      alert("Your browser does not support downloading files directly. Please copy the data from the table manually.");
    }
  }, [records, workingDays, TOTAL_CASUAL_LEAVES_ALLOWED_FRONTEND]);

  const handleExportPDF = useCallback(() => {
     console.log("Attempting to export PDF..."); // Debug log
       console.log("Current records state for PDF:", records);
    if (!records || records.length === 0) {
       console.warn("No data to export to PDF.");
      alert("No data to export to PDF."); // Using alert for consistency
      return;
    }

    const doc = new jsPDF();
    
    
    const dateOptions = { day: '2-digit', month: '2-digit', year: '2-digit' };
    const formattedDate = new Date().toLocaleDateString('en-GB', dateOptions);

    // Add title
    doc.setFontSize(18);
    doc.text("Attendance Summary", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${formattedDate}`, 14, 28);
    doc.text(`Filters: User Type='${userTypeFilter || "All"}', Name='${nameFilter || "All"}'`, 14, 34);
    if (monthFilter) doc.text(`Month: ${monthFilter}`, 14, 40);
    if (startDateFilter && endDateFilter) doc.text(`Date Range: ${startDateFilter} to ${endDateFilter}`, 14, 46);
    if (workingDays) doc.text(`Total Working Days: ${workingDays}`, 14, 52);


    const head = [[
      "Name", "User Type", "Days Present", "Attendance %", "Eligibility",
      "Casual Leave (Taken)", "Casual Leave (Allowed)"
    ]];
    const body = records.map(record => {
      const actualDaysPresent = record.daysPresent || 0;
      const casualLeavesTaken = record.casualLeavesTaken || 0;
      let daysForPercentageCalculation = actualDaysPresent;
      if (record.userType === 'Teacher') {
        daysForPercentageCalculation += casualLeavesTaken;
      }

      let attendancePercent;
      if (workingDays <= 0) {
        attendancePercent = '0.00%';
      } else {
        const rawPercentage = (daysForPercentageCalculation / workingDays) * 100;
        attendancePercent = `${Math.min(rawPercentage, 100).toFixed(2)}%`;
      }

      let eligibilityDisplay;
      if (record.userType === 'Teacher') {
        eligibilityDisplay = 'N/A';
      } else {
        const isEligible = parseFloat(attendancePercent) >= 75;
        eligibilityDisplay = isEligible ? 'Eligible' : 'Not Eligible';
      }

      // Format casual leave for PDF
      const casualLeaveInfoTaken = record.userType === 'Teacher' ? `${casualLeavesTaken} days` : 'N/A';
      const casualLeaveInfoAllowed = record.userType === 'Teacher' ? `${TOTAL_CASUAL_LEAVES_ALLOWED_FRONTEND} days` : 'N/A';

      return [
        record.name,
        record.userType,
        actualDaysPresent,
        attendancePercent,
        eligibilityDisplay,
        casualLeaveInfoTaken,
        casualLeaveInfoAllowed,
      ];
    });

    console.log("PDF Table Head:", head);
    console.log("PDF Table Body:", body);

    // AutoTable options
    doc.autoTable({
      startY: 60, // Start table after the title and info
      head: head,
      body: body,
      theme: 'grid', // Add borders
      headStyles: {
        fillColor: [31, 80, 114], // Dark blue similar to your thStyle
        textColor: 255, // White
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: 'center',
        valign: 'middle',
        textColor: 0, // Black for body text
      },
      bodyStyles: {
        fillColor: [249, 249, 249], // Light gray for body
        // Alternate row colors if desired:
        // alternateRowStyles: { fillColor: [240, 240, 240] } 
      },
      columnStyles: {
        // You can set specific column widths here if needed
        // 0: { cellWidth: 30 }, // Name
        // 1: { cellWidth: 25 }, // User Type
        // etc.
      },
      didParseCell: function (data) {
        // Custom styling for Eligibility column based on content
        if (data.column.index === 4 && data.cell.section === 'body') { // Eligibility column is index 4
          if (data.cell.text.includes('Eligible')) {
            data.cell.styles.fillColor = [142, 209, 100]; // Light green
            data.cell.styles.textColor = 255; // White
          } else if (data.cell.text.includes('Not Eligible')) {
            data.cell.styles.fillColor = [255, 99, 71]; // Tomato red
            data.cell.styles.textColor = 255; // White
          }
        }
      },
    });

    doc.save('attendance_summary.pdf');
     console.log("PDF export initiated.");

  }, [records, userTypeFilter, nameFilter, monthFilter, startDateFilter, endDateFilter, workingDays, TOTAL_CASUAL_LEAVES_ALLOWED_FRONTEND]);


  return (
    <div className="attendanceLayout" style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Attendance Summary</h2>

      

      {/* Filter bar for Admin View */}
      {isAdminView && (
        <div
          className="filter-bar"
          style={{
            marginBottom: '20px',
            display: 'flex',
            gap: '87px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Search by name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            style={inputStyle}
          />
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            style={inputStyle}
          >
            <option value="">All</option>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
          </select>
          <input
            type="month"
            value={monthFilter}
            placeholder='Select Month'
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setStartDateFilter('');
              setEndDateFilter('');
            }}
            style={inputStyle}
          />

          <input
            type="date"
            value={startDateFilter}
            placeholder="Start Date"
            onChange={(e) => setStartDateFilter(e.target.value)}
            onFocus={() => setMonthFilter('')}
            style={inputStyle}
          />

          <input
            type="date"
            value={endDateFilter}
            placeholder="End Date"
            onChange={(e) => setEndDateFilter(e.target.value)}
            onFocus={() => setMonthFilter('')}
            max={todayDate}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="Total Working Days"
            value={workingDays}
            onChange={(e) => setWorkingDays(Number(e.target.value))}
            style={inputStyle}
          />

          <button onClick={resetFilters} style={buttonStyle}>
            Clear Filters
          </button>
          
        </div>
      )}
      {/* Filter bar for Non-Admin View */}
      {!isAdminView && (
        <div
          className="filter-bar"
          style={{
            marginBottom: '20px',
            display: 'flex',
            gap: '20px', // Adjusted gap for fewer elements
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center' // Center filters for non-admin
          }}
        >
          <input
            type="month"
            value={monthFilter}
            placeholder='Select Month'
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setStartDateFilter('');
              setEndDateFilter('');
            }}
            style={inputStyle}
          />

          <input
            type="date"
            value={startDateFilter}
            placeholder="Start Date"
            onChange={(e) => setStartDateFilter(e.target.value)}
            onFocus={() => setMonthFilter('')}
            style={inputStyle}
          />

          <input
            type="date"
            value={endDateFilter}
            placeholder="End Date"
            onChange={(e) => setEndDateFilter(e.target.value)}
            onFocus={() => setMonthFilter('')}
            max={todayDate}
            style={inputStyle}
          />

          {/* Moved workingDays input here for non-admin view */}
          <input
            type="number"
            placeholder="Total Working Days"
            value={workingDays}
            onChange={(e) => setWorkingDays(Number(e.target.value))}
            style={inputStyle}
          />

          <button onClick={resetFilters} style={buttonStyle}>
            Clear Filters
          </button>
        </div>
      )}

     



      <div className="table-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'hsl(19, 32%, 50%)' }}>
              {/* Name and User Type are always shown */}
              <th style={thStyle}>Name</th>
              <th style={thStyle}>User Type</th>
              <th style={thStyle}>Days Present</th>
              <th style={thStyle}>Attendance %</th>
              <th style={thStyle}>Eligibility</th>
               {isAdminView && <th style={thStyle}>Casual Leave</th>}
              {isAdminView && <th style={thStyle}>View Profile</th>} {/* Only show for admin */}
              {isAdminView && <th style={thStyle}>Delete Profile</th>} {/* NEW: Delete Profile column */}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={isAdminView ? "8" : "5"} style={{ textAlign: 'center', padding: '20px' }}>
                  No summary data found.
                </td>
              </tr>
            ) : (
              records.map((user, index) => {
                const actualDaysPresent = user.daysPresent || 0;
                // Get casual leaves taken from the user object (now provided by backend)
                const casualLeavesTaken = user.casualLeavesTaken || 0; 
                
                let daysForPercentageCalculation = actualDaysPresent;
                if (user.userType === 'Teacher') {
                    daysForPercentageCalculation += casualLeavesTaken;
                }

                let attendancePercent;
                if (workingDays <= 0) {
                  attendancePercent = 0;
                } else {
                  const rawPercentage = (daysForPercentageCalculation / workingDays) * 100;
                  attendancePercent = Math.min(rawPercentage, 100).toFixed(2);
                }
                // Determine eligibility display based on userType
                let eligibilityDisplay;
                let eligibilityColor;

                if (user.userType === 'Teacher') {
                  eligibilityDisplay = 'N/A';
                  eligibilityColor = 'white'; // Or any neutral color you prefer for N/A
                } else {
                  const isEligible = parseFloat(attendancePercent) >= 75;
                  eligibilityDisplay = isEligible ? 'Eligible' : 'Not Eligible';
                  eligibilityColor = isEligible ? 'hsla(132, 100.00%, 56.10%, 0.99)' : 'red'; // Green for Eligible, Red for Not Eligible
                }

                const presentDatesTooltip = user.presentDates?.length
                  ? user.presentDates.map(date =>
                      new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    ).join('\n')
                  : 'No records';
                  const isHighestAttendanceStudent = isAdminView && user.userType === 'Student' && highestAttendanceStudentId.includes(user._id);

                return (
                  <tr key={user._id}  title={isHighestAttendanceStudent ? "Student with highest attendance" : undefined}>
                    {/* Name and User Type are always shown */}
                    <td style={{...tdStyle,
                      color: isHighestAttendanceStudent ? 'yellow' : 'inherit',
                      fontWeight: isHighestAttendanceStudent ? 'bold' : 'normal'} }>{user.name}</td>
                    <td style={tdStyle}>{user.userType}</td>
                    <td style={tdStyle} title={presentDatesTooltip}>{user.daysPresent}</td>
                    <td style={tdStyle}>{attendancePercent}%</td>
                    {/* Apply the determined eligibility display and color */}
                    <td style={{ ...tdStyle, color: eligibilityColor , fontSize:'1.7rem' }}>
                      {eligibilityDisplay}
                    </td>

                    {isAdminView && (
                      <td style={tdStyle}>
                        {user.userType === 'Teacher' ? `Allowed: ${TOTAL_CASUAL_LEAVES_ALLOWED_FRONTEND} days, Taken: ${casualLeavesTaken} days` : 'N/A'}
                      </td>
                    )}

                    {isAdminView && ( // Only show "View Profile" for admin
                      <td style={tdStyle}>
                        <a
                          onClick={() => handleViewProfile(user._id)}
                          style={{ color: 'white', textDecoration: 'none', cursor: 'pointer' }}
                        >
                          Click here
                        </a>
                      </td>
                    )}
                    {isAdminView && ( // NEW: Delete Profile column for admin
                      <td style={tdStyle}>
                        <a
                          onClick={() => handleDeleteClick(user)}
                          style={{ color: 'red', textDecoration: 'none', cursor: 'pointer' }}
                        >
                          Click here
                        </a>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Apply Casual Leave Button for Teachers (only for non-admin teachers) */}
      {/* Moved to top-right corner with absolute positioning */}
      {!isAdminView && loggedInUserType === 'Teacher' && (
  <div style={{ textAlign: 'center', marginLeft: '20px', marginBottom: '20px' }}>
    <label htmlFor="leaveDate" style={{ marginRight: '10px', fontWeight: 'bold' }}>
      Select Leave Date:
    </label>
    <input
      type="date"
      id="leaveDate"
      value={selectedLeaveDate}
      onChange={(e) => setSelectedLeaveDate(e.target.value)}
      min={new Date().toISOString().split('T')[0]} // Disallow past dates
      style={{
        padding: '8px',
        marginBottom: '10px',
        fontSize: '1rem',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginRight: '15px',
      }}
    />

    <button
      onClick={handleApplyCasualLeave}
      disabled={!selectedLeaveDate}
      style={{
        ...buttonStyle,
        backgroundColor: selectedLeaveDate ? '#007BFF' : '#aaa',
        cursor: selectedLeaveDate ? 'pointer' : 'not-allowed',
      }}
    >
      Apply Casual Leave
    </button>

    {casualLeaveMessage && (
      <p
        style={{
          color: casualLeaveMessage.includes('Error') ? 'red' : 'green',
          marginTop: '10px',
          fontSize: '1.7rem',
        }}
      >
        {casualLeaveMessage}
      </p>
    )}
  </div>
)}


      {/* Analysis Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => setShowGraph(!showGraph)} style={buttonStyle}>
          {showGraph ? 'Hide Analysis' : 'Show Analysis'}
        </button>

        {/* NEW: Export Buttons moved here */}
        {isAdminView && (
          <>
            <button onClick={handleExportCSV} style={{...buttonStyle, backgroundColor: '#28a745', marginLeft: '10px'}}>
              Export to CSV
            </button>
            <button onClick={handleExportPDF} style={{...buttonStyle, backgroundColor: '#dc3545', marginLeft: '10px'}}>
              Export to PDF
            </button>
          </>
        )}
      </div>

      {/* Graph Display Area */}
      {showGraph && allAttendanceData.length > 0 && (
        <div
          style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '900px',
            height: '400px',
            margin: '40px auto 20px auto',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'black' }}>Monthly Attendance Trends</h3>
          <div style={{ flexGrow: 1, width: '100%' }}>
            <Bar data={getGraphData()} options={chartOptions} />
          </div>
        </div>
      )}

      {showPopup && selectedUser && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            {/* Display update message */}
            {updateMessage && (
              <p style={{ color: updateMessage.includes('successfully') ? 'green' : 'red', textAlign: 'center', marginBottom: '10px' }}>
                {updateMessage}
              </p>
            )}

            {selectedUser.userImage && (
              <img
                src={`${import.meta.env.BASE_URL}uploads/${selectedUser.userImage}`}
                alt={`${selectedUser.name || 'User'}'s Profile Picture`}
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 15px', display: 'block', border: '2px solid #ccc' }}
              />
            )}

            {isEditingProfile ? (
              // Edit Mode
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ color: 'black', textAlign: 'center' }}>Edit Profile</h3>
                <label style={labelStyle}>
                  Name:
                  <input
                    type="text"
                    name="name"
                    value={editedUser?.name || ''}
                    onChange={handleInputChange}
                    style={inputFieldStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Email:
                  <input
                    type="email"
                    name="email"
                    value={editedUser?.email || ''}
                    onChange={handleInputChange}
                    style={inputFieldStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Phone:
                  <input
                    type="text"
                    name="phone"
                    value={editedUser?.phone || ''}
                    onChange={handleInputChange}
                    style={inputFieldStyle}
                  />
                </label>
                <label style={labelStyle}>
                  User Type:
                  <select
                    name="userType"
                    value={editedUser?.userType || ''}
                    onChange={handleInputChange}
                    style={inputFieldStyle}
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Admin">Admin</option>
                  </select>
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                  <button onClick={handleSaveChanges} style={saveButtonStyle}>Save Changes</button>
                  <button onClick={handleCancelEdit} style={cancelButtonStyle}>Cancel</button>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <h3 style={{ color: 'black', textAlign: 'center' }}>{selectedUser.name || 'No Name'}'s Profile</h3>
                <p style={{ color: 'black' }}><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                <p style={{ color: 'black' }}><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                <p style={{ color: 'black' }}><strong>User Type:</strong> {selectedUser.userType || 'N/A'}</p>
                {isAdminView && ( // Only show edit button if admin is viewing
                  <button onClick={handleEditClick} style={editButtonStyle}>Edit Profile</button>
                )}
              </>
            )}
            <button onClick={() => setShowPopup(false)} className="close-button" style={closeButtonStyle}>❌</button>
          </div>
        </div>
      )}

      {/* NEW: Delete Confirmation Popup */}
      {showDeleteConfirm && userToDelete && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <h3 style={{ color: 'black', textAlign: 'center', marginBottom: '15px' }}>Confirm Deletion</h3>
            {deleteMessage && (
              <p style={{ color: deleteMessage.includes('deleted') ? 'green' : 'red', textAlign: 'center', marginBottom: '10px' }}>
                {deleteMessage}
              </p>
            )}
            <p style={{ color: 'black', textAlign: 'center', marginBottom: '20px', fontSize:'1.5rem', lineHeight:'1.5'}}>
              Are you sure you want to delete the profile for <strong>{userToDelete.name} ({userToDelete.email})</strong>? </p>
               <p style={{ color: 'red', textAlign: 'center', marginBottom: '20px', fontSize:'1.5rem', lineHeight:'1.5'}}>⚠️Warning: This action cannot be undone and will delete all associated attendance and leave records!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button onClick={confirmDelete} style={{ ...saveButtonStyle, backgroundColor: '#dc3545' }}> {/* Red for delete confirm */}
                Confirm Delete
              </button>
              <button onClick={cancelDelete} style={{...cancelButtonStyle, backgroundColor: 'green'}}>
                Cancel
              </button>
            </div>
            <button onClick={cancelDelete} className="close-button" style={closeButtonStyle}>❌</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Styling Constants ---
const thStyle = {
  padding: '10px',
  borderBottom: '2px solid #ddd',
  textAlign: 'center',
  backgroundColor: 'hsl(211, 62.70%, 20.00%)',
  color: '#fff',
};

const tdStyle = {
  padding: '10px',
  borderBottom: '1px solid #eee',
};

const inputStyle = {
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '1.2rem',
  width: '180px',
};

const buttonStyle = {
  padding: '8px 16px',
  backgroundColor: '#007BFF',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const popupStyle = {
  backgroundColor: 'hsl(57, 90%, 72%)',
  padding: '20px',
  borderRadius: '8px',
  maxWidth: '500px',
  width: '100%',
  maxHeight: '80vh',
  overflowY: 'auto',
  position: 'relative',
};

const closeButtonStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#333',
};

const labelStyle = {
  color: 'black',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: '10px',
  fontWeight: 'bold',
};

const inputFieldStyle = {
  width: '100%',
  padding: '8px',
  marginTop: '5px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box',
  fontSize: '1.2rem',
};

const editButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  marginTop: '20px',
  fontSize: '1.2rem',
};

const saveButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1.5rem',
};

const cancelButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1.5rem',
};

export default Summary;

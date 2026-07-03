import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import moment from 'moment';

const AttendancePage = () => {
  const { state } = useLocation();
  const { userId, isAdminView } = state || {};
  const [records, setRecords] = useState([]);

  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    let url = '';
    if (isAdminView) {
      const query = new URLSearchParams();
      if (userTypeFilter) query.append('userType', userTypeFilter);
      if (nameFilter) query.append('name', nameFilter);
      if (dateFilter) query.append('attendanceDate', dateFilter);

      url = `http://localhost:8001/attendance/all?${query.toString()}`;
    } else if (userId) {
      url = `http://localhost:8001/attendance/user/${userId}`;
    } else {
      return;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setRecords(data);
      })
      .catch((err) => console.error(err));
  }, [userId, isAdminView, userTypeFilter, nameFilter, dateFilter]);

  // Reset all filters
  const resetFilters = () => {
    setUserTypeFilter('');
    setNameFilter('');
    setDateFilter('');
  };

  return (
    <div className="attendanceLayout" style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Attendance Record</h2>

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
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              fontSize: '1.2rem',  
              borderRadius: '4px',
              width: '200px',
            }}
          />
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              fontSize: '1.2rem',  
              borderRadius: '4px',
              width: '180px',
            }}
          >
            <option value="">All Users</option>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1.2rem',  
              width: '180px',
            }}
          />
          <button
            onClick={resetFilters}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007BFF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
   <div className="table-wrapper">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'hsl(19, 32%, 50%)' }}>
           {isAdminView && <th style={thStyle}>Name</th>}
              {isAdminView && <th style={thStyle}>User Type</th>}
            <th style={thStyle}>Attendance Date</th>
            <th style={thStyle}>Check-in Time</th>
            <th style={thStyle}>Accepted for Attendance</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                No attendance records found.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record._id}>
                {isAdminView && <td style={tdStyle}>{record.userId?.name}</td>}
                  {isAdminView && <td style={tdStyle}>{record.userId?.userType}</td>}
                <td style={tdStyle}>
                  {moment(record.attendanceDate).format('DD/MM/YYYY')}
                </td>
                <td style={tdStyle}>
                  {(() => {
                    const [hours, minutes, seconds] =
                      record.checkInTime.split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours));
                    date.setMinutes(parseInt(minutes));
                    date.setSeconds(parseInt(seconds));
                    return date.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'Asia/Kolkata',
                    });
                  })()}
                </td>
                <td style={tdStyle}>
                  {record.attendanceStatus === "Accepted"
                     ? "✅ Yes"
                     : `❌ No (${record.attendanceStatus})`}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '10px',
  borderBottom: '2px solid #ddd',
  textAlign: 'center',
  backgroundColor: 'hsl(211, 62.70%, 20.00%)',

};

const tdStyle = {
  padding: '10px',
  borderBottom: '1px solid #eee',
};

export default AttendancePage;

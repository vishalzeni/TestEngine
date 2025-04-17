import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import Home from './pages/Home';
import TestPage from './Students/Test';
import AddTestPage from './Admin/AddTestPage';
import TestInstructions from './Students/TestInstructions';
import ResultPage from './Students/ResultPage';
import LoadingTestEngine from './Students/LoadingTestEngine';
import StudentLogin from './Students/StudentLogin';
import AddStudent from './Admin/AddStudent';
import AdminLogin from './Admin/AdminLogin';
import RoleSelection from './pages/RoleSelection';
import Admin from './Admin/Admin';
import AddAdmin from './Admin/AddAdmin';
import AdminSignup from './Admin/AdminSignup';
import BatchCreationPage from './Admin/CreateBatch';

const App = () => {
  const [student, setStudent] = React.useState(JSON.parse(localStorage.getItem('student')));
  const [admin, setAdmin] = React.useState(JSON.parse(localStorage.getItem('admin')));
  const [allowAdminSignup, setAllowAdminSignup] = useState(false);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/check-admin');
        const data = await response.json();
        console.log('Admin status response:', data); // Debugging log
        setAllowAdminSignup(!data.exists);
      } catch (error) {
        console.error('Error checking admin existence:', error);
      }
    };
    fetchAdminStatus();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setStudent(null);
    setAdmin(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            admin ? <Navigate to="/admin" /> : student ? <Navigate to="/home" /> : <RoleSelection />
          }
        />
        {/* Public routes */}
        <Route path="/admin-login" element={!admin ? <AdminLogin /> : <Navigate to="/admin" />} />
        <Route path="/student-login" element={!student ? <StudentLogin /> : <Navigate to="/home" />} />
        <Route path="/admin-signup" element={allowAdminSignup ? <AdminSignup /> : <Navigate to="/" />} />

        {/* Student routes */}
        {student && (
          <>
            <Route path="/home" element={<Home />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/instructions" element={<TestInstructions />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/loading-test-engine" element={<LoadingTestEngine />} />
          </>
        )}

        {/* Admin routes */}
        {admin && (
          <>
            <Route path="/admin" element={<Admin onLogout={handleLogout} />} />
            <Route path="/add-test" element={<AddTestPage />} />
            <Route path="/add-student" element={<AddStudent />} />
            <Route path="/add-admin" element={<AddAdmin />} />
            <Route path="/create-batch" element={<BatchCreationPage />} />
          </>
        )}

        {/* Fallback routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
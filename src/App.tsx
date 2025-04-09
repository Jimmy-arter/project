import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const AppContent = () => {
  const { loading, currentUser, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getDefaultRedirect = () => {
    if (!currentUser) return '/landing';
    switch (userRole) {
      case 'patient':
        return '/patient-dashboard';
      case 'doctor':
        return '/doctor-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/landing';
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {currentUser && <Navbar />}
      <div className={`flex-grow ${currentUser ? "container mx-auto px-4 py-8" : ""}`}>
        <Routes>
          <Route path="/landing" element={
            currentUser ? <Navigate to={getDefaultRedirect()} /> : <LandingPage />
          } />
          <Route path="/login" element={
            currentUser ? <Navigate to={getDefaultRedirect()} /> : <Login />
          } />
          <Route path="/register" element={
            currentUser ? <Navigate to={getDefaultRedirect()} /> : <Register />
          } />
          <Route 
            path="/patient-dashboard" 
            element={
              <PrivateRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/doctor-dashboard" 
            element={
              <PrivateRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to={getDefaultRedirect()} />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/login';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1F2937' }}>
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#EF4444' }}></div>
      <p className="text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
    </div>
  </div>
);

// Main app content (inside AuthProvider)
const AppContent = () => {
  const { user, loading, isAuthenticated, isAdmin, isClient } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Route based on user role
  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isClient) {
    return <ClientDashboard />;
  }

  // Fallback 
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Unknown User Role</h2>
        <p className="text-red-500">Please contact your administrator.</p>
      </div>
    </div>
  );
};

// Main App component
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
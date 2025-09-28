import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboardContent from './AdminDashboardContent';
import loginImage from '../assets/login-image.png';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeSection, setActiveSection] = useState('accueil');

  // Function to refresh file list after upload
  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const sidebarItems = [
    { id: 'accueil', name: 'Accueil', icon: '🏠' },
    { id: 'mes-depots', name: 'Mes Dépôts', icon: '📁' },
    { id: 'client-uploads', name: 'Client Uploads', icon: '📋' },
    { id: 'upload-to-client', name: 'Upload to Client', icon: '📤' },
    { id: 'utilisateurs', name: 'Utilisateurs', icon: '👥' },
    { id: 'historique', name: 'Upload Windows', icon: '⏰' }, 
    { id: 'parametres', name: 'Paramètres', icon: '⚙️' },
  ];

  const getSectionTitle = () => {
    const section = sidebarItems.find(item => item.id === activeSection);
    return section ? section.name : 'Dashboard';
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Sidebar */}
      <div className="w-64 shadow-md" style={{ backgroundColor: '#1F2937' }}>
        <div className="p-6">
          <img
            src={loginImage}
            alt="Company Logo"
            className="h-20 w-full object-fit mx-auto"
          />
        </div>
        
        <nav className="mt-6">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                activeSection === item.id ? 'bg-gray-700 text-white border-r-4' : ''
              }`}
              style={{ 
                borderRightColor: activeSection === item.id ? '#EF4444' : 'transparent',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <span className="mr-3">🚪</span>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {getSectionTitle()}
              </h2>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Welcome back,</span>
                <span className="font-medium text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {user?.name}
                </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                     style={{ backgroundColor: '#EF4444' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <AdminDashboardContent 
            activeSection={activeSection}
            refreshTrigger={refreshTrigger}
            handleUploadSuccess={handleUploadSuccess}
          />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
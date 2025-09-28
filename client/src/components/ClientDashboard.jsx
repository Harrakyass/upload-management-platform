import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import FileList from './FileList';
import ReceivedFiles from './ReceivedFiles';
import ClientUploadStatus from './ClientUploadStatus';
import AdminSettings from './AdminSettings';
import loginImage from '../assets/login-image.png';



const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeSection, setActiveSection] = useState('mes-depots');

  // Function to refresh file list after upload
  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const sidebarItems = [
    { id: 'mes-depots', name: 'Mes Dépôts', icon: '📁' },
    { id: 'documents-recus', name: 'Documents Reçus', icon: '📨' },
    { id: 'notifications', name: 'Paramètres', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'mes-depots':
         return (
          <div className="space-y-8">
            <ClientUploadStatus refreshTrigger={refreshTrigger} /> {/* Add this back */}
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            <FileList refreshTrigger={refreshTrigger} showUploaderName={false} />
          </div>
        );
      case 'documents-recus':
        return <ReceivedFiles refreshTrigger={refreshTrigger} />;
      case 'notifications':
        return <AdminSettings refreshTrigger={refreshTrigger} />;
      default:
        return null;
    }
  };

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
            className="h-16 w-full object-fit mx-auto"
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
                <span className="text-sm text-gray-600">Bienvenue ,</span>
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
          {/* Upload Status Card - only show on mes-depots */}
          {activeSection === 'mes-depots' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
                <div className="flex items-center">
                  <div className="p-2 rounded-md" style={{ backgroundColor: '#FEE2E2' }}>
                    <span className="text-xl">📤</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Fichiers envoyés</p>
                    <p className="text-2xl font-bold text-gray-900">7</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#8B5CF6' }}>
                <div className="flex items-center">
                  <div className="p-2 rounded-md" style={{ backgroundColor: '#EDE9FE' }}>
                    <span className="text-xl">📨</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Fichiers reçus</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
                <div className="flex items-center">
                  <div className="p-2 rounded-md" style={{ backgroundColor: '#FEF3C7' }}>
                    <span className="text-xl">💾</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Espace utilisé</p>
                    <p className="text-2xl font-bold text-gray-900">42MB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
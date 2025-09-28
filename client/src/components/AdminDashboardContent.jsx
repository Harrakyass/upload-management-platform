import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminFileManagement from './AdminFileManagement';
import AdminUploadToClient from './AdminUploadToClient';
import AllClientFiles from './AllClientFiles';
import UserManagement from './UserManagement';
import UploadWindowsManagement from './UploadWindowsManagement';
import AdminSettings from './AdminSettings';

const AdminDashboardContent = ({ activeSection, refreshTrigger, handleUploadSuccess }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/users/stats');
        setStats(res.data.stats);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, [refreshTrigger]);

  const renderContent = () => {
    switch (activeSection) {
      case 'accueil':
        return (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Users */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
                <div className="flex items-center">
                  <div className="p-2 rounded-md" style={{ backgroundColor: '#FEE2E2' }}>
                    <span className="text-xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total D'utilisateurs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats ? stats.total_users : '...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Files */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#10B981' }}>
                <div className="flex items-center">
                  <div className="p-2 rounded-md" style={{ backgroundColor: '#D1FAE5' }}>
                    <span className="text-xl">📁</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Fichiers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      11
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Windows */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
                <div className="flex items-center">
                  <div className="p-2 rounded-md" style={{ backgroundColor: '#FEF3C7' }}>
                    <span className="text-xl">⏰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Windows</p>
                    <p className="text-2xl font-bold text-gray-900">
                      2
                    </p>
                  </div>
                </div>
              </div>

              {/* New This Month */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#8B5CF6' }}>
                <div className="flex items-center">
                  <div className="p-2 rounded-md" style={{ backgroundColor: '#EDE9FE' }}>
                    <span className="text-xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ce mois</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats ? stats.new_this_month : '...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">👋</span>
                <p style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Bienvenue sur votre tableau de bord d'administration !
                  <br />
                  Gérez les utilisateurs, transférez des fichiers aux clients et surveillez l'activité du système.
                </p>
              </div>
            </div>
          </div>
        );

      case 'mes-depots':
        return <AdminFileManagement refreshTrigger={refreshTrigger} />;

      case 'upload-to-client':
        return <AdminUploadToClient onUploadSuccess={handleUploadSuccess} />;

      case 'client-uploads':
        return <AllClientFiles refreshTrigger={refreshTrigger} />;

      case 'utilisateurs':
        return <UserManagement refreshTrigger={refreshTrigger} stats={stats} />;

      case 'historique':
        return <UploadWindowsManagement refreshTrigger={refreshTrigger} />;

      case 'parametres':
        return <AdminSettings refreshTrigger={refreshTrigger} />;

      default:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">❓</span>
              <p style={{ fontFamily: 'Poppins, sans-serif' }}>
                Section non trouvée!!
              </p>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};

export default AdminDashboardContent;
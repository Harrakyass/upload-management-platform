import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ClientUploadStatus = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [uploadWindow, setUploadWindow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch client's upload window status
  const fetchUploadStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/upload-windows/client/${user.user_id}`);
      setUploadWindow(response.data.current_window);
      setError('');
    } catch (error) {
      console.error('Fetch upload status error:', error);
      setError('Failed to load upload status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUploadStatus();
    }
  }, [user, refreshTrigger]);

  // Calculate time remaining
  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get progress percentage
  const getProgress = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2" style={{ borderColor: '#EF4444' }}></div>
          <p className="text-gray-600 text-sm">Loading upload status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
        <div className="flex items-center">
          <div className="p-2 rounded-md" style={{ backgroundColor: '#FEE2E2' }}>
            <span className="text-xl">⚠️</span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Statut de dépôt indisponible
            </h3>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchUploadStatus}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!uploadWindow) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#6B7280' }}>
        <div className="flex items-center">
          <div className="p-2 rounded-md" style={{ backgroundColor: '#F3F4F6' }}>
            <span className="text-xl">🔒</span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Aucune période de dépôt
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Vous n'avez actuellement pas l'autorisation de déposer des fichiers.
              <br />
              Contactez votre administrateur pour demander une période de dépôt.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determine status and styling
  const now = new Date();
  const startTime = new Date(uploadWindow.start_time);
  const endTime = new Date(uploadWindow.end_time);
  
  let status, borderColor, bgColor, icon, canUpload;
  
  if (now < startTime) {
    status = 'upcoming';
    borderColor = '#3B82F6';
    bgColor = '#DBEAFE';
    icon = '⏳';
    canUpload = false;
  } else if (now > endTime) {
    status = 'expired';
    borderColor = '#EF4444';
    bgColor = '#FEE2E2';
    icon = '🔴';
    canUpload = false;
  } else {
    status = 'active';
    borderColor = '#10B981';
    bgColor = '#D1FAE5';
    icon = '🟢';
    canUpload = true;
  }

  const progress = getProgress(uploadWindow.start_time, uploadWindow.end_time);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: borderColor }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 rounded-md" style={{ backgroundColor: bgColor }}>
            <span className="text-xl">{icon}</span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Upload Window {status === 'active' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Expired'}
            </h3>
            <p className="text-sm text-gray-600">
              {canUpload ? 'Vous pouvez déposer des fichiers maintenant !' : 
               status === 'upcoming' ? 'La période de dépôt ouvrira bientôt.' : 
               'La période de dépôt est terminée'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Temps {status === 'expired' ? 'écoulé' : 'restant'}</p>
          <p className="text-lg font-semibold text-gray-900">
            {getTimeRemaining(uploadWindow.end_time)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progression </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: status === 'expired' ? '#EF4444' : 
                             status === 'active' ? '#10B981' : '#3B82F6'
            }}
          />
        </div>
      </div>

      {/* Time Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Heure de début</p>
          <p className="font-medium text-gray-900">
            {formatDate(uploadWindow.start_time)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Heure de fin</p>
          <p className="font-medium text-gray-900">
            {formatDate(uploadWindow.end_time)}
          </p>
        </div>
      </div>

      {/* Action Message */}
      <div className="mt-4 p-3 rounded-md" style={{ backgroundColor: bgColor }}>
        <p className="text-sm font-medium" style={{ 
          color: status === 'expired' ? '#DC2626' : 
                status === 'active' ? '#059669' : '#2563EB'
        }}>
          {status === 'active' && '✅ Déposez vos fichiers en utilisant le formulaire ci-dessous pendant cette période.'}
          {status === 'upcoming' && "⏰ La fonctionnalité de dépôt sera disponible à l'ouverture de la période."}
          {status === 'expired' && "🚫  La période de dépôt est terminée. Contactez l'administrateur pour une extension si nécessaire."}
        </p>
      </div>
    </div>
  );
};

export default ClientUploadStatus;
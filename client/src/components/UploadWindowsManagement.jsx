import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UploadWindowsManagement = ({ refreshTrigger }) => {
  const [windows, setWindows] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    client_id: '',
    start_time: '',
    end_time: ''
  });
  const [extendForm, setExtendForm] = useState({
    new_end_time: '',
    extension_reason: ''
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [windowsResponse, clientsResponse, statsResponse] = await Promise.all([
        axios.get('/api/upload-windows'),
        axios.get('/api/auth/clients'),
        axios.get('/api/upload-windows/stats')
      ]);
      
      setWindows(windowsResponse.data.windows);
      setClients(clientsResponse.data.clients);
      setStats(statsResponse.data.stats);
      setError('');
    } catch (error) {
      console.error('Fetch data error:', error);
      setError('Failed to load upload windows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  // Create upload window
  // Replace the handleCreateWindow function with this version:
const handleCreateWindow = async (e) => {
  e.preventDefault();
  
  try {
    // Ensure we have all required fields
    if (!createForm.client_id) {
      alert('Please select a client');
      return;
    }
    if (!createForm.start_time) {
      alert('Please set a start time');
      return;
    }
    if (!createForm.end_time) {
      alert('Please set an end time');
      return;
    }

    const requestData = {
      client_id: parseInt(createForm.client_id),
      start_time: createForm.start_time,
      end_time: createForm.end_time
    };

    await axios.post('/api/upload-windows', requestData);
    alert('Upload window created successfully!');
    setShowCreateModal(false);
    setCreateForm({ client_id: '', start_time: '', end_time: '' });
    fetchData();
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to create upload window';
    alert(`Error: ${message}`);
  }
};

  // Extend upload window
  const handleExtendWindow = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/upload-windows/${selectedWindow.window_id}/extend`, extendForm);
      alert('Upload window extended successfully!');
      setShowExtendModal(false);
      setSelectedWindow(null);
      setExtendForm({ new_end_time: '', extension_reason: '' });
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to extend upload window';
      alert(`Error: ${message}`);
    }
  };

  // Deactivate upload window
  const handleDeactivateWindow = async (window) => {
    if (!confirm(`Are you sure you want to deactivate the upload window for ${window.client_name}?`)) {
      return;
    }

    try {
      await axios.put(`/api/upload-windows/${window.window_id}/deactivate`);
      alert('Upload window deactivated successfully!');
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to deactivate upload window';
      alert(`Error: ${message}`);
    }
  };

  // Open extend modal
  const openExtendModal = (window) => {
    setSelectedWindow(window);
    // Set default new end time to 7 days from current end time
    const currentEndTime = new Date(window.end_time);
    const newEndTime = new Date(currentEndTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    setExtendForm({
      new_end_time: newEndTime.toISOString().slice(0, 16),
      extension_reason: ''
    });
    setShowExtendModal(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for input
  const formatDateForInput = (date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-600', label: 'Active' },
      upcoming: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Upcoming' },
      expired: { bg: 'bg-red-100', text: 'text-red-600', label: 'Expired' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Inactive' }
    };
    
    const badge = badges[status] || badges.inactive;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Set default dates for new window (today to 7 days from now)
  const getDefaultDates = () => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      start: formatDateForInput(now),
      end: formatDateForInput(weekFromNow)
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#EF4444' }}></div>
          <p className="text-gray-600">Loading upload windows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total_windows}</p>
              <p className="text-xs text-gray-500">Total Windows</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: '#10B981' }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.current_active}</p>
              <p className="text-xs text-gray-500">Actuellement actifs</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.upcoming_windows}</p>
              <p className="text-xs text-gray-500">À venir</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.expired_windows}</p>
              <p className="text-xs text-gray-500">Expiré</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: '#8B5CF6' }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.extended_windows}</p>
              <p className="text-xs text-gray-500">Prolongé</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: '#6B7280' }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.active_windows}</p>
              <p className="text-xs text-gray-500">Total d'actifs</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Windows List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Upload Windows ({windows.length} windows)
            </h3>
            <p className="text-sm text-gray-600">Gérez les délais et les autorisations de dépôt des clients</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchData}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-white rounded-md font-medium transition-colors hover:opacity-90"
              style={{ 
                backgroundColor: '#EF4444',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              + Create Window
            </button>
          </div>
        </div>

        {error ? (
          <div className="p-6">
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">❌</span>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 text-sm text-white rounded-md"
                style={{ backgroundColor: '#EF4444' }}
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : windows.length === 0 ? (
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">⏰</span>
              <p style={{ fontFamily: 'Poppins, sans-serif' }}>
                Aucune période de dépôt créée pour le moment
              </p>
              <p className="text-sm mt-2">
                Créez des périodes de dépôt pour contrôler quand les clients peuvent déposer des fichiers
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de début
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de fin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fichiers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {windows.map((window) => (
                  <tr key={window.window_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                             style={{ backgroundColor: '#8B5CF6' }}>
                          {window.client_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{window.client_name}</div>
                          <div className="text-sm text-gray-500">{window.client_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(window.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(window.end_time)}
                      {window.extended_by_name && (
                        <div className="text-xs text-orange-600">
                          Prolongé par {window.extended_by_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(window.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {window.files_uploaded} Déposé
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {window.status === 'active' || window.status === 'upcoming' ? (
                          <button
                            onClick={() => openExtendModal(window)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Prolonger
                          </button>
                        ) : null}
                        {window.is_active && (
                          <button
                            onClick={() => handleDeactivateWindow(window)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Désactiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Window Modal - FIXED VERSION */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Créer une période de dépôt
            </h3>
            <form onSubmit={handleCreateWindow} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select
                  required
                  value={createForm.client_id}
                  onChange={(e) => setCreateForm({...createForm, client_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.user_id} value={client.user_id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
                
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  type="datetime-local"
                  required
                  value={createForm.start_time || getDefaultDates().start}
                  onChange={(e) => setCreateForm({...createForm, start_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
                
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="datetime-local"
                  required
                  value={createForm.end_time || getDefaultDates().end}
                  onChange={(e) => setCreateForm({...createForm, end_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
                
              </div>
              
              

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-md"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  Create Window
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Window Modal */}
      {showExtendModal && selectedWindow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Prolonger la période de dépôt
            </h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Client:</strong> {selectedWindow.client_name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Date de fin actuelle:</strong> {formatDate(selectedWindow.end_time)}
              </p>
            </div>
            
            <form onSubmit={handleExtendWindow} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle date de fin</label>
                <input
                  type="datetime-local"
                  required
                  value={extendForm.new_end_time}
                  onChange={(e) => setExtendForm({...extendForm, new_end_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison (Optional)</label>
                <textarea
                  placeholder="Why are you extending this deadline?"
                  value={extendForm.extension_reason}
                  onChange={(e) => setExtendForm({...extendForm, extension_reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  rows="3"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-md"
                  style={{ backgroundColor: '#F59E0B' }}
                >
                  Prolonger le délai
                </button>
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadWindowsManagement;
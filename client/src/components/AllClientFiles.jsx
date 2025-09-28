import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AllClientFiles = ({ refreshTrigger }) => {
  const [filesByClient, setFilesByClient] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedClients, setExpandedClients] = useState(new Set());
  const [totalFiles, setTotalFiles] = useState(0);

  // Fetch all client uploads
  const fetchAllClientFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/files/all-client-uploads');
      setFilesByClient(response.data.files_by_client || []);
      setTotalFiles(response.data.total_files || 0);
      setError('');

      // Auto-expand clients that have files
      const clientsWithFiles = new Set(
        response.data.files_by_client
          .filter(client => client.files.length > 0)
          .map(client => client.client_id)
      );
      setExpandedClients(clientsWithFiles);

    } catch (error) {
      console.error('Fetch all client files error:', error);
      setError('Failed to load client files');
    } finally {
      setLoading(false);
    }
  };

  // Fetch files on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchAllClientFiles();
  }, [refreshTrigger]);

  // Toggle client expansion
  const toggleClientExpansion = (clientId) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  // Download file
  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await axios.get(`/api/files/download/${fileId}`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error.response?.data?.message || 'Download failed';
      alert(`Download failed: ${errorMessage}`);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get file icon based on file name
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'xlsx':
      case 'xls':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'doc':
      case 'docx':
        return '📝';
      default:
        return '📁';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#EF4444' }}></div>
          <p className="text-gray-600">Loading all client files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAllClientFiles}
            className="mt-4 px-4 py-2 text-sm text-white rounded-md"
            style={{ backgroundColor: '#EF4444' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Tous les dépôts clients  ({totalFiles} fichiers)
          </h3>
          <p className="text-sm text-gray-600">Fichiers déposés par l'ensemble des clients</p>
        </div>
        <button
          onClick={fetchAllClientFiles}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          🔄 Refresh
        </button>
      </div>

      {filesByClient.length === 0 ? (
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-4 block">📂</span>
            <p style={{ fontFamily: 'Poppins, sans-serif' }}>
              Aucun dépôt client pour le moment
            </p>
            <p className="text-sm mt-2">
              Les fichiers déposés par les clients apparaîtront ici.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filesByClient.map((client) => (
            <div key={client.client_id} className="p-6">
              {/* Client Header */}
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 rounded-md -m-3 mb-3"
                onClick={() => toggleClientExpansion(client.client_id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                       style={{ backgroundColor: '#EF4444' }}>
                    {client.client_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {client.client_name}
                    </h4>
                    <p className="text-xs text-gray-500">{client.client_email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                    {client.files.length} fichiers
                  </span>
                  <span className="text-gray-400">
                    {expandedClients.has(client.client_id) ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Client Files */}
              {expandedClients.has(client.client_id) && (
                <div className="ml-6 space-y-3">
                  {client.files.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">Aucun fichier déposé par ce client</p>
                  ) : (
                    client.files.map((file) => (
                      <div key={file.file_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getFileIcon(file.file_name)}</span>
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">
                              {file.file_name}
                            </h5>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>•</span>
                              <span>{formatDate(file.uploaded_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                            Dépôt client
                          </span>
                          
                          <button
                            onClick={() => downloadFile(file.file_id, file.file_name)}
                            className="px-3 py-1 text-sm text-white rounded-md hover:opacity-90 transition-colors"
                            style={{ backgroundColor: '#EF4444' }}
                          >
                            Télécharger
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllClientFiles;
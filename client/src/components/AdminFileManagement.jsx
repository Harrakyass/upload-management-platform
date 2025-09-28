import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminFileManagement = () => {
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all files (admin view)
  const fetchAllFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/files/my-uploads');
      setAllFiles(response.data.files);
      setError('');
    } catch (error) {
      console.error('Fetch files error:', error);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFiles();
  }, []);

  // Download file
  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await axios.get(`/api/files/download/${fileId}`, {
        responseType: 'blob',
      });

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
      alert('Download failed');
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

  // Get file icon
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf': return '📄';
      case 'xlsx': case 'xls': return '📊';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
      case 'doc': case 'docx': return '📝';
      default: return '📁';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#EF4444' }}></div>
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Fichiers envoyés ({allFiles.length})
        </h3>
        <button
          onClick={fetchAllFiles}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="p-6">
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">❌</span>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchAllFiles}
              className="mt-4 px-4 py-2 text-sm text-white rounded-md"
              style={{ backgroundColor: '#EF4444' }}
            >
              Réessayer 
            </button>
          </div>
        </div>
      )}

      {allFiles.length === 0 && !error ? (
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-4 block">📂</span>
            <p style={{ fontFamily: 'Poppins, sans-serif' }}>
              Aucun fichier téléversé pour le moment
            </p>
            <p className="text-sm mt-2">
              Les fichiers que vous envoyez aux clients s'afficheront ici
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {allFiles.map((file) => (
            <div key={file.file_id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{getFileIcon(file.file_name)}</span>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {file.file_name}
                    </h4>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.uploaded_at)}</span>
                      <span>•</span>
                      <span>Envoyé à: {file.owner_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                    Dépôt admin
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFileManagement;
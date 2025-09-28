import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReceivedFiles = ({ refreshTrigger }) => {
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch received files (files where uploader_id != owner_id)
  const fetchReceivedFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/files/my-files');
      
      // Filter to only show files received from others (not self-uploaded)
      const receivedOnly = response.data.files.filter(file => !file.is_own_upload);
      setReceivedFiles(receivedOnly);
      setError('');
    } catch (error) {
      console.error('Fetch received files error:', error);
      setError('Failed to load received files');
    } finally {
      setLoading(false);
    }
  };

  // Fetch files on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchReceivedFiles();
  }, [refreshTrigger]);

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
          <p className="text-gray-600">Chargement des fichiers reçus...</p>
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
            onClick={fetchReceivedFiles}
            className="mt-4 px-4 py-2 text-sm text-white rounded-md"
            style={{ backgroundColor: '#EF4444' }}
          >
            Réessayer
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
            Documents Reçus ({receivedFiles.length})
          </h3>
          <p className="text-sm text-gray-600">Fichiers envoyés par l'admin</p>
        </div>
        <button
          onClick={fetchReceivedFiles}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          🔄 Refresh
        </button>
      </div>

      {receivedFiles.length === 0 ? (
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-4 block">📨</span>
            <p style={{ fontFamily: 'Poppins, sans-serif' }}>
              Aucun fichier reçu pour le moment.
            </p>
            <p className="text-sm mt-2">
              Les fichiers déposés pour vous par l'administrateur apparaîtront ici.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {receivedFiles.map((file) => (
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
                      <span>Depuis: {file.uploader_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                    Reçu
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

export default ReceivedFiles;
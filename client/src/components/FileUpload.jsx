import React, { useState, useRef } from 'react';
import axios from 'axios';

const FileUpload = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (files) => {
    const fileList = Array.from(files);
    
    // Validate files
    const validFiles = fileList.filter(file => {
      const maxSize = 100 * 1024 * 1024; // 100MB
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 100MB.`);
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" has an unsupported format.`);
        return false;
      }

      return true;
    });

    setSelectedFiles(validFiles);
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  // Upload files
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      // Success
      alert(`Successfully uploaded ${response.data.files.length} file(s)!`);
      setSelectedFiles([]);
      setUploadProgress(0);
      
      // Callback to parent to refresh file list
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.response?.data?.code === 'UPLOAD_WINDOW_CLOSED') {
        alert('Upload failed: Your upload window has expired or is not active. Please contact your administrator.');
      } else {
        const errorMessage = error.response?.data?.message || 'Upload failed';
        alert(`Upload failed: ${errorMessage}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Déposer des documents
        </h3>
      </div>
      
      <div className="p-6">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-red-400 bg-red-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-4">
              {isDragging ? '📥' : '📁'}
            </span>
            <h4 className="text-lg font-medium text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {isDragging ? 'Drop files here' : 'Upload your files'}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
                  Déposez vos fichiers ici, ou cliquez pour parcourir
            </p>
            <button
              type="button"
              className="px-6 py-2 text-white rounded-md font-medium transition-colors hover:opacity-90"
              style={{ 
                backgroundColor: '#EF4444',
                fontFamily: 'Poppins, sans-serif'
              }}
              disabled={isUploading}
            >
              Choisir les fichiers
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Formats supportés : PDF, Excel, Images, Word • Taille max. par fichier : 100 Mo
            </p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple
          accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.doc,.docx"
          style={{ display: 'none' }}
        />

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-800 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Fichiers sélectionnés ({selectedFiles.length})
            </h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                    disabled={isUploading}
                  >
                    Supprimer 
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="mt-4 flex items-center space-x-4">
              <button
                onClick={uploadFiles}
                disabled={isUploading}
                className="px-6 py-2 text-white rounded-md font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ 
                  backgroundColor: '#EF4444',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Files'}
              </button>

              {isUploading && (
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${uploadProgress}%`,
                      backgroundColor: '#EF4444'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: null
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Handle profile picture selection
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPG, PNG, GIF)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('Image file must be less than 5MB');
        return;
      }

      setProfileData(prev => ({ ...prev, profilePicture: file }));
      setError('');
    }
  };

  // Update profile information
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      
      if (profileData.profilePicture) {
        formData.append('profilePicture', profileData.profilePicture);
      }

      const response = await axios.put('/api/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear the selected file
      setProfileData(prev => ({ ...prev, profilePicture: null }));
      
      // Note: In a real app, you might want to update the user context here
      // For now, we'll just show the success message

    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password strength
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Password change error:', error);
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      profilePicture: null
    });
    setError('');
    setSuccess('');
  };

  // Cancel password change
  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <span className="text-green-400 mr-3">✅</span>
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <span className="text-red-400 mr-3">❌</span>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Profile Information Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Informations du profil
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
            >
              Modifier le profil
            </button>
          )}
        </div>

        <div className="p-6">
          {!isEditing ? (
            // View Mode
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                     style={{ backgroundColor: '#EF4444' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                    <p className="text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {user?.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Rôle</label>
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600 capitalize">
                      {user?.role}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Member depuis</label>
                    <p className="text-gray-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleProfileUpdate}>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
                       style={{ backgroundColor: '#EF4444' }}>
                    {profileData.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Changer L'image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePictureChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {profileData.profilePicture && (
                    <p className="text-xs text-green-600 mt-1">Nouveau image a été séléctioner</p>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Npm</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                      disabled
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Mot de passe & Security
          </h3>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
            >
              Changer le mot de passe
            </button>
          )}
        </div>

        <div className="p-6">
          {!isChangingPassword ? (
            <div className="flex items-center space-x-3">
              <span className="text-green-500">🔒</span>
              <p className="text-gray-600">Votre mot de passe est sécurisé et chiffré. </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Doit contenir au moins 6 caractères.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
                >
                  {loading ? 'Changing...' : 'Changer le mot de passe'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Gestion du compte
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
            <div>
              <h4 className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Se déconnecter
              </h4>
              <p className="text-sm text-gray-600">Se déconnecter de votre compte administrateur.</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Déconnexion 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
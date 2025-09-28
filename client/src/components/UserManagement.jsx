import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = ({ refreshTrigger, stats }) => { // CHANGED: accept stats as prop
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // REMOVED: stats state, since it's now a prop
  // const [stats, setStats] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client'
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'client'
  });
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: ''
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // CHANGED: only fetch users (not stats anymore)
      const usersResponse = await axios.get('/api/users');
      setUsers(usersResponse.data.users);
      setError('');
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', createForm);
      alert('User created successfully!');
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'client' });
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create user';
      alert(`Error: ${message}`);
    }
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/users/${selectedUser.user_id}`, editForm);
      alert('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update user';
      alert(`Error: ${message}`);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/users/${selectedUser.user_id}/reset-password`, resetPasswordForm);
      alert('Password reset successfully!');
      setResetPasswordForm({ newPassword: '' });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      alert(`Error: ${message}`);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      await axios.delete(`/api/users/${selectedUser.user_id}`);
      alert('User deleted successfully!');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete user';
      alert(`Error: ${message}`);
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setResetPasswordForm({ newPassword: '' });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#EF4444' }}></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
            <div className="flex items-center">
              <div className="p-2 rounded-md" style={{ backgroundColor: '#FEE2E2' }}>
                <span className="text-xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total d'utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#10B981' }}>
            <div className="flex items-center">
              <div className="p-2 rounded-md" style={{ backgroundColor: '#D1FAE5' }}>
                <span className="text-xl">👨‍💼</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admin_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#8B5CF6' }}>
            <div className="flex items-center">
              <div className="p-2 rounded-md" style={{ backgroundColor: '#EDE9FE' }}>
                <span className="text-xl">👤</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.client_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
            <div className="flex items-center">
              <div className="p-2 rounded-md" style={{ backgroundColor: '#FEF3C7' }}>
                <span className="text-xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nouveaux ce mois-ci</p>
                <p className="text-2xl font-bold text-gray-900">{stats.new_this_month}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Gestion des utilisateurs ({users.length} Utilisateurs)
            </h3>
            <p className="text-sm text-gray-600">Gérez les utilisateurs de la plateforme et leurs autorisations.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchUsers}
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
              + Ajouter un utilisateur
            </button>
          </div>
        </div>

        {error ? (
          <div className="p-6">
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">❌</span>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-4 px-4 py-2 text-sm text-white rounded-md"
                style={{ backgroundColor: '#EF4444' }}
              >
                  Réessayer
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">👥</span>
              <p style={{ fontFamily: 'Poppins, sans-serif' }}>
                Aucun utilisateur trouvé
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fichiers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé 
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                             style={{ backgroundColor: user.role === 'admin' ? '#EF4444' : '#8B5CF6' }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.total_files} total / {user.uploaded_files} uploaded
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Créer un nouvel utilisateur
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-md"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  Créer l'utilisateur
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

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Modifier l'utilisateur: {selectedUser.name}
            </h3>
            
            {/* Update Details Form */}
            <form onSubmit={handleUpdateUser} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 text-white rounded-md"
                style={{ backgroundColor: '#EF4444' }}
              >
                Mettre à jour les informations
              </button>
            </form>

            {/* Reset Password Form */}
            <div className="border-t pt-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Réinitialiser le mot de passe</h4>
              <form onSubmit={handleResetPassword} className="space-y-2">
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  minLength="6"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({newPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={!resetPasswordForm.newPassword}
                  className="w-full px-4 py-2 text-white rounded-md disabled:opacity-50"
                  style={{ backgroundColor: '#F59E0B' }}
                >
                  Réinitialiser le mot de passe
                </button>
              </form>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowEditModal(false)}
              className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Supprimer l'utilisateur
            </h3>
            <p className="text-gray-700 mb-4">
              Êtes-vous sûr de vouloir supprimer <strong>{selectedUser.name}</strong>?
              <br />
              <span className="text-sm text-red-600">
                Cette action est irréversible. Tous leurs fichiers seront également supprimés.
              </span>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 text-white rounded-md"
                style={{ backgroundColor: '#DC2626' }}
              >
                Supprimer l'utilisateur
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
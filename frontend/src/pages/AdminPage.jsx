import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMail, FiLock } from 'react-icons/fi';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const AdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: '',
    designation: '',
    managerId: '',
  });

  useEffect(() => {
    if (user?.role === 'director') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await userService.addUser(formData);
      alert(`User added successfully!\nEmail: ${response.data.user.email}\nTemporary Password: ${response.data.user.temporaryPassword}`);
      setFormData({ name: '', email: '', role: 'employee', department: '', designation: '', managerId: '' });
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      alert('Error adding user: ' + error.message);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user? A termination email will be sent.')) {
      try {
        await userService.removeUser(userId);
        fetchUsers();
        alert('User removed successfully');
      } catch (error) {
        alert('Error removing user: ' + error.message);
      }
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true;
    return u.role === filter;
  });

  const managers = users.filter(u => u.role === 'manager');

  if (user?.role !== 'director') {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">Only directors can access this page</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Manage employees, managers, and HR personnel</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus size={20} />
            Add User
          </button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Add New User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g., Engineering"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g., Senior Developer"
                    className="input-field"
                  />
                </div>
                {formData.role === 'employee' && (
                  <div>
                    <label className="form-label">Manager</label>
                    <select
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">Select Manager</option>
                      {managers.map(manager => (
                        <option key={manager._id} value={manager._id}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-semibold mb-2">Note:</p>
                <p>The user will receive a temporary password via email. They can change it on first login.</p>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn-primary">
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {['all', 'employee', 'manager', 'hr'].map(role => (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                filter === role
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Users Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Total Users: {filteredUsers.length}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(userItem => (
                      <tr key={userItem._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{userItem.name}</td>
                        <td className="py-3 px-4 text-gray-600">{userItem.email}</td>
                        <td className="py-3 px-4 capitalize">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            userItem.role === 'employee'
                              ? 'bg-blue-100 text-blue-800'
                              : userItem.role === 'manager'
                              ? 'bg-purple-100 text-purple-800'
                              : userItem.role === 'hr'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{userItem.department || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            userItem.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleRemoveUser(userItem._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove User"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { role: 'employee', label: 'Employees', color: 'bg-blue-100 text-blue-800' },
            { role: 'manager', label: 'Managers', color: 'bg-purple-100 text-purple-800' },
            { role: 'hr', label: 'HR Staff', color: 'bg-green-100 text-green-800' },
          ].map(({ role, label, color }) => (
            <div key={role} className="card text-center">
              <p className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${color} mb-4`}>
                {users.filter(u => u.role === role).length}
              </p>
              <h3 className="font-bold text-gray-900">{label}</h3>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPage;

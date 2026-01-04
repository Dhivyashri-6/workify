import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiBriefcase, FiUsers, FiX } from 'react-icons/fi';
import { userService } from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState([]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    department: user?.department || '',
    designation: user?.designation || '',
    managerId: user?.managerId?._id || user?.managerId || '',
  });

  // Fetch managers for employee role
  useEffect(() => {
    if (user?.role === 'employee' && isEditing) {
      fetchManagers();
    }
  }, [user?.role, isEditing]);

  const fetchManagers = async () => {
    try {
      const response = await userService.getManagers();
      setManagers(response.data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      setManagers([]);
    }
  };

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        dob: user?.dob || '',
        gender: user?.gender || '',
        address: user?.address || '',
        city: user?.city || '',
        state: user?.state || '',
        zipCode: user?.zipCode || '',
        department: user?.department || '',
        designation: user?.designation || '',
        managerId: user?.managerId?._id || user?.managerId || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await userService.updateProfile(formData);
      // Update the user in context
      if (response.data?.user) {
        setUser(response.data.user);
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      setIsEditing(false);
      alert('Profile updated successfully!');
      // Refresh user data
      const profileResponse = await userService.getProfile();
      if (profileResponse.data) {
        setUser(profileResponse.data);
        localStorage.setItem('user', JSON.stringify(profileResponse.data));
      }
    } catch (error) {
      alert('Error updating profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">View and manage your personal information</p>
          </div>
          <button
            onClick={() => {
              if (isEditing) {
                // Reset form data when canceling
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  dob: user?.dob || '',
                  gender: user?.gender || '',
                  address: user?.address || '',
                  city: user?.city || '',
                  state: user?.state || '',
                  zipCode: user?.zipCode || '',
                  department: user?.department || '',
                  designation: user?.designation || '',
                  managerId: user?.managerId?._id || user?.managerId || '',
                });
              }
              setIsEditing(!isEditing);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
              isEditing
                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                : 'btn-primary'
            }`}
          >
            {isEditing ? <FiX size={20} /> : <FiEdit2 size={20} />}
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Card */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <div className="card flex flex-col items-center">
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white mb-4">
              <span className="text-5xl font-bold">{user?.name?.[0]}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600 capitalize">{user?.role}</p>
            <p className="text-sm text-gray-500 mt-2">{user?.email}</p>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2">
            {!isEditing ? (
              <div className="card space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <FiUser className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-semibold text-gray-900">{user?.name || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <FiMail className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{user?.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <FiPhone className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <FiMapPin className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-semibold text-gray-900">{user?.city || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <FiBriefcase className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-semibold text-gray-900">{user?.department || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <FiBriefcase className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Designation</p>
                      <p className="font-semibold text-gray-900">{user?.designation || 'Not provided'}</p>
                    </div>
                  </div>
                  {user?.role === 'employee' && user?.managerId && (
                    <div className="flex items-start gap-4">
                      <FiUsers className="text-primary mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-600">Manager</p>
                        <p className="font-semibold text-gray-900">{user?.managerId?.name || 'Not assigned'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Profile</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
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
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob ? (typeof formData.dob === 'string' ? formData.dob.split('T')[0] : new Date(formData.dob).toISOString().split('T')[0]) : ''}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g., Engineering, HR, Sales"
                    />
                  </div>
                  <div>
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g., Software Engineer, HR Manager"
                    />
                  </div>
                  {user?.role === 'employee' && (
                    <div>
                      <label className="form-label">Manager</label>
                      <select
                        name="managerId"
                        value={formData.managerId}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">No Manager</option>
                        {managers.map(manager => (
                          <option key={manager._id} value={manager._id}>
                            {manager.name} - {manager.department || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>
                
                {/* Role Display (Read-only) */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="form-label text-gray-600">Role (Cannot be changed)</label>
                  <div className="mt-2">
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-primary text-white capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiSave size={20} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Reset form data when canceling
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        dob: user?.dob || '',
                        gender: user?.gender || '',
                        address: user?.address || '',
                        city: user?.city || '',
                        state: user?.state || '',
                        zipCode: user?.zipCode || '',
                        department: user?.department || '',
                        designation: user?.designation || '',
                        managerId: user?.managerId?._id || user?.managerId || '',
                      });
                      setIsEditing(false);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {!isEditing && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Work Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-semibold text-gray-900">{user?.department || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Designation</p>
                  <p className="font-semibold text-gray-900">{user?.designation || 'Not assigned'}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Leave Balance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Casual Leave</span>
                  <span className="font-bold text-primary">{user?.leaveBalance?.casualLeave || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sick Leave</span>
                  <span className="font-bold text-primary">{user?.leaveBalance?.sickLeave || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Earned Leave</span>
                  <span className="font-bold text-primary">{user?.leaveBalance?.earnedLeave || 0} days</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;

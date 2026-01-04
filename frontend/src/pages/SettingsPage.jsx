import React from 'react';
import { FiSettings, FiBell, FiLock, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const SettingsPage = () => {
  const { user } = useAuth();

  const settingsSections = [
    {
      icon: FiBell,
      title: 'Notifications',
      description: 'Manage your notification preferences',
      items: [
        { label: 'Email Notifications', enabled: true },
        { label: 'Leave Approval Alerts', enabled: true },
        { label: 'Holiday Reminders', enabled: false },
      ],
    },
    {
      icon: FiLock,
      title: 'Security',
      description: 'Manage password and security settings',
      items: [
        { label: 'Change Password', action: true },
        { label: 'Two-Factor Authentication', enabled: false },
        { label: 'Login History', action: true },
      ],
    },
    {
      icon: FiSettings,
      title: 'Privacy',
      description: 'Control your privacy and data sharing',
      items: [
        { label: 'Profile Visibility', status: 'Public' },
        { label: 'Share Leave Status', enabled: true },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and settings</p>
        </div>

        {/* Account Information */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Account Information</h2>
          <div className="grid md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Email Address</p>
              <p className="font-semibold text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-semibold text-gray-900 capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-semibold text-gray-900">{user?.department || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-semibold text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <button className="mt-4 btn-primary">Edit Account</button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600 text-sm">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{item.label}</span>
                      {item.enabled !== undefined ? (
                        <label className="relative inline-block w-12 h-6">
                          <input
                            type="checkbox"
                            defaultChecked={item.enabled}
                            className="w-full h-full opacity-0 cursor-pointer"
                          />
                          <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 ${
                            item.enabled ? 'bg-green-500' : 'bg-gray-300'
                          } rounded-full transition-colors`} />
                          <span className={`absolute cursor-pointer top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                            item.enabled ? 'translate-x-6' : ''
                          }`} />
                        </label>
                      ) : item.status ? (
                        <span className="text-gray-600 font-medium">{item.status}</span>
                      ) : (
                        <button className="text-primary hover:text-accent font-medium text-sm">
                          Configure
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave Settings */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Leave Settings</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Casual Leave Balance</p>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${((user?.leaveBalance?.casualLeave || 0) / 12) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 font-bold text-primary">{user?.leaveBalance?.casualLeave || 0}/12</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Sick Leave Balance</p>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600"
                      style={{ width: `${((user?.leaveBalance?.sickLeave || 0) / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 font-bold text-primary">{user?.leaveBalance?.sickLeave || 0}/10</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Earned Leave Balance</p>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600"
                      style={{ width: `${((user?.leaveBalance?.earnedLeave || 0) / 20) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 font-bold text-primary">{user?.leaveBalance?.earnedLeave || 0}/20</span>
              </div>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-start gap-4">
            <FiHelpCircle size={32} className="text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Need Help?</h2>
              <p className="text-gray-700 mb-4">
                For any questions or issues, please contact the HR department or check our documentation.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-all">
                  Contact Support
                </button>
                <button className="px-6 py-2 bg-white text-primary border border-primary rounded-lg font-medium hover:bg-gray-50 transition-all">
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-2 border-red-200 bg-red-50">
          <h2 className="text-2xl font-bold text-red-900 mb-4">Danger Zone</h2>
          <p className="text-red-700 mb-4">
            These actions cannot be undone. Please be careful.
          </p>
          <button className="btn-danger">
            Delete Account
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;

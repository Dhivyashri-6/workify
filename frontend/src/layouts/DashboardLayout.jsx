import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiLogOut, FiHome, FiCalendar, FiUsers, FiSettings, FiFileText, FiUser, FiUserCheck } from 'react-icons/fi';
import { BsBarChart } from 'react-icons/bs';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/leaves', label: 'Leaves', icon: FiCalendar },
    { path: '/profile', label: 'Profile', icon: FiUser },
    { path: '/holidays', label: 'Holidays', icon: FiCalendar },
    user?.role === 'manager' && { path: '/team-leaves', label: 'Team Leaves', icon: FiUsers },
    user?.role === 'hr' && { path: '/approvals', label: 'Approvals', icon: FiFileText },
    user?.role === 'director' && { path: '/admin', label: 'Admin', icon: FiUsers },
    user?.role === 'director' && { path: '/user-management', label: 'User Management', icon: FiUserCheck },
    user?.role === 'director' && { path: '/reports', label: 'Reports', icon: BsBarChart },
    { path: '/settings', label: 'Settings', icon: FiSettings },
  ].filter(Boolean);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-2xl font-bold">WORKIFY</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive(item.path)
                  ? 'bg-accent text-white'
                  : 'text-blue-100 hover:bg-blue-700'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{user?.name?.[0]}</span>
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-blue-200 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
          >
            <FiLogOut size={16} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name}
          </h2>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

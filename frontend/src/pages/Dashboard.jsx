import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiAlertCircle, FiCheckCircle, FiTrendingUp, FiUsers, FiClock } from 'react-icons/fi';
import { leaveService, userService } from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const leaveRes = await leaveService.getMyLeaves();
      setLeaves(leaveRes.data);

      // Calculate stats
      const approved = leaveRes.data.filter(l => l.status === 'director-approved').length;
      const pending = leaveRes.data.filter(l => ['applied', 'manager-approved', 'hr-approved'].includes(l.status)).length;
      const rejected = leaveRes.data.filter(l => l.status === 'rejected').length;

      setStats({ 
        approved, 
        pending, 
        rejected, 
        total: leaveRes.data.length,
        used: approved,
        remaining: (user?.leaveBalance?.casualLeave || 12) - approved
      });

      if (user?.leaveBalance) {
        setLeaveBalance(user.leaveBalance);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && <p className="text-green-600 text-xs font-semibold mt-2">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  const LeaveTypeBar = ({ label, used, total, color }) => {
    const percentage = (used / total) * 100;
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-600">{used} of {total} days</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary via-blue-600 to-blue-500 rounded-xl p-8 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
              <p className="text-blue-100">Manage your leaves, view analytics, and track your team's performance</p>
              <p className="text-blue-200 text-sm mt-2">Role: <span className="font-semibold capitalize">{user?.role}</span></p>
            </div>
            <div className="text-6xl opacity-20">📊</div>
          </div>
        </div>

        {/* Main Statistics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FiCalendar}
            label="Total Applications"
            value={stats.total || 0}
            color="bg-blue-500"
            trend={stats.total > 0 ? "Active requests" : "None yet"}
          />
          <StatCard
            icon={FiCheckCircle}
            label="Approved"
            value={stats.approved || 0}
            color="bg-green-500"
            trend={stats.approved > 0 ? `${stats.approved} confirmed` : "Pending approval"}
          />
          <StatCard
            icon={FiClock}
            label="Pending"
            value={stats.pending || 0}
            color="bg-yellow-500"
            trend={stats.pending > 0 ? "Awaiting decision" : "All resolved"}
          />
          <StatCard
            icon={FiAlertCircle}
            label="Rejected"
            value={stats.rejected || 0}
            color="bg-red-500"
            trend={stats.rejected > 0 ? `${stats.rejected} rejected` : "No rejections"}
          />
        </div>

        {/* Leave Balance & Recent Leaves */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Leave Balance */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FiTrendingUp className="text-primary" size={24} />
              Leave Balance
            </h2>
            <div className="space-y-4">
              <LeaveTypeBar 
                label="Casual Leave" 
                used={stats.used || 0} 
                total={leaveBalance.casualLeave || 12}
                color="bg-blue-500"
              />
              <LeaveTypeBar 
                label="Sick Leave" 
                used={0} 
                total={leaveBalance.sickLeave || 10}
                color="bg-orange-500"
              />
              <LeaveTypeBar 
                label="Earned Leave" 
                used={0} 
                total={leaveBalance.earnedLeave || 20}
                color="bg-green-500"
              />
              {leaveBalance.maternityLeave > 0 && (
                <LeaveTypeBar 
                  label="Maternity Leave" 
                  used={0} 
                  total={leaveBalance.maternityLeave || 180}
                  color="bg-pink-500"
                />
              )}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Total Remaining: </span>
                <span className="text-primary font-bold">{stats.remaining || 12} days</span>
              </p>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Leave Applications</h2>
            {leaves.length === 0 ? (
              <div className="text-center py-12">
                <FiCalendar className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600 font-medium">No leave applications yet</p>
                <p className="text-gray-500 text-sm">Start by applying for a leave</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {leaves.slice(0, 8).map((leave) => (
                  <div key={leave._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {leave.leaveType} • {leave.numberOfDays} days
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                      leave.status === 'director-approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      leave.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        {(user?.role === 'director' || user?.role === 'hr' || user?.role === 'manager') && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
              <FiUsers className="text-purple-600 mb-3" size={28} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Team Management</h3>
              <p className="text-gray-700 mb-4">View and manage your team members, their leaves, and performance metrics.</p>
              <a href="/team-leaves" className="text-purple-600 font-semibold hover:text-purple-700 transition">
                View Team →
              </a>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
              <FiAlertCircle className="text-orange-600 mb-3" size={28} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pending Approvals</h3>
              <p className="text-gray-700 mb-4">Review and approve leave requests from your team or direct reports.</p>
              <a href="/approvals" className="text-orange-600 font-semibold hover:text-orange-700 transition">
                Review Requests →
              </a>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

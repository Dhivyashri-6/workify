import React, { useState, useEffect } from 'react';
import { FiCalendar, FiFilter } from 'react-icons/fi';
import { leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const TeamLeavesPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTeamLeaves();
  }, []);

  const fetchTeamLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getTeamLeaves();
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching team leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    return leave.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'director-approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      case 'applied':
        return 'badge-info';
      default:
        return 'badge-warning';
    }
  };

  const getStatusLabel = (status) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Leaves</h1>
          <p className="text-gray-600 mt-2">View and manage your team's leave requests</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {['all', 'applied', 'manager-approved', 'hr-approved', 'director-approved', 'rejected'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {status === 'all' ? 'All' : getStatusLabel(status)}
              </button>
            )
          )}
        </div>

        {/* Team Leaves Cards */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading team leaves...</p>
            </div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="card flex flex-col items-center justify-center h-96 text-gray-600">
            <FiCalendar size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No leaves found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredLeaves.map((leave) => (
              <div key={leave._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {leave.employeeId?.name || 'Unknown Employee'}
                    </h3>
                    <p className="text-sm text-gray-600">{leave.employeeId?.email}</p>
                  </div>
                  <span className={`badge ${getStatusColor(leave.status)}`}>
                    {getStatusLabel(leave.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Leave Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{leave.leaveType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Days</p>
                    <p className="font-semibold text-gray-900">{leave.numberOfDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">End Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-2">Reason</p>
                  <p className="text-sm text-gray-700">{leave.reason}</p>
                </div>

                {/* Approval Timeline */}
                {leave.approvals && leave.approvals.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 font-bold mb-3">Approval History</p>
                    <div className="space-y-2">
                      {leave.approvals.map((approval, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-1 rounded font-semibold ${
                            approval.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : approval.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {approval.role?.toUpperCase()}
                          </span>
                          <span className="text-gray-600">
                            {approval.approvedAt
                              ? new Date(approval.approvedAt).toLocaleDateString()
                              : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && leaves.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6">
            <div className="card text-center">
              <p className="text-3xl font-bold text-primary">{leaves.length}</p>
              <p className="text-gray-600 mt-2">Total Leaves</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-500">
                {leaves.filter(l => l.status === 'director-approved').length}
              </p>
              <p className="text-gray-600 mt-2">Approved</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-yellow-500">
                {leaves.filter(l => ['applied', 'manager-approved', 'hr-approved'].includes(l.status)).length}
              </p>
              <p className="text-gray-600 mt-2">Pending</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-red-500">
                {leaves.filter(l => l.status === 'rejected').length}
              </p>
              <p className="text-gray-600 mt-2">Rejected</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamLeavesPage;

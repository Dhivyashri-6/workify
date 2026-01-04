import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiPlus, FiFilter } from 'react-icons/fi';
import { leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const LeavesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getMyLeaves();
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600 mt-2">Track and manage your leave requests</p>
          </div>
          <button
            onClick={() => navigate('/apply-leave')}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus size={20} />
            Apply Leave
          </button>
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

        {/* Leaves Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading leaves...</p>
              </div>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-600">
              <FiCalendar size={48} className="mb-4 opacity-50" />
              <p className="text-lg">No leaves found</p>
              <button
                onClick={() => navigate('/apply-leave')}
                className="mt-4 btn-primary"
              >
                Apply for Leave
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Leave Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Days</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => (
                    <tr key={leave._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 capitalize font-medium">{leave.leaveType}</td>
                      <td className="py-3 px-4">{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-semibold">{leave.numberOfDays}</td>
                      <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{leave.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${getStatusColor(leave.status)}`}>
                          {getStatusLabel(leave.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/leave-details/${leave._id}`)}
                          className="text-primary hover:text-accent font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeavesPage;

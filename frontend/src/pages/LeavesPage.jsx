import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiPlus, FiFilter, FiX } from 'react-icons/fi';
import { leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const LeavesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Get available status filters based on user role
  const getAvailableStatusFilters = () => {
    if (user?.role === 'employee') {
      return ['all', 'Pending_TeamLeader', 'Pending_HR', 'Approved', 'Rejected'];
    } else if (user?.role === 'team_lead') {
      return ['all', 'Pending_HR', 'Approved', 'Rejected'];
    } else if (user?.role === 'hr') {
      return ['all', 'Pending_Director', 'Approved', 'Rejected'];
    } 
    return [];
  };

  // Reset filter if current filter is not available for user's role
  useEffect(() => {
    // Simplified: always reset to 'all' on mount or just don't worry about complex role availability
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

  // Filter leaves based on role and selected filter
  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    if (filter === 'Rejected') return leave.status && leave.status.startsWith('Rejected');
    if (filter === 'Approved') return leave.status === 'Approved';
    if (filter.startsWith('Pending')) return leave.status === filter;
    
    return leave.status === filter;
  });

  const getStatusColor = (status) => {
    if (status === 'Approved') return 'badge-success';
    if (status && status.startsWith('Rejected')) return 'badge-danger';
    if (status && status.startsWith('Pending')) return 'badge-warning';
    return 'badge-secondary';
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ');
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
            className={`btn-primary flex items-center gap-2 ${user?.role === 'director' ? 'hidden' : ''}`}
          >
            <FiPlus size={20} />
            Apply Leave
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {getAvailableStatusFilters().map(
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
                          onClick={() => setSelectedLeave(leave)}
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

        {/* Leave Details Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                <h3 className="text-xl font-bold text-gray-900">Leave Details</h3>
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <FiX size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  selectedLeave.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                  selectedLeave.status.startsWith('Rejected') ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    selectedLeave.status === 'Approved' ? 'bg-green-500' :
                    selectedLeave.status.startsWith('Rejected') ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="font-semibold">{getStatusLabel(selectedLeave.status)}</span>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Leave Type</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedLeave.leaveType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Duration</p>
                    <p className="font-medium text-gray-900">{selectedLeave.numberOfDays} Days</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From</p>
                    <p className="font-medium text-gray-900">{new Date(selectedLeave.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To</p>
                    <p className="font-medium text-gray-900">{new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reason for Leave</p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 text-sm leading-relaxed">
                    {selectedLeave.reason}
                  </div>
                </div>

                {/* Rejection Details (if applicable) */}
                {selectedLeave.status.startsWith('Rejected') && (
                  <div className="animate-fade-in">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Rejection Reason</p>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <p className="text-red-800 font-medium mb-1">
                        Returned by {selectedLeave.status.split('_').pop()}
                      </p>
                      <p className="text-red-700 text-sm">
                        {selectedLeave.rejectionReason || "No comments provided."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approval Comments (if any) */}
                {selectedLeave.approvals && selectedLeave.approvals.length > 0 && (
                  <div>
                     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Approval History</p>
                     <div className="space-y-3">
                        {selectedLeave.approvals.map((approval, index) => (
                          <div key={index} className="flex gap-3 text-sm border-l-2 border-gray-200 pl-3 py-1">
                            <div>
                               <p className="font-semibold text-gray-700 capitalize">{approval.role}</p>
                               <p className="text-xs text-gray-500">{new Date(approval.approvedAt).toLocaleDateString()}</p>
                               {approval.comments && <p className="text-gray-600 mt-1">"{approval.comments}"</p>}
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all focus:ring-2 focus:ring-gray-300 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LeavesPage;

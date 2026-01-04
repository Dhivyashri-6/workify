import React, { useState, useEffect } from 'react';
import { FiCalendar, FiCheck, FiX } from 'react-icons/fi';
import { leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const LeaveApprovalsPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [approvalData, setApprovalData] = useState({ comments: '' });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getLeaveRequests();
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      await leaveService.approveLeave(leaveId, approvalData);
      alert('Leave approved successfully!');
      setSelectedLeave(null);
      setApprovalData({ comments: '' });
      fetchLeaveRequests();
    } catch (error) {
      alert('Error approving leave: ' + error.message);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await leaveService.rejectLeave(leaveId, approvalData);
      alert('Leave rejected successfully!');
      setSelectedLeave(null);
      setApprovalData({ comments: '' });
      fetchLeaveRequests();
    } catch (error) {
      alert('Error rejecting leave: ' + error.message);
    }
  };

  const getApprovalChain = (leave) => {
    return leave.approvals || [];
  };

  const getNextApprover = (leave) => {
    switch (user?.role) {
      case 'manager':
        return 'Manager';
      case 'hr':
        return 'HR';
      case 'director':
        return 'Director';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve pending leave requests</p>
        </div>

        {/* Pending Leaves */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leave requests...</p>
            </div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="card flex flex-col items-center justify-center h-96 text-gray-600">
            <FiCalendar size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No pending leave requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaves.map((leave) => (
              <div
                key={leave._id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedLeave(leave._id)}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        {leave.employeeId?.name || 'Unknown Employee'}
                      </h3>
                      <p className="text-sm text-gray-600">{leave.employeeId?.email}</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Leave Type</p>
                        <p className="font-semibold text-gray-900 capitalize">{leave.leaveType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Days</p>
                        <p className="font-semibold text-gray-900">{leave.numberOfDays} days</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <p className="text-xs text-gray-600">Reason</p>
                      <p className="text-sm text-gray-900">{leave.reason}</p>
                    </div>

                    {/* Approval Timeline */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-600 font-bold mb-3">Approval Timeline</p>
                      <div className="space-y-2">
                        {(() => {
                          const employeeRole = leave.employeeId?.role || 'employee';
                          let rolesToShow = [];
                          
                          if (employeeRole === 'employee') {
                            // Employee workflow: Manager → HR → Director
                            rolesToShow = ['manager', 'hr', 'director'];
                          } else if (employeeRole === 'manager' || employeeRole === 'hr') {
                            // Manager/HR workflow: Direct to Director
                            rolesToShow = ['director'];
                          } else {
                            rolesToShow = ['director'];
                          }
                          
                          return rolesToShow.map((role) => {
                            const approval = leave.approvals?.find(a => a.role === role);
                            return (
                              <div key={role} className="flex items-center gap-3 text-sm">
                                <div className="w-24 font-medium capitalize text-gray-700">{role}</div>
                                {approval ? (
                                  <>
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
                                        approval.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                                      }`}
                                    >
                                      {approval.status === 'approved' ? <FiCheck size={14} /> : <FiX size={14} />}
                                    </div>
                                    <span className={approval.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
                                      {approval.status.toUpperCase()}
                                    </span>
                                    {approval.comments && (
                                      <span className="text-xs text-gray-500 ml-2">({approval.comments})</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                    <span className="text-gray-500">PENDING</span>
                                  </>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    
                    {/* Show employee role for context */}
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        Employee Role: <span className="font-semibold capitalize">{leave.employeeId?.role || 'employee'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedLeave === leave._id && (() => {
                  const employeeRole = leave.employeeId?.role || 'employee';
                  let canApprove = false;
                  
                  // Check if current user can approve this leave
                  if (user?.role === 'manager') {
                    canApprove = employeeRole === 'employee' && leave.status === 'applied';
                  } else if (user?.role === 'hr') {
                    canApprove = employeeRole === 'employee' && leave.status === 'manager-approved';
                  } else if (user?.role === 'director') {
                    if (employeeRole === 'employee') {
                      canApprove = leave.status === 'hr-approved';
                    } else if (employeeRole === 'manager' || employeeRole === 'hr') {
                      canApprove = leave.status === 'applied';
                    }
                  }
                  
                  if (!canApprove) {
                    return (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          This leave is not ready for your approval. Current status: <span className="font-semibold">{leave.status}</span>
                        </p>
                        <button
                          onClick={() => {
                            setSelectedLeave(null);
                            setApprovalData({ comments: '' });
                          }}
                          className="mt-4 px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-all"
                        >
                          Close
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="mb-4">
                        <label className="form-label">Approval Comments (Optional)</label>
                        <textarea
                          value={approvalData.comments}
                          onChange={(e) => setApprovalData({ comments: e.target.value })}
                          placeholder="Add your comments for approval/rejection"
                          className="input-field"
                          rows="3"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveLeave(leave._id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-all"
                        >
                          <FiCheck size={20} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectLeave(leave._id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-all"
                        >
                          <FiX size={20} />
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLeave(null);
                            setApprovalData({ comments: '' });
                          }}
                          className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LeaveApprovalsPage;

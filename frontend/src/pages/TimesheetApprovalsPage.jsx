import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiCheck, FiX, FiFilter, FiUser, FiCalendar, FiCheckSquare } from 'react-icons/fi';
import { timesheetService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

/**
 * TimesheetApprovalsPage - Manager Approval Dashboard
 * Allows managers to view, approve, and reject team members' timesheets
 */
const TimesheetApprovalsPage = () => {
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // For batch operations
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modal state for rejection comments
  const [rejectModal, setRejectModal] = useState({ open: false, timesheetId: null, comments: '' });
  
  // Filters
  const [filters, setFilters] = useState({
    employeeId: '',
    status: 'Submitted', // Default to pending
    startDate: '',
    endDate: '',
  });

  /**
   * Fetch team members for filter dropdown
   */
  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await userService.getTeamMembers();
      setTeamMembers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  }, []);

  /**
   * Fetch timesheets for approval
   */
  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await timesheetService.getTeamTimesheets(filters);
      setTimesheets(response.data.timesheets || []);
    } catch (err) {
      setError('Failed to load timesheets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  /**
   * Handle single timesheet approval
   */
  const handleApprove = async (timesheetId) => {
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      await timesheetService.approveTimesheet(timesheetId, { comments: 'Approved' });
      setSuccess('Timesheet approved successfully!');
      fetchTimesheets();
      setSelectedIds(prev => prev.filter(id => id !== timesheetId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error approving timesheet');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Handle single timesheet rejection
   */
  const handleReject = async () => {
    if (!rejectModal.comments.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      await timesheetService.rejectTimesheet(rejectModal.timesheetId, { 
        comments: rejectModal.comments 
      });
      setSuccess('Timesheet rejected');
      setRejectModal({ open: false, timesheetId: null, comments: '' });
      fetchTimesheets();
      setSelectedIds(prev => prev.filter(id => id !== rejectModal.timesheetId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting timesheet');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Handle batch approval
   */
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      await timesheetService.approveBatchTimesheets(selectedIds, 'Batch approved');
      setSuccess(`${selectedIds.length} timesheet(s) approved successfully!`);
      setSelectedIds([]);
      fetchTimesheets();
    } catch (err) {
      setError(err.response?.data?.message || 'Error approving timesheets');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Toggle selection for batch operations
   */
  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  /**
   * Select/deselect all submitted timesheets
   */
  const toggleSelectAll = () => {
    const submittedIds = timesheets
      .filter(ts => ts.status === 'Submitted')
      .map(ts => ts._id);
    
    if (selectedIds.length === submittedIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submittedIds);
    }
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    const styles = {
      Draft: 'bg-gray-100 text-gray-800',
      Submitted: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return styles[status] || styles.Draft;
  };

  /**
   * Group timesheets by employee for better organization
   */
  const groupedByEmployee = timesheets.reduce((groups, ts) => {
    const empId = ts.employeeId?._id || 'unknown';
    const empName = ts.employeeId?.name || 'Unknown Employee';
    if (!groups[empId]) {
      groups[empId] = { name: empName, email: ts.employeeId?.email, entries: [] };
    }
    groups[empId].entries.push(ts);
    return groups;
  }, {});

  // Calculate summary stats
  const pendingCount = timesheets.filter(ts => ts.status === 'Submitted').length;
  const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FiClock className="text-primary" />
            Timesheet Approvals
          </h1>
          <p className="text-gray-600 mt-1">Review and manage team timesheet submissions</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-600 font-medium">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-700">{pendingCount}</p>
          </div>
          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total Entries</p>
            <p className="text-3xl font-bold text-blue-700">{timesheets.length}</p>
          </div>
          <div className="card bg-green-50 border border-green-200">
            <p className="text-sm text-green-600 font-medium">Total Hours</p>
            <p className="text-3xl font-bold text-green-700">{totalHours.toFixed(1)}</p>
          </div>
          <div className="card bg-purple-50 border border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Team Members</p>
            <p className="text-3xl font-bold text-purple-700">{Object.keys(groupedByEmployee).length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <span className="text-sm text-gray-500">Filters:</span>
            </div>
            
            {/* Employee Filter */}
            <div className="flex items-center gap-2">
              <FiUser className="text-gray-400" size={18} />
              <select
                value={filters.employeeId}
                onChange={(e) => setFilters(prev => ({ ...prev, employeeId: e.target.value }))}
                className="input-field py-2"
              >
                <option value="">All Employees</option>
                {teamMembers.map(member => (
                  <option key={member._id} value={member._id}>{member.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field py-2"
            >
              <option value="">All Status</option>
              <option value="Submitted">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-400" size={18} />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="input-field py-2"
                placeholder="From"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="input-field py-2"
                placeholder="To"
              />
            </div>
          </div>
        </div>

        {/* Batch Actions */}
        {pendingCount > 0 && (
          <div className="card bg-blue-50 border border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
                >
                  <FiCheckSquare />
                  {selectedIds.length === pendingCount ? 'Deselect All' : 'Select All Pending'}
                </button>
                {selectedIds.length > 0 && (
                  <span className="text-sm text-blue-600">
                    {selectedIds.length} selected
                  </span>
                )}
              </div>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBatchApprove}
                  disabled={processing}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiCheck />
                  {processing ? 'Processing...' : `Approve Selected (${selectedIds.length})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Timesheets List */}
        <div className="space-y-6">
          {loading ? (
            <div className="card text-center py-12 text-gray-500">Loading timesheets...</div>
          ) : Object.keys(groupedByEmployee).length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <FiClock size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No timesheets found</p>
              <p className="text-sm mt-2">No matching timesheet entries for the selected filters</p>
            </div>
          ) : (
            Object.entries(groupedByEmployee).map(([empId, data]) => {
              const empTotalHours = data.entries.reduce((sum, e) => sum + e.totalHours, 0);
              const empPendingCount = data.entries.filter(e => e.status === 'Submitted').length;
              
              return (
                <div key={empId} className="card">
                  {/* Employee Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        {data.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{data.name}</p>
                        <p className="text-sm text-gray-500">{data.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total: {empTotalHours.toFixed(1)} hrs</p>
                      {empPendingCount > 0 && (
                        <p className="text-sm text-yellow-600">{empPendingCount} pending</p>
                      )}
                    </div>
                  </div>

                  {/* Entries Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-10">
                            <input
                              type="checkbox"
                              checked={data.entries
                                .filter(e => e.status === 'Submitted')
                                .every(e => selectedIds.includes(e._id))}
                              onChange={() => {
                                const ids = data.entries
                                  .filter(e => e.status === 'Submitted')
                                  .map(e => e._id);
                                const allSelected = ids.every(id => selectedIds.includes(id));
                                if (allSelected) {
                                  setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
                                } else {
                                  setSelectedIds(prev => [...new Set([...prev, ...ids])]);
                                }
                              }}
                              className="rounded"
                            />
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Project</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Task</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Time</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Hours</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.entries
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((entry) => (
                            <tr key={entry._id} className="hover:bg-gray-50">
                              <td className="px-3 py-3">
                                {entry.status === 'Submitted' && (
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(entry._id)}
                                    onChange={() => toggleSelection(entry._id)}
                                    className="rounded"
                                  />
                                )}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {new Date(entry.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                              <td className="px-3 py-3">
                                <span className="font-medium text-gray-900">{entry.projectName}</span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="text-gray-600">{entry.taskName}</span>
                                {entry.notes && (
                                  <p className="text-xs text-gray-400 truncate max-w-xs">{entry.notes}</p>
                                )}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {entry.startTime} - {entry.endTime}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`font-medium ${entry.isOvertime ? 'text-orange-600' : 'text-gray-900'}`}>
                                  {entry.totalHours} hrs
                                </span>
                                {entry.isOvertime && (
                                  <span className="text-xs text-orange-500 block">OT</span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(entry.status)}`}>
                                  {entry.status}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                {entry.status === 'Submitted' && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleApprove(entry._id)}
                                      disabled={processing}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                      title="Approve"
                                    >
                                      <FiCheck size={18} />
                                    </button>
                                    <button
                                      onClick={() => setRejectModal({ 
                                        open: true, 
                                        timesheetId: entry._id, 
                                        comments: '' 
                                      })}
                                      disabled={processing}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Reject"
                                    >
                                      <FiX size={18} />
                                    </button>
                                  </div>
                                )}
                                {entry.status === 'Approved' && (
                                  <span className="text-xs text-green-600">
                                    By {entry.approvedBy?.name || 'Manager'}
                                  </span>
                                )}
                                {entry.status === 'Rejected' && entry.managerComments && (
                                  <span className="text-xs text-red-600" title={entry.managerComments}>
                                    {entry.managerComments.substring(0, 20)}...
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rejection Modal */}
        {rejectModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Timesheet</h3>
              <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
              <textarea
                value={rejectModal.comments}
                onChange={(e) => setRejectModal(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Enter rejection reason..."
                className="input-field resize-none mb-4"
                rows="4"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRejectModal({ open: false, timesheetId: null, comments: '' })}
                  className="btn-secondary"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="btn-primary bg-red-600 hover:bg-red-700"
                  disabled={processing || !rejectModal.comments.trim()}
                >
                  {processing ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TimesheetApprovalsPage;

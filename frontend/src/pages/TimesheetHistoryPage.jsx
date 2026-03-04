import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiPlus, FiFilter, FiCalendar, FiChevronLeft, FiChevronRight, FiEye } from 'react-icons/fi';
import { timesheetService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

/**
 * TimesheetHistoryPage - Employee Timesheet History View
 * Displays daily/weekly timesheet entries with status and filters
 */
const TimesheetHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [viewMode, setViewMode] = useState('weekly'); // 'daily' | 'weekly'
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    return monday.toISOString().split('T')[0];
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });

  // Statistics
  const [stats, setStats] = useState({
    totalHours: 0,
    overtimeHours: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    draftCount: 0,
  });

  /**
   * Get week range from a start date
   */
  const getWeekRange = (startDate) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  /**
   * Navigate to previous/next week
   */
  const navigateWeek = (direction) => {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(current.toISOString().split('T')[0]);
  };

  /**
   * Fetch timesheets with filters
   */
  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    try {
      let params = { ...filters };
      
      if (viewMode === 'weekly') {
        const weekRange = getWeekRange(selectedWeek);
        params.startDate = weekRange.startDate;
        params.endDate = weekRange.endDate;
      }

      const response = await timesheetService.getMyTimesheets(params);
      const data = response.data.timesheets || [];
      setTimesheets(data);
      setPagination(response.data.pagination || { total: data.length, page: 1, pages: 1 });

      // Calculate statistics
      const stats = data.reduce((acc, ts) => {
        acc.totalHours += ts.totalHours;
        acc.overtimeHours += ts.overtimeHours || 0;
        if (ts.status === 'Draft') acc.draftCount++;
        if (ts.status === 'Submitted') acc.pendingCount++;
        if (ts.status === 'Approved') acc.approvedCount++;
        if (ts.status === 'Rejected') acc.rejectedCount++;
        return acc;
      }, { totalHours: 0, overtimeHours: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0, draftCount: 0 });

      setStats({
        ...stats,
        totalHours: Math.round(stats.totalHours * 100) / 100,
        overtimeHours: Math.round(stats.overtimeHours * 100) / 100,
      });
    } catch (err) {
      console.error('Failed to fetch timesheets:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, viewMode, selectedWeek]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  /**
   * Group timesheets by date for display
   */
  const groupedByDate = timesheets.reduce((groups, ts) => {
    const date = new Date(ts.date).toISOString().split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(ts);
    return groups;
  }, {});

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
   * Format date for display
   */
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Format week range for display
   */
  const formatWeekRange = () => {
    const { startDate, endDate } = getWeekRange(selectedWeek);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FiClock className="text-primary" />
              Timesheet History
            </h1>
            <p className="text-gray-600 mt-1">View and manage your timesheet entries</p>
          </div>
          <button
            onClick={() => navigate('/timesheet-entry')}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus />
            New Entry
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="card bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total Hours</p>
            <p className="text-2xl font-bold text-blue-700">{stats.totalHours}</p>
          </div>
          <div className="card bg-orange-50 border border-orange-200">
            <p className="text-sm text-orange-600 font-medium">Overtime</p>
            <p className="text-2xl font-bold text-orange-700">{stats.overtimeHours}</p>
          </div>
          <div className="card bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600 font-medium">Drafts</p>
            <p className="text-2xl font-bold text-gray-700">{stats.draftCount}</p>
          </div>
          <div className="card bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pendingCount}</p>
          </div>
          <div className="card bg-green-50 border border-green-200">
            <p className="text-sm text-green-600 font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-700">{stats.approvedCount}</p>
          </div>
          <div className="card bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejectedCount}</p>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'weekly' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'daily' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Week Navigation (only visible in weekly mode) */}
            {viewMode === 'weekly' && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-400" />
                  <span className="font-medium text-gray-900">{formatWeekRange()}</span>
                </div>
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={new Date(selectedWeek) >= new Date()}
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="input-field py-2"
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timesheets List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading timesheets...</div>
          ) : Object.keys(groupedByDate).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiClock size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No timesheet entries found</p>
              <p className="text-sm mt-2">Start logging your work hours</p>
              <button
                onClick={() => navigate('/timesheet-entry')}
                className="btn-primary mt-4"
              >
                Add Entry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDate)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .map(([date, entries]) => {
                  const dayTotal = entries.reduce((sum, e) => sum + e.totalHours, 0);
                  const dayOvertime = entries.reduce((sum, e) => sum + (e.overtimeHours || 0), 0);
                  
                  return (
                    <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Date Header */}
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-gray-900">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="ml-4 text-sm text-gray-500">
                            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700">
                            Total: <span className="text-primary">{dayTotal.toFixed(2)} hrs</span>
                          </span>
                          {dayOvertime > 0 && (
                            <span className="text-sm font-medium text-orange-600">
                              +{dayOvertime.toFixed(2)} OT
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Entries Table */}
                      <table className="w-full">
                        <thead className="bg-gray-50 border-t border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Project</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Task</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Time</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Hours</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {entries.map((entry) => (
                            <tr key={entry._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="font-medium text-gray-900">{entry.projectName}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-gray-600">{entry.taskName}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {entry.startTime} - {entry.endTime}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-medium ${entry.isOvertime ? 'text-orange-600' : 'text-gray-900'}`}>
                                  {entry.totalHours} hrs
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(entry.status)}`}>
                                  {entry.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => navigate(`/timesheet-entry?date=${date}`)}
                                  className="text-primary hover:text-blue-700 flex items-center gap-1 text-sm"
                                >
                                  <FiEye size={14} /> View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TimesheetHistoryPage;

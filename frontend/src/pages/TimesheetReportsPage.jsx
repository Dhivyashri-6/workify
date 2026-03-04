import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiBarChart2, FiPieChart, FiCalendar, FiDownload, FiTrendingUp } from 'react-icons/fi';
import { timesheetService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

/**
 * TimesheetReportsPage - Timesheet Reports Dashboard
 * Shows various reports: employee hours, project hours, weekly summary
 */
const TimesheetReportsPage = () => {
  const { user } = useAuth();
  const isManager = ['team_lead', 'hr', 'director'].includes(user?.role);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' | 'project' | 'weekly'
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Report data
  const [employeeReport, setEmployeeReport] = useState([]);
  const [projectReport, setProjectReport] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: (() => {
      const date = new Date();
      date.setDate(1); // First day of current month
      return date.toISOString().split('T')[0];
    })(),
    endDate: new Date().toISOString().split('T')[0],
    employeeId: '',
  });

  // Summary stats
  const [summary, setSummary] = useState({
    totalHours: 0,
    overtimeHours: 0,
    avgHoursPerDay: 0,
    totalEntries: 0,
  });

  /**
   * Fetch team members for filter
   */
  const fetchTeamMembers = useCallback(async () => {
    if (!isManager) return;
    try {
      const response = await userService.getTeamMembers();
      setTeamMembers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  }, [isManager]);

  /**
   * Fetch employee hours report
   */
  const fetchEmployeeReport = useCallback(async () => {
    try {
      const response = await timesheetService.getEmployeeHoursReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        employeeId: filters.employeeId || undefined,
      });
      setEmployeeReport(response.data || []);
      
      // Calculate summary
      const totals = (response.data || []).reduce((acc, emp) => {
        acc.totalHours += emp.totalHours;
        acc.overtimeHours += emp.overtimeHours;
        acc.totalEntries += emp.entriesCount;
        return acc;
      }, { totalHours: 0, overtimeHours: 0, totalEntries: 0 });
      
      const daysDiff = Math.ceil(
        (new Date(filters.endDate) - new Date(filters.startDate)) / (1000 * 60 * 60 * 24)
      ) + 1;
      
      setSummary({
        ...totals,
        avgHoursPerDay: daysDiff > 0 ? (totals.totalHours / daysDiff).toFixed(1) : 0,
      });
    } catch (err) {
      console.error('Failed to fetch employee report:', err);
    }
  }, [filters]);

  /**
   * Fetch project hours report
   */
  const fetchProjectReport = useCallback(async () => {
    try {
      const response = await timesheetService.getProjectHoursReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        employeeId: filters.employeeId || undefined,
      });
      setProjectReport(response.data || []);
    } catch (err) {
      console.error('Failed to fetch project report:', err);
    }
  }, [filters]);

  /**
   * Fetch weekly summary report
   */
  const fetchWeeklyReport = useCallback(async () => {
    try {
      const response = await timesheetService.getWeeklySummaryReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        employeeId: filters.employeeId || undefined,
      });
      setWeeklyReport(response.data || []);
    } catch (err) {
      console.error('Failed to fetch weekly report:', err);
    }
  }, [filters]);

  /**
   * Fetch all reports
   */
  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchEmployeeReport(),
      fetchProjectReport(),
      fetchWeeklyReport(),
    ]);
    setLoading(false);
  }, [fetchEmployeeReport, fetchProjectReport, fetchWeeklyReport]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  /**
   * Calculate percentage for progress bars
   */
  const getPercentage = (value, max) => {
    if (max === 0) return 0;
    return Math.min((value / max) * 100, 100);
  };

  /**
   * Get color based on hours
   */
  const getHoursColor = (hours, target = 40) => {
    const percentage = (hours / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  /**
   * Export report as CSV
   */
  const exportToCSV = () => {
    let data = [];
    let filename = '';
    
    if (activeTab === 'employee') {
      filename = 'employee_hours_report.csv';
      data = employeeReport.map(emp => ({
        Employee: emp.employeeName,
        Email: emp.employeeEmail,
        Department: emp.department || 'N/A',
        'Total Hours': emp.totalHours,
        'Overtime Hours': emp.overtimeHours,
        'Entries': emp.entriesCount,
      }));
    } else if (activeTab === 'project') {
      filename = 'project_hours_report.csv';
      data = projectReport.map(proj => ({
        Project: proj.projectName,
        'Total Hours': proj.totalHours,
        'Overtime Hours': proj.overtimeHours,
        Entries: proj.entriesCount,
        'Unique Employees': proj.uniqueEmployees,
      }));
    } else {
      filename = 'weekly_summary_report.csv';
      data = weeklyReport.map(week => ({
        Week: `Week ${week.week}`,
        Year: week.year,
        'Total Hours': week.totalHours,
        'Overtime Hours': week.overtimeHours,
        Entries: week.entriesCount,
      }));
    }
    
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Find max hours for scaling progress bars
  const maxEmployeeHours = Math.max(...employeeReport.map(e => e.totalHours), 1);
  const maxProjectHours = Math.max(...projectReport.map(p => p.totalHours), 1);
  const maxWeeklyHours = Math.max(...weeklyReport.map(w => w.totalHours), 1);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FiBarChart2 className="text-primary" />
              Timesheet Reports
            </h1>
            <p className="text-gray-600 mt-1">Analyze time tracking data and productivity</p>
          </div>
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <FiDownload />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Hours</p>
                <p className="text-3xl font-bold mt-1">{summary.totalHours.toFixed(1)}</p>
              </div>
              <FiClock size={32} className="text-blue-200" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Overtime</p>
                <p className="text-3xl font-bold mt-1">{summary.overtimeHours.toFixed(1)}</p>
              </div>
              <FiTrendingUp size={32} className="text-orange-200" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Avg/Day</p>
                <p className="text-3xl font-bold mt-1">{summary.avgHoursPerDay}</p>
              </div>
              <FiCalendar size={32} className="text-green-200" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Entries</p>
                <p className="text-3xl font-bold mt-1">{summary.totalEntries}</p>
              </div>
              <FiPieChart size={32} className="text-purple-200" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-400" />
              <span className="text-sm text-gray-500">Date Range:</span>
            </div>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field py-2"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field py-2"
            />
            
            {isManager && (
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
            )}
          </div>
        </div>

        {/* Report Tabs */}
        <div className="card">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('employee')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'employee'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiBarChart2 className="inline mr-2" />
              Employee Hours
            </button>
            <button
              onClick={() => setActiveTab('project')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'project'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiPieChart className="inline mr-2" />
              Project Hours
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'weekly'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiCalendar className="inline mr-2" />
              Weekly Summary
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading report data...</div>
          ) : (
            <>
              {/* Employee Hours Report */}
              {activeTab === 'employee' && (
                <div className="space-y-4">
                  {employeeReport.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No data available for the selected period
                    </div>
                  ) : (
                    employeeReport.map((emp, index) => (
                      <div key={emp.employeeId || index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                              {emp.employeeName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{emp.employeeName}</p>
                              <p className="text-sm text-gray-500">{emp.department || 'No department'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">{emp.totalHours.toFixed(1)} hrs</p>
                            {emp.overtimeHours > 0 && (
                              <p className="text-sm text-orange-600">+{emp.overtimeHours.toFixed(1)} OT</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getHoursColor(emp.totalHours)} transition-all duration-500`}
                              style={{ width: `${getPercentage(emp.totalHours, maxEmployeeHours)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{emp.entriesCount} entries</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Project Hours Report */}
              {activeTab === 'project' && (
                <div className="space-y-4">
                  {projectReport.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No data available for the selected period
                    </div>
                  ) : (
                    projectReport.map((proj, index) => (
                      <div key={proj.projectName || index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{proj.projectName}</p>
                            <p className="text-sm text-gray-500">{proj.uniqueEmployees} team member(s)</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">{proj.totalHours.toFixed(1)} hrs</p>
                            {proj.overtimeHours > 0 && (
                              <p className="text-sm text-orange-600">+{proj.overtimeHours.toFixed(1)} OT</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${getPercentage(proj.totalHours, maxProjectHours)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{proj.entriesCount} entries</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Weekly Summary Report */}
              {activeTab === 'weekly' && (
                <div className="space-y-4">
                  {weeklyReport.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No data available for the selected period
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Week</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Period</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total Hours</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Overtime</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Entries</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {weeklyReport.map((week, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="font-medium text-gray-900">Week {week.week}</span>
                                <span className="text-sm text-gray-500 ml-2">{week.year}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {week.startDate && new Date(week.startDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                                {' - '}
                                {week.endDate && new Date(week.endDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-gray-900">{week.totalHours.toFixed(1)} hrs</span>
                              </td>
                              <td className="px-4 py-3">
                                {week.overtimeHours > 0 ? (
                                  <span className="text-orange-600 font-medium">+{week.overtimeHours.toFixed(1)}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-600">{week.entriesCount}</td>
                              <td className="px-4 py-3 w-40">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${getPercentage(week.totalHours, maxWeeklyHours)}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TimesheetReportsPage;

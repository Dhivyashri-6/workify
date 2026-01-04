import React, { useState, useEffect } from 'react';
import { FiDownload, FiBarChart2 } from 'react-icons/fi';
import { reportService, leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const ReportsPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overall');
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (user?.role === 'director') {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getLeaveReport();
      setLeaves(response.data);

      // Calculate stats
      let totalApproved = 0;
      let totalRejected = 0;
      let totalPending = 0;
      let totalDays = 0;

      response.data.forEach(item => {
        item.leaves.forEach(leave => {
          totalDays += leave.numberOfDays;
          if (leave.status === 'director-approved') {
            totalApproved++;
          } else if (leave.status === 'rejected') {
            totalRejected++;
          } else {
            totalPending++;
          }
        });
      });

      setStats({
        totalEmployees: response.data.length,
        totalLeaves: response.data.reduce((acc, emp) => acc + emp.leaves.length, 0),
        approved: totalApproved,
        rejected: totalRejected,
        pending: totalPending,
        totalDays,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (type) => {
    try {
      const response = await reportService.downloadReport(type);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leave-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      alert('Error downloading report: ' + error.message);
    }
  };

  if (user?.role !== 'director') {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">Only directors can access this page</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Reports</h1>
          <p className="text-gray-600 mt-2">Analytics and reports on leave management</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="card text-center">
            <p className="text-4xl font-bold text-primary">{stats.totalEmployees || 0}</p>
            <p className="text-gray-600 text-sm mt-2">Total Employees</p>
          </div>
          <div className="card text-center">
            <p className="text-4xl font-bold text-blue-500">{stats.totalLeaves || 0}</p>
            <p className="text-gray-600 text-sm mt-2">Total Leaves</p>
          </div>
          <div className="card text-center">
            <p className="text-4xl font-bold text-green-500">{stats.approved || 0}</p>
            <p className="text-gray-600 text-sm mt-2">Approved</p>
          </div>
          <div className="card text-center">
            <p className="text-4xl font-bold text-yellow-500">{stats.pending || 0}</p>
            <p className="text-gray-600 text-sm mt-2">Pending</p>
          </div>
          <div className="card text-center">
            <p className="text-4xl font-bold text-red-500">{stats.rejected || 0}</p>
            <p className="text-gray-600 text-sm mt-2">Rejected</p>
          </div>
        </div>

        {/* Download Reports */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Download Reports</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => handleDownloadReport('overall')}
              className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-all"
            >
              <FiDownload size={32} className="text-primary" />
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Overall Leave Report</h3>
                <p className="text-sm text-gray-600">All employees and their leaves</p>
              </div>
            </button>
            <button
              onClick={() => handleDownloadReport('employee')}
              className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-all"
            >
              <FiDownload size={32} className="text-primary" />
              <div className="text-left">
                <h3 className="font-bold text-gray-900">My Leave Report</h3>
                <p className="text-sm text-gray-600">Your personal leave records</p>
              </div>
            </button>
          </div>
        </div>

        {/* Employee Wise Report */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Employee-wise Leave Summary</h2>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading reports...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee Name</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Leaves</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Approved</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Pending</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Rejected</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Days</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((emp) => {
                    const approved = emp.leaves.filter(l => l.status === 'director-approved').length;
                    const rejected = emp.leaves.filter(l => l.status === 'rejected').length;
                    const pending = emp.leaves.filter(l =>
                      ['applied', 'manager-approved', 'hr-approved'].includes(l.status)
                    ).length;
                    const totalDays = emp.leaves.reduce((sum, l) => sum + l.numberOfDays, 0);

                    return (
                      <tr key={emp.employeeId} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{emp.name}</td>
                        <td className="text-center py-3 px-4">{emp.leaves.length}</td>
                        <td className="text-center py-3 px-4">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold">
                            {approved}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">
                            {pending}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold">
                            {rejected}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 font-semibold text-primary">{totalDays}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;

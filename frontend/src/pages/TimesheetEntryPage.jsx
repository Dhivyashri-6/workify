import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiPlus, FiTrash2, FiSend, FiSave, FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import { timesheetService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

/**
 * TimesheetEntryPage - Employee Timesheet Entry Form
 * Allows employees to create, edit, and submit daily timesheet entries
 */
const TimesheetEntryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [dailySummary, setDailySummary] = useState({ totalHours: 0, overtimeHours: 0 });
  
  // Standard working hours for overtime calculation
  const STANDARD_HOURS = 8;

  // Form state for new/edit entry
  const [formData, setFormData] = useState({
    projectName: '',
    taskName: '',
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
  });

  /**
   * Calculate hours between start and end time
   */
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 0) durationMinutes += 24 * 60;
    
    return Math.round((durationMinutes / 60) * 100) / 100;
  };

  // Auto-calculate hours when times change
  const calculatedHours = calculateHours(formData.startTime, formData.endTime);

  /**
   * Fetch entries for selected date
   */
  const fetchDayEntries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await timesheetService.getMyTimesheets({
        startDate: selectedDate,
        endDate: selectedDate,
      });
      setEntries(response.data.timesheets || []);
      
      // Calculate daily summary
      const total = (response.data.timesheets || []).reduce((sum, entry) => sum + entry.totalHours, 0);
      setDailySummary({
        totalHours: Math.round(total * 100) / 100,
        overtimeHours: total > STANDARD_HOURS ? Math.round((total - STANDARD_HOURS) * 100) / 100 : 0,
      });
    } catch (err) {
      setError('Failed to load timesheet entries');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDayEntries();
  }, [fetchDayEntries]);

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      projectName: '',
      taskName: '',
      startTime: '09:00',
      endTime: '17:00',
      notes: '',
    });
    setEditingEntry(null);
  };

  /**
   * Save timesheet entry (create or update)
   */
  const handleSave = async (submitAfterSave = false) => {
    setError('');
    setSuccess('');
    setSaving(true);

    // Validation
    if (!formData.projectName || !formData.taskName) {
      setError('Please fill in project name and task name');
      setSaving(false);
      return;
    }

    if (calculatedHours <= 0) {
      setError('End time must be greater than start time');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        date: selectedDate,
        projectName: formData.projectName,
        taskName: formData.taskName,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes,
        status: submitAfterSave ? 'Submitted' : 'Draft',
      };

      if (editingEntry) {
        // Update existing entry
        await timesheetService.updateTimesheet(editingEntry._id, payload);
        setSuccess('Timesheet entry updated successfully!');
      } else {
        // Create new entry
        await timesheetService.createTimesheet(payload);
        setSuccess(submitAfterSave ? 'Timesheet submitted for approval!' : 'Timesheet entry saved as draft');
      }

      resetForm();
      fetchDayEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving timesheet entry');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Edit an existing entry
   */
  const handleEdit = (entry) => {
    if (entry.status !== 'Draft') {
      setError('Only draft entries can be edited');
      return;
    }
    setFormData({
      projectName: entry.projectName,
      taskName: entry.taskName,
      startTime: entry.startTime,
      endTime: entry.endTime,
      notes: entry.notes || '',
    });
    setEditingEntry(entry);
    setError('');
    setSuccess('');
  };

  /**
   * Delete an entry
   */
  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await timesheetService.deleteTimesheet(entryId);
      setSuccess('Entry deleted successfully');
      fetchDayEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting entry');
    }
  };

  /**
   * Submit a single entry for approval
   */
  const handleSubmitEntry = async (entryId) => {
    try {
      await timesheetService.submitTimesheet(entryId);
      setSuccess('Timesheet submitted for approval!');
      fetchDayEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting timesheet');
    }
  };

  /**
   * Submit all draft entries for the selected date
   */
  const handleSubmitAll = async () => {
    const draftEntries = entries.filter(e => e.status === 'Draft');
    if (draftEntries.length === 0) {
      setError('No draft entries to submit');
      return;
    }

    try {
      const ids = draftEntries.map(e => e._id);
      await timesheetService.submitBatchTimesheets(ids);
      setSuccess(`${draftEntries.length} timesheet(s) submitted for approval!`);
      fetchDayEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting timesheets');
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/timesheet-history')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FiArrowLeft size={24} className="text-gray-900" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FiClock className="text-primary" />
                Timesheet Entry
              </h1>
              <p className="text-gray-600 mt-1">Log your daily work hours</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/timesheet-history')}
            className="btn-secondary"
          >
            View History
          </button>
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Entry Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </h2>

              {/* Date Picker */}
              <div className="mb-6">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    resetForm();
                  }}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Project & Task */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="e.g., HRMS Portal"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Task Name *</label>
                  <input
                    type="text"
                    name="taskName"
                    value={formData.taskName}
                    onChange={handleChange}
                    placeholder="e.g., Implement timesheet module"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Time Pickers */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Total Hours</label>
                  <div className={`input-field flex items-center justify-center font-bold text-xl ${
                    calculatedHours > STANDARD_HOURS ? 'text-orange-600 bg-orange-50' : 'text-primary bg-blue-50'
                  }`}>
                    {calculatedHours} hrs
                    {calculatedHours > STANDARD_HOURS && (
                      <span className="ml-2 text-sm font-normal">(+{(calculatedHours - STANDARD_HOURS).toFixed(2)} OT)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="form-label">Notes / Description</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional notes about your work..."
                  className="input-field resize-none"
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FiSave />
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving || editingEntry}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiSend />
                  {saving ? 'Saving...' : 'Save & Submit'}
                </button>
                {editingEntry && (
                  <button
                    onClick={resetForm}
                    className="btn-secondary"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Daily Summary */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="card bg-gradient-to-br from-primary to-blue-700 text-white">
              <h3 className="text-lg font-semibold mb-4">Daily Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-blue-200 text-sm">Total Hours</p>
                  <p className="text-3xl font-bold">{dailySummary.totalHours} hrs</p>
                </div>
                {dailySummary.overtimeHours > 0 && (
                  <div>
                    <p className="text-blue-200 text-sm">Overtime</p>
                    <p className="text-xl font-bold text-orange-300">+{dailySummary.overtimeHours} hrs</p>
                  </div>
                )}
                <div>
                  <p className="text-blue-200 text-sm">Entries</p>
                  <p className="text-xl font-bold">{entries.length}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {entries.some(e => e.status === 'Draft') && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <button
                  onClick={handleSubmitAll}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <FiSend />
                  Submit All Drafts ({entries.filter(e => e.status === 'Draft').length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Today's Entries List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Entries for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading entries...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiClock size={48} className="mx-auto mb-4 opacity-50" />
              <p>No entries for this date. Add your first entry above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Task</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Hours</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{entry.projectName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{entry.taskName}</span>
                        {entry.notes && (
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{entry.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {entry.startTime} - {entry.endTime}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${entry.isOvertime ? 'text-orange-600' : 'text-gray-900'}`}>
                          {entry.totalHours} hrs
                        </span>
                        {entry.isOvertime && (
                          <span className="text-xs text-orange-500 block">
                            +{entry.overtimeHours} OT
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.status === 'Draft' && (
                            <>
                              <button
                                onClick={() => handleEdit(entry)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleSubmitEntry(entry._id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Submit"
                              >
                                <FiSend size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(entry._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
                          )}
                          {entry.status === 'Rejected' && entry.managerComments && (
                            <span className="text-xs text-red-600" title={entry.managerComments}>
                              View feedback
                            </span>
                          )}
                        </div>
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

export default TimesheetEntryPage;

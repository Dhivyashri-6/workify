import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiSave, FiArrowLeft, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const ApplyLeavePage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Leave balance and blocked dates state
  const [leaveBalanceStats, setLeaveBalanceStats] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyUsage, setMonthlyUsage] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  
  // Refresh user data and fetch leave info on mount
  useEffect(() => {
    refreshUser();
    fetchLeaveInfo();
  }, []);

  useEffect(() => {
    fetchMonthlyUsage(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    const currentTypeDisabled = leaveTypes.some(
      (type) => type.value === formData.leaveType && isLeaveTypeDisabled(type)
    );

    if (currentTypeDisabled) {
      const firstAvailableType = leaveTypes.find((type) => !isLeaveTypeDisabled(type));
      if (firstAvailableType && firstAvailableType.value !== formData.leaveType) {
        setFormData((prev) => ({
          ...prev,
          leaveType: firstAvailableType.value,
          isPaid: firstAvailableType.isPaid,
        }));
      }
    }
  }, [monthlyUsage, leaveBalanceStats]);

  const fetchLeaveInfo = async () => {
    try {
      setLoadingData(true);
      
      // Fetch balance stats
      const balanceRes = await leaveService.getLeaveBalanceStats();
      if (balanceRes.data) {
        setLeaveBalanceStats(balanceRes.data);
      }
      
      // Fetch blocked dates
      const blockedRes = await leaveService.getBlockedDates();
      console.log('Blocked dates response:', blockedRes.data);
      if (blockedRes.data && blockedRes.data.blockedDates) {
        setBlockedDates(blockedRes.data.blockedDates);
        console.log('Set blocked dates:', blockedRes.data.blockedDates);
      }
    } catch (error) {
      console.error('Error fetching leave info:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchMonthlyUsage = async (month) => {
    try {
      const monthlyRes = await leaveService.getMonthlyUsage(month);
      if (monthlyRes.data) {
        setMonthlyUsage(monthlyRes.data);
      }
    } catch (error) {
      console.error('Error fetching monthly leave usage:', error);
      setMonthlyUsage(null);
    }
  };

  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    numberOfDays: 0,
    reason: '',
    isPaid: true,
  });

  // Get remaining balance for each leave type
  const getRemainingBalance = (type) => {
    if (!leaveBalanceStats?.remaining) return user?.leaveBalance?.[`${type}Leave`] || 0;
    return leaveBalanceStats.remaining[`${type}Leave`] || 0;
  };

  const leaveTypes = [
    { value: 'casual', label: 'Casual Leave', available: getRemainingBalance('casual'), isPaid: true },
    { value: 'sick', label: 'Sick Leave', available: getRemainingBalance('sick'), isPaid: true },
    { value: 'earned', label: 'Earned Leave', available: getRemainingBalance('earned'), isPaid: true },
    { value: 'maternity', label: 'Maternity Leave', available: getRemainingBalance('maternity'), isPaid: true },
    { value: 'other', label: 'Other (Unpaid)', available: 999, isPaid: false },
  ];

  const mapLeaveTypeKey = (type) => {
    if (type === 'other') return null;
    return type;
  };

  const getMonthlyRemaining = (type) => {
    const key = mapLeaveTypeKey(type);
    if (!key || !monthlyUsage?.remaining) return Number.POSITIVE_INFINITY;
    return monthlyUsage.remaining[key] ?? 0;
  };

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a single date is blocked
  const isDateBlocked = (dateStr) => {
    return blockedDates.includes(dateStr);
  };

  // Check if selected date range conflicts with blocked dates
  const checkDateConflicts = (start, end) => {
    if (!start || !end) return [];
    const conflicts = [];
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      // Use local date format to match backend
      const dateStr = formatDateLocal(current);
      if (blockedDates.includes(dateStr)) {
        conflicts.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
    return conflicts;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle date selection - block inaccessible dates
    if (name === 'startDate') {
      // Check if the selected start date is blocked
      if (isDateBlocked(value)) {
        setError(`The date ${value} is not available - you already have a leave request for this date.`);
        // Clear the start date - don't allow selection
        setFormData(prev => ({
          ...prev,
          startDate: '',
          numberOfDays: 0,
        }));
        return;
      }
      
      // Valid start date - update and check end date range
      setError('');
      setSelectedMonth(value ? value.slice(0, 7) : new Date().toISOString().slice(0, 7));
      const endDate = formData.endDate;
      if (endDate) {
        const conflicts = checkDateConflicts(value, endDate);
        if (conflicts.length > 0) {
          setError(`Date range contains blocked dates: ${conflicts.join(', ')}. Please choose different dates.`);
          setFormData(prev => ({
            ...prev,
            startDate: value,
            endDate: '',
            numberOfDays: 0,
          }));
          return;
        }
        // Calculate days for valid range
        const days = Math.ceil((new Date(endDate) - new Date(value)) / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({
          ...prev,
          startDate: value,
          numberOfDays: days,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          startDate: value,
        }));
      }
      return;
    }
    
    if (name === 'endDate') {
      // Check if the selected end date is blocked
      if (isDateBlocked(value)) {
        setError(`The date ${value} is not available - you already have a leave request for this date.`);
        // Clear the end date - don't allow selection
        setFormData(prev => ({
          ...prev,
          endDate: '',
          numberOfDays: 0,
        }));
        return;
      }
      
      // Check for conflicts in the entire range
      const startDate = formData.startDate;
      if (startDate) {
        const conflicts = checkDateConflicts(startDate, value);
        if (conflicts.length > 0) {
          setError(`Date range contains blocked dates: ${conflicts.join(', ')}. Please choose different dates.`);
          // Clear the end date - don't allow selection
          setFormData(prev => ({
            ...prev,
            endDate: '',
            numberOfDays: 0,
          }));
          return;
        }
        // Valid range - calculate days
        const days = Math.ceil((new Date(value) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
        setError('');
        setFormData(prev => ({
          ...prev,
          endDate: value,
          numberOfDays: days,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          endDate: value,
        }));
      }
      return;
    }

    // Handle other fields
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update isPaid based on leave type selection
    if (name === 'leaveType') {
      const selectedType = leaveTypes.find(lt => lt.value === value);
      setFormData(prev => ({
        ...prev,
        leaveType: value,
        isPaid: selectedType?.isPaid ?? true,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('Start date must be before end date');
      setLoading(false);
      return;
    }

    // Check for date conflicts before submitting
    const conflicts = checkDateConflicts(new Date(formData.startDate), new Date(formData.endDate));
    if (conflicts.length > 0) {
      setError(`Cannot apply: You already have leave requests for: ${conflicts.join(', ')}`);
      setLoading(false);
      return;
    }

    const selectedLeave = leaveTypes.find(lt => lt.value === formData.leaveType);
    // Only check balance for paid leaves (not 'other' type)
    if (formData.leaveType !== 'other' && formData.numberOfDays > selectedLeave.available) {
      setError(`You don't have enough ${selectedLeave.label}. Available: ${selectedLeave.available} days`);
      setLoading(false);
      return;
    }

    // Enforce selected month quota in UI before backend validation.
    if (formData.leaveType !== 'other') {
      const monthlyRemaining = getMonthlyRemaining(formData.leaveType);
      if (formData.numberOfDays > monthlyRemaining) {
        setError(`Monthly ${selectedLeave.label} limit reached. Remaining in ${selectedMonth}: ${monthlyRemaining} day(s).`);
        setLoading(false);
        return;
      }
    }

    try {
      await leaveService.applyLeave(formData);
      setSuccess('Leave applied successfully!');
      setTimeout(() => navigate('/leaves'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error applying leave');
      setLoading(false);
    }
  };

  const selectedLeave = leaveTypes.find(lt => lt.value === formData.leaveType);

  // Check if a leave type should be disabled (0 balance)
  const isLeaveTypeDisabled = (leaveType) => {
    if (leaveType.value === 'other') return false; // Unpaid is always available
    return leaveType.available <= 0 || getMonthlyRemaining(leaveType.value) <= 0;
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/leaves')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FiArrowLeft size={24} className="text-gray-900" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Apply for Leave</h1>
            <p className="text-gray-600 mt-2">Submit a new leave request</p>
          </div>
        </div>

        {/* Leave Balance Summary */}
        {leaveBalanceStats && (
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <FiInfo className="text-blue-500" size={20} />
              <p className="font-semibold text-blue-700">Your Leave Balance</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className={`p-2 rounded ${getRemainingBalance('casual') <= 0 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-700'}`}>
                <span className="font-medium">Casual:</span> {getRemainingBalance('casual')} days
              </div>
              <div className={`p-2 rounded ${getRemainingBalance('sick') <= 0 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-700'}`}>
                <span className="font-medium">Sick:</span> {getRemainingBalance('sick')} days
              </div>
              <div className={`p-2 rounded ${getRemainingBalance('earned') <= 0 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-700'}`}>
                <span className="font-medium">Earned:</span> {getRemainingBalance('earned')} days
              </div>
              <div className={`p-2 rounded ${getRemainingBalance('maternity') <= 0 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-700'}`}>
                <span className="font-medium">Maternity:</span> {getRemainingBalance('maternity')} days
              </div>
            </div>
            {monthlyUsage && (
              <div className="mt-3 text-sm text-blue-700">
                Monthly quota for <span className="font-semibold">{monthlyUsage.month}</span> is active. Leave types are disabled once monthly remaining reaches zero.
              </div>
            )}
          </div>
        )}

        {/* Form Card */}
        <div className="card">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-2">
              <FiAlertCircle className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type */}
            <div>
              <label className="form-label">Leave Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {leaveTypes.map(leaveType => {
                  const isDisabled = isLeaveTypeDisabled(leaveType);
                  return (
                    <label
                      key={leaveType.value}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        isDisabled 
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                          : formData.leaveType === leaveType.value
                            ? 'border-primary bg-blue-50 cursor-pointer'
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="leaveType"
                        value={leaveType.value}
                        checked={formData.leaveType === leaveType.value}
                        onChange={handleChange}
                        disabled={isDisabled}
                        className="hidden"
                      />
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                          {leaveType.label}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          isDisabled 
                            ? 'bg-red-100 text-red-600' 
                            : leaveType.isPaid 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isDisabled ? 'Exhausted' : leaveType.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      {leaveType.value !== 'other' ? (
                        <p className={`text-sm ${isDisabled ? 'text-red-500' : 'text-gray-600'}`}>
                          {isDisabled
                            ? 'No monthly/annual balance remaining'
                            : `Annual: ${leaveType.available} days | Monthly: ${getMonthlyRemaining(leaveType.value)} days`}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No limit (unpaid)</p>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="input-field"
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            {/* Number of Days */}
            <div>
              <label className="form-label">Number of Days</label>
              <div className={`p-4 border rounded-lg ${formData.isPaid ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <p className="text-2xl font-bold text-primary">{formData.numberOfDays} days</p>
                {selectedLeave && formData.leaveType !== 'other' && (
                  <p className="text-sm text-gray-600 mt-2">
                    Remaining: {selectedLeave.available - formData.numberOfDays} days
                  </p>
                )}
                {formData.leaveType === 'other' && (
                  <p className="text-sm text-yellow-700 mt-2 font-medium">
                    This is an unpaid leave - no salary deduction limit
                  </p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="form-label">Reason for Leave *</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Please provide a reason for your leave request"
                className="input-field resize-none"
                rows="5"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <FiSave size={20} />
                {loading ? 'Applying...' : 'Apply Leave'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/leaves')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplyLeavePage;

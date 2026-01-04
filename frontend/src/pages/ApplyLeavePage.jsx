import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiSave, FiArrowLeft } from 'react-icons/fi';
import { leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const ApplyLeavePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    numberOfDays: 0,
    reason: '',
  });

  const leaveTypes = [
    { value: 'casual', label: 'Casual Leave', available: user?.leaveBalance?.casualLeave || 0 },
    { value: 'sick', label: 'Sick Leave', available: user?.leaveBalance?.sickLeave || 0 },
    { value: 'earned', label: 'Earned Leave', available: user?.leaveBalance?.earnedLeave || 0 },
    { value: 'maternity', label: 'Maternity Leave', available: user?.leaveBalance?.maternityLeave || 0 },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Calculate number of days
    if (name === 'startDate' || name === 'endDate') {
      const start = new Date(formData.startDate || (name === 'startDate' ? value : formData.startDate));
      const end = new Date(formData.endDate || (name === 'endDate' ? value : formData.endDate));

      if (start && end && start <= end) {
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, numberOfDays: days }));
      }
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

    const selectedLeave = leaveTypes.find(lt => lt.value === formData.leaveType);
    if (formData.numberOfDays > selectedLeave.available) {
      setError(`You don't have enough ${selectedLeave.label}. Available: ${selectedLeave.available} days`);
      setLoading(false);
      return;
    }

    try {
      await leaveService.applyLeave(formData);
      alert('Leave applied successfully!');
      navigate('/leaves');
    } catch (err) {
      setError(err.message || 'Error applying leave');
    } finally {
      setLoading(false);
    }
  };

  const selectedLeave = leaveTypes.find(lt => lt.value === formData.leaveType);

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

        {/* Form Card */}
        <div className="card">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type */}
            <div>
              <label className="form-label">Leave Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {leaveTypes.map(leaveType => (
                  <label
                    key={leaveType.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.leaveType === leaveType.value
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="leaveType"
                      value={leaveType.value}
                      checked={formData.leaveType === leaveType.value}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <p className="font-semibold text-gray-900">{leaveType.label}</p>
                    <p className="text-sm text-gray-600">Available: {leaveType.available} days</p>
                  </label>
                ))}
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
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-2xl font-bold text-primary">{formData.numberOfDays} days</p>
                {selectedLeave && (
                  <p className="text-sm text-gray-600 mt-2">
                    Remaining: {selectedLeave.available - formData.numberOfDays} days
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

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-3">Leave Application Process</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>Submit your leave request with required details</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>Your manager will review and approve/reject</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>HR will review the manager's decision</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>Director gives final approval</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">5.</span>
              <span>Once approved, you're all set!</span>
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplyLeavePage;

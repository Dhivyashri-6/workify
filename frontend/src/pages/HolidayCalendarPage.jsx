import React, { useState, useEffect } from 'react';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { holidayService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const HolidayCalendarPage = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    category: 'national',
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidayService.getHolidays();
      setHolidays(response.data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await holidayService.addHoliday(formData);
      setFormData({ name: '', date: '', description: '', category: 'national' });
      setShowForm(false);
      fetchHolidays();
      alert('Holiday added successfully!');
    } catch (error) {
      alert('Error adding holiday: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await holidayService.deleteHoliday(id);
        fetchHolidays();
      } catch (error) {
        alert('Error deleting holiday: ' + error.message);
      }
    }
  };

  const filteredHolidays = holidays.filter(h => {
    const holidayYear = new Date(h.date).getFullYear();
    return holidayYear === selectedYear;
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(selectedYear, i, 1);
    return {
      month: date.toLocaleString('default', { month: 'long' }),
      number: i + 1,
      days: new Date(selectedYear, i + 1, 0).getDate(),
    };
  });

  const getDaysInMonth = (month) => {
    return filteredHolidays.filter(h => {
      const holidayMonth = new Date(h.date).getMonth() + 1;
      return holidayMonth === month;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Holiday Calendar</h1>
            <p className="text-gray-600 mt-2">View company holidays and important dates</p>
          </div>
          {user?.role === 'director' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus size={20} />
              Add Holiday
            </button>
          )}
        </div>

        {/* Add Holiday Form */}
        {showForm && user?.role === 'director' && (
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Add New Holiday</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Holiday Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Diwali"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="national">National</option>
                    <option value="state">State</option>
                    <option value="company">Company</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional description"
                  className="input-field"
                  rows="3"
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn-primary">
                  Add Holiday
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Year Selector */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
          >
            ← Previous Year
          </button>
          <h2 className="text-2xl font-bold text-gray-900 w-32 text-center">{selectedYear}</h2>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
          >
            Next Year →
          </button>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading holidays...</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {months.map((month) => {
              const monthHolidays = getDaysInMonth(month.number);
              return (
                <div key={month.number} className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-3">
                    {month.month} {selectedYear}
                  </h3>
                  {monthHolidays.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">No holidays</p>
                  ) : (
                    <div className="space-y-3">
                      {monthHolidays.map((holiday) => (
                        <div
                          key={holiday._id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-gray-900">{holiday.name}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(holiday.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              {holiday.description && (
                                <p className="text-sm text-gray-500 mt-1">{holiday.description}</p>
                              )}
                              <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${
                                holiday.category === 'national'
                                  ? 'bg-red-100 text-red-800'
                                  : holiday.category === 'state'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {holiday.category.toUpperCase()}
                              </span>
                            </div>
                            {user?.role === 'director' && (
                              <button
                                onClick={() => handleDelete(holiday._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Holidays List View */}
        {filteredHolidays.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">All Holidays in {selectedYear}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Holiday</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHolidays
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((holiday) => (
                      <tr key={holiday._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{holiday.name}</td>
                        <td className="py-3 px-4">{new Date(holiday.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            holiday.category === 'national'
                              ? 'bg-red-100 text-red-800'
                              : holiday.category === 'state'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {holiday.category.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{holiday.description || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HolidayCalendarPage;

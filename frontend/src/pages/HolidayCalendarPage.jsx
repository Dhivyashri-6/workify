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
  const [country, setCountry] = useState('IN'); // Default to India
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    category: 'national',
  });

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear, country]);

  // Indian Government Holidays 2026 (National & Regional Holidays)
  const getIndianHolidays = (year) => {
    return [
      { name: 'New Year', date: `${year}-01-01`, description: 'New Year Day', category: 'national' },
      { name: 'Pongal / Makar Sankranti', date: `${year}-01-15`, description: 'Harvest Festival', category: 'national' },
      { name: 'Republic Day', date: `${year}-01-26`, description: 'Republic Day of India', category: 'national' },
      { name: 'Doljatra / Holi', date: `${year}-03-03`, description: 'Festival of Colors', category: 'national' },
      { name: 'Holi', date: `${year}-03-04`, description: 'Festival of Colors', category: 'national' },
      { name: 'Ugadi', date: `${year}-03-19`, description: 'Telugu New Year', category: 'national' },
      { name: 'Ramzan (Id-ul-Fitr)', date: `${year}-03-20`, description: 'End of Ramadan', category: 'national' },
      { name: 'Good Friday', date: `${year}-04-03`, description: 'Christian Holiday', category: 'national' },
      { name: 'Tamil New Year', date: `${year}-04-14`, description: 'Tamil New Year', category: 'national' },
      { name: 'Vishu / Bengali New Year', date: `${year}-04-15`, description: 'Kerala & Bengal New Year', category: 'national' },
      { name: 'May Day', date: `${year}-05-01`, description: 'Labour Day', category: 'national' },
      { name: 'Telangana Formation Day', date: `${year}-06-02`, description: 'Telangana State Formation', category: 'state' },
      { name: 'Ratha Yatra', date: `${year}-07-16`, description: 'Chariot Festival', category: 'national' },
      { name: 'Independence Day', date: `${year}-08-15`, description: 'Independence Day of India', category: 'national' },
      { name: 'First Onam', date: `${year}-08-25`, description: 'Kerala Festival', category: 'state' },
      { name: 'Thiruvonam', date: `${year}-08-26`, description: 'Main Onam Day', category: 'state' },
      { name: 'Raksha Bandhan', date: `${year}-08-28`, description: 'Brother-Sister Festival', category: 'national' },
      { name: 'Janmashtami', date: `${year}-09-04`, description: 'Birth of Lord Krishna', category: 'national' },
      { name: 'Ganesh Chaturthi', date: `${year}-09-14`, description: 'Birth of Lord Ganesha', category: 'national' },
      { name: 'Gandhi Jayanti', date: `${year}-10-02`, description: 'Birth Anniversary of Mahatma Gandhi', category: 'national' },
      { name: 'Dussehra / Vijayadashami', date: `${year}-10-20`, description: 'Victory of Good over Evil', category: 'national' },
      { name: 'Durga Puja / Dasami', date: `${year}-10-21`, description: 'Durga Puja Festival', category: 'national' },
      { name: 'Diwali', date: `${year}-11-08`, description: 'Festival of Lights', category: 'national' },
      { name: 'Govardhan Puja', date: `${year}-11-09`, description: 'Day after Diwali', category: 'national' },
      { name: 'Bhai Dooj / Bali Pratipada', date: `${year}-11-10`, description: 'Brother-Sister Festival', category: 'national' },
      { name: 'Guru Nanak Jayanti', date: `${year}-11-15`, description: 'Birth of Guru Nanak', category: 'national' },
      { name: 'Christmas', date: `${year}-12-25`, description: 'Christmas Day', category: 'national' },
    ].map(h => ({ ...h, _id: `india-${h.date}`, isGovernmentHoliday: true }));
  };

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      
      let allHolidays = [];

      // Fetch government holidays
      try {
        let govHolidays = [];
        
        if (country === 'IN') {
          // Use hardcoded Indian holidays (API doesn't support India)
          govHolidays = getIndianHolidays(selectedYear);
          console.log('Indian holidays loaded:', govHolidays.length);
          allHolidays = [...govHolidays];
        } else {
          // Fetch from Nager.Date API for other countries
          const govResponse = await fetch(`https://date.nager.at/api/v3/publicholidays/${selectedYear}/${country}`);
          if (govResponse.ok) {
            const apiHolidays = await govResponse.json();
            console.log('Government holidays loaded:', apiHolidays.length);
            
            // Convert government holidays to our format
            const formattedGovHolidays = apiHolidays.map(h => ({
              name: h.localName || h.name,
              date: h.date,
              description: 'Government Holiday',
              category: 'national',
              isGovernmentHoliday: true,
              _id: `gov-${h.date}`
            }));

            allHolidays = [...formattedGovHolidays];
          } else {
            console.error('Failed to fetch government holidays:', govResponse.status);
          }
        }
      } catch (error) {
        console.error('Error fetching government holidays:', error);
      }

      // Fetch from database (custom holidays)
      try {
        const response = await holidayService.getHolidays();
        if (response.data && response.data.length > 0) {
          const existingDates = new Set(allHolidays.map(h => h.date));
          const dbHolidays = response.data.filter(h => !existingDates.has(h.date));
          allHolidays = [...allHolidays, ...dbHolidays];
        }
      } catch (error) {
        console.error('Error fetching database holidays:', error);
      }

      // Add ONLY Saturday (6) and Sunday (0) as weekends
      const existingDates = new Set(allHolidays.map(h => h.date));
      
      for (let i = 0; i < 366; i++) {
        const date = new Date(selectedYear, 0, 1);
        date.setDate(date.getDate() + i);
        
        if (date.getFullYear() !== selectedYear) break;
        
        const dayOfWeek = date.getDay();
        
        // ONLY mark Saturday (dayOfWeek = 6) and Sunday (dayOfWeek = 0)
        const isSaturday = dayOfWeek === 6;
        const isSunday = dayOfWeek === 0;
        
        if (isSaturday || isSunday) {
          const dateStr = date.toISOString().split('T')[0];
          
          // Don't add if already exists (government holiday might fall on weekend)
          if (!existingDates.has(dateStr)) {
            allHolidays.push({
              name: isSaturday ? 'Saturday' : 'Sunday',
              date: dateStr,
              description: 'Weekend',
              category: 'weekend',
              isWeekend: true,
              _id: `weekend-${dateStr}`
            });
            existingDates.add(dateStr);
          }
        }
      }

      setHolidays(allHolidays);
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

        {/* Country Selector */}
        <div className="card bg-blue-50 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Select Country for Government Holidays</p>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input-field max-w-xs"
              >
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="CA">Canada</option>
                <option value="SG">Singapore</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="JP">Japan</option>
                <option value="CN">China</option>
              </select>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                ✓ Government holidays loaded<br/>
                ✓ All weekends (Sat & Sun) marked<br/>
                ✓ Year {selectedYear}
              </p>
            </div>
          </div>
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
                    <option value="weekend">Weekend</option>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {months.map((month) => {
              const monthHolidays = getDaysInMonth(month.number);
              const firstDay = new Date(selectedYear, month.number - 1, 1).getDay();
              const daysInMonth = month.days;
              
              // Create array of calendar days (Monday to Sunday)
              const calendarDays = [];
              // Shift firstDay so Monday is 0 and Sunday is 6
              const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
              for (let i = 0; i < adjustedFirstDay; i++) {
                calendarDays.push(null);
              }
              for (let i = 1; i <= daysInMonth; i++) {
                calendarDays.push(i);
              }
              
              return (
                <div key={month.number} className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 pb-3">
                    {month.month} {selectedYear}
                  </h3>
                  
                  {/* Week Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="text-center font-bold text-sm text-gray-600 py-2 bg-gray-50 rounded">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="aspect-square"></div>;
                      }
                      
                      const dateStr = `${selectedYear}-${String(month.number).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayOfWeek = new Date(selectedYear, month.number - 1, day).getDay();
                      // Saturday = 6, Sunday = 0
                      const isSaturday = dayOfWeek === 6;
                      const isSunday = dayOfWeek === 0;
                      const isWeekend = isSaturday || isSunday;
                      const holiday = holidays.find(h => h.date === dateStr);
                      
                      let bgColor = 'bg-white';
                      let textColor = 'text-gray-900';
                      let borderColor = 'border border-gray-200';
                      
                      // First check if it's a weekend (Saturday or Sunday)
                      if (isWeekend) {
                        bgColor = 'bg-purple-100';
                        textColor = 'text-purple-900';
                        borderColor = 'border-2 border-purple-400';
                      }
                      
                      // Then override with holiday styling if it's a special holiday
                      if (holiday && holiday.category !== 'weekend') {
                        if (holiday.category === 'national') {
                          bgColor = 'bg-red-100';
                          textColor = 'text-red-900';
                          borderColor = 'border-2 border-red-400';
                        } else if (holiday.category === 'state') {
                          bgColor = 'bg-blue-100';
                          textColor = 'text-blue-900';
                          borderColor = 'border-2 border-blue-400';
                        } else if (holiday.category === 'company') {
                          bgColor = 'bg-green-100';
                          textColor = 'text-green-900';
                          borderColor = 'border-2 border-green-400';
                        }
                      }
                      
                      return (
                        <div
                          key={day}
                          className={`aspect-square flex items-center justify-center rounded font-semibold text-sm ${bgColor} ${textColor} ${borderColor} hover:shadow-md transition-shadow cursor-pointer group relative`}
                          title={holiday ? holiday.name : ''}
                        >
                          {day}
                          
                          {/* Tooltip */}
                          {holiday && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                              {holiday.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="card bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Legend</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-100 border-2 border-red-400 rounded"></div>
              <span className="text-sm font-medium text-gray-700">National Holidays</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 border-2 border-blue-400 rounded"></div>
              <span className="text-sm font-medium text-gray-700">State Holidays</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-purple-100 border-2 border-purple-400 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Weekends</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 border-2 border-green-400 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Company Events</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HolidayCalendarPage;

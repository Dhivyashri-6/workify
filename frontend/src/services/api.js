import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => apiClient.get('/auth/me'),
};

export const userService = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getTeamMembers: () => apiClient.get('/users/team'),
  getAllUsers: () => apiClient.get('/users'),
  addUser: (userData) => apiClient.post('/users', userData),
  removeUser: (userId) => apiClient.delete(`/users/${userId}`),
};

export const leaveService = {
  applyLeave: (data) => apiClient.post('/leaves/apply', data),
  getMyLeaves: () => apiClient.get('/leaves/my-leaves'),
  getTeamLeaves: () => apiClient.get('/leaves/team-leaves'),
  getAllLeaves: () => apiClient.get('/leaves'),
  getLeaveRequests: () => apiClient.get('/leaves/requests'),
  approveLeave: (leaveId, data) => apiClient.put(`/leaves/${leaveId}/approve`, data),
  rejectLeave: (leaveId, data) => apiClient.put(`/leaves/${leaveId}/reject`, data),
  getLeaveHistory: (userId) => apiClient.get(`/leaves/history/${userId}`),
};

export const holidayService = {
  getHolidays: () => apiClient.get('/holidays'),
  addHoliday: (data) => apiClient.post('/holidays', data),
  updateHoliday: (id, data) => apiClient.put(`/holidays/${id}`, data),
  deleteHoliday: (id) => apiClient.delete(`/holidays/${id}`),
};

export const reportService = {
  getLeaveReport: () => apiClient.get('/reports/leaves'),
  getEmployeeLeaveReport: (employeeId) => apiClient.get(`/reports/employee/${employeeId}`),
  downloadReport: (type) => apiClient.get(`/reports/download/${type}`, { responseType: 'blob' }),
};

export default apiClient;

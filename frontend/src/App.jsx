import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './layouts/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import LeavesPage from './pages/LeavesPage';
import ApplyLeavePage from './pages/ApplyLeavePage';
import HolidayCalendarPage from './pages/HolidayCalendarPage';
import AdminPage from './pages/AdminPage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';
import TeamLeavesPage from './pages/TeamLeavesPage';
import LeaveApprovalsPage from './pages/LeaveApprovalsPage';
import ReportsPage from './pages/ReportsPage';

// Timesheet Pages
import TimesheetEntryPage from './pages/TimesheetEntryPage';
import TimesheetHistoryPage from './pages/TimesheetHistoryPage';
import TimesheetApprovalsPage from './pages/TimesheetApprovalsPage';
import TimesheetReportsPage from './pages/TimesheetReportsPage';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <LeavesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apply-leave"
            element={
              <ProtectedRoute>
                <ApplyLeavePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/holidays"
            element={
              <ProtectedRoute>
                <HolidayCalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="director">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute requiredRole="director">
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team-leaves"
            element={
              <ProtectedRoute requiredRole={['team_lead', 'hr', 'director']}>
                <TeamLeavesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute requiredRole={['team_lead', 'hr', 'director']}>
                <LeaveApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredRole="director">
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Timesheet Routes */}
          <Route
            path="/timesheet-entry"
            element={
              <ProtectedRoute>
                <TimesheetEntryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timesheet-history"
            element={
              <ProtectedRoute>
                <TimesheetHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timesheet-approvals"
            element={
              <ProtectedRoute requiredRole={['team_lead', 'hr', 'director']}>
                <TimesheetApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timesheet-reports"
            element={
              <ProtectedRoute>
                <TimesheetReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;

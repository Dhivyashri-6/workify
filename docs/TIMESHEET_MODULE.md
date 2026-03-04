# Timesheet Module Documentation

## Overview

The Timesheet module is a complete time tracking solution for the HRMS portal that allows employees to log their daily work hours and managers to review and approve timesheet entries.

## Features

### For Employees
- Create daily timesheet entries with project, task, start/end times
- Auto-calculation of total hours worked
- Save entries as drafts or submit for approval
- View timesheet history by day/week
- Track status of submitted timesheets
- View overtime hours automatically detected

### For Managers (Team Lead, HR, Director)
- View team members' submitted timesheets
- Approve or reject timesheets with comments
- Batch approval for multiple entries
- Filter by employee, date range, and status
- View team timesheet reports

### Reports
- Total hours worked per employee
- Project-wise hours distribution
- Weekly summary reports
- Export reports to CSV

---

## Folder Structure

```
backend/
├── models/
│   ├── Timesheet.js          # Main timesheet entry model
│   └── TimesheetApproval.js  # Approval history model
├── controllers/
│   └── timesheetController.js # All timesheet business logic
├── routes/
│   └── timesheets.js         # API route definitions
└── migrations/
    └── timesheet_migration.js # Database setup script

frontend/
└── src/
    ├── services/
    │   └── api.js             # Added timesheetService
    └── pages/
        ├── TimesheetEntryPage.jsx    # Create/edit entries
        ├── TimesheetHistoryPage.jsx  # View entry history
        ├── TimesheetApprovalsPage.jsx # Manager approval dashboard
        └── TimesheetReportsPage.jsx  # Reports and analytics
```

---

## Database Schema

### Timesheets Collection

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Primary key |
| employeeId | ObjectId (ref: User) | Employee who created the entry |
| date | Date | Date of work |
| projectName | String | Project name (max 100 chars) |
| taskName | String | Task description (max 200 chars) |
| startTime | String | Start time (HH:MM format) |
| endTime | String | End time (HH:MM format) |
| totalHours | Number | Auto-calculated total hours |
| notes | String | Optional notes (max 500 chars) |
| status | String | Draft / Submitted / Approved / Rejected |
| managerComments | String | Comments from approver |
| isOvertime | Boolean | True if hours > 8 |
| overtimeHours | Number | Hours exceeding 8 |
| approvedBy | ObjectId (ref: User) | Manager who approved/rejected |
| actionDate | Date | When status was changed |
| createdAt | Date | Auto-generated |
| updatedAt | Date | Auto-generated |

### TimesheetApprovals Collection

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Primary key |
| timesheetId | ObjectId (ref: Timesheet) | Related timesheet |
| managerId | ObjectId (ref: User) | Manager who took action |
| status | String | Approved / Rejected |
| comments | String | Approval/rejection comments |
| actionDate | Date | When action was taken |
| createdAt | Date | Auto-generated |
| updatedAt | Date | Auto-generated |

---

## API Endpoints

### Employee Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/timesheets` | Create new timesheet entry |
| GET | `/api/timesheets/my-timesheets` | Get employee's timesheets |
| PUT | `/api/timesheets/:id` | Update draft entry |
| DELETE | `/api/timesheets/:id` | Delete draft entry |
| PUT | `/api/timesheets/:id/submit` | Submit for approval |
| PUT | `/api/timesheets/submit-batch` | Submit multiple entries |
| GET | `/api/timesheets/:id` | Get single entry details |

### Manager Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/timesheets/team-timesheets` | Get team timesheets |
| GET | `/api/timesheets/pending-approvals` | Get pending approvals |
| PUT | `/api/timesheets/:id/approve` | Approve a timesheet |
| PUT | `/api/timesheets/:id/reject` | Reject a timesheet |
| PUT | `/api/timesheets/approve-batch` | Batch approve |

### Report Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/timesheets/reports/employee-hours` | Employee hours report |
| GET | `/api/timesheets/reports/project-hours` | Project hours report |
| GET | `/api/timesheets/reports/weekly-summary` | Weekly summary |
| GET | `/api/timesheets/reports/daily-summary` | Daily summary |

---

## API Request/Response Examples

### Create Timesheet Entry

**Request:**
```http
POST /api/timesheets
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2026-03-04",
  "projectName": "HRMS Portal",
  "taskName": "Implement timesheet module",
  "startTime": "09:00",
  "endTime": "17:00",
  "notes": "Completed backend API development",
  "status": "Draft"
}
```

**Response:**
```json
{
  "message": "Timesheet entry created successfully",
  "timesheet": {
    "_id": "65f1234567890abcdef12345",
    "employeeId": "65f1234567890abcdef67890",
    "date": "2026-03-04T00:00:00.000Z",
    "projectName": "HRMS Portal",
    "taskName": "Implement timesheet module",
    "startTime": "09:00",
    "endTime": "17:00",
    "totalHours": 8,
    "notes": "Completed backend API development",
    "status": "Draft",
    "isOvertime": false,
    "overtimeHours": 0,
    "createdAt": "2026-03-04T10:30:00.000Z",
    "updatedAt": "2026-03-04T10:30:00.000Z"
  }
}
```

### Get My Timesheets with Filters

**Request:**
```http
GET /api/timesheets/my-timesheets?startDate=2026-03-01&endDate=2026-03-07&status=Draft
Authorization: Bearer <token>
```

**Response:**
```json
{
  "timesheets": [
    {
      "_id": "65f1234567890abcdef12345",
      "employeeId": { "_id": "...", "name": "John Doe", "email": "john@example.com" },
      "date": "2026-03-04T00:00:00.000Z",
      "projectName": "HRMS Portal",
      "taskName": "Implement timesheet module",
      "startTime": "09:00",
      "endTime": "17:00",
      "totalHours": 8,
      "status": "Draft",
      "isOvertime": false
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "pages": 1
  }
}
```

### Approve Timesheet

**Request:**
```http
PUT /api/timesheets/65f1234567890abcdef12345/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "comments": "Approved. Good work!"
}
```

**Response:**
```json
{
  "message": "Timesheet approved successfully",
  "timesheet": {
    "_id": "65f1234567890abcdef12345",
    "status": "Approved",
    "managerComments": "Approved. Good work!",
    "approvedBy": "65f1234567890abcdef11111",
    "actionDate": "2026-03-04T14:00:00.000Z"
  }
}
```

### Get Employee Hours Report

**Request:**
```http
GET /api/timesheets/reports/employee-hours?startDate=2026-03-01&endDate=2026-03-31
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "employeeId": "65f1234567890abcdef67890",
    "employeeName": "John Doe",
    "employeeEmail": "john@example.com",
    "department": "Engineering",
    "totalHours": 160,
    "overtimeHours": 12,
    "entriesCount": 22
  }
]
```

---

## UI Pages

### 1. Timesheet Entry Page (`/timesheet-entry`)
- Date picker for selecting work date
- Form fields: Project, Task, Start Time, End Time, Notes
- Auto-calculated hours display with overtime indicator
- Save as Draft or Save & Submit buttons
- List of entries for the selected date
- Edit/Delete/Submit actions for draft entries

### 2. Timesheet History Page (`/timesheet-history`)
- Weekly/All view toggle
- Week navigation controls
- Status filter dropdown
- Statistics cards (total hours, overtime, etc.)
- Entries grouped by date
- Status badges (Draft, Submitted, Approved, Rejected)

### 3. Timesheet Approvals Page (`/timesheet-approvals`)
- Manager-only access
- Employee and status filters
- Date range filter
- Batch selection and approval
- Individual approve/reject buttons
- Rejection modal with comments
- Grouped by employee view

### 4. Timesheet Reports Page (`/timesheet-reports`)
- Date range and employee filters
- Summary cards (total hours, overtime, avg/day)
- Tabbed reports:
  - Employee Hours: Bar chart view of hours per employee
  - Project Hours: Hours distribution by project
  - Weekly Summary: Table with weekly breakdowns
- CSV export functionality

---

## Setup Instructions

1. **Install Dependencies** (if not already installed):
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Run Database Migration**:
   ```bash
   cd backend
   node migrations/timesheet_migration.js
   ```

3. **Start the Application**:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

4. **Access the Module**:
   - Employee: Navigate to `/timesheet-entry` or `/timesheet-history`
   - Manager: Navigate to `/timesheet-approvals`
   - Reports: Navigate to `/timesheet-reports`

---

## Business Rules

1. **Time Validation**:
   - End time must be greater than start time
   - Time format must be HH:MM (24-hour)
   - Total hours cannot exceed 24

2. **Status Transitions**:
   - Draft → Submitted (by employee)
   - Submitted → Approved/Rejected (by manager)
   - Only Draft entries can be edited or deleted

3. **Overtime Detection**:
   - Standard working hours = 8 per day
   - Hours > 8 automatically flagged as overtime
   - Overtime hours calculated and stored

4. **Access Control**:
   - Employees: Can only manage their own timesheets
   - Team Leads: Can approve their team members' timesheets
   - HR/Director: Can approve all timesheets

5. **Duplicate Prevention**:
   - Cannot create overlapping time entries for same date

---

## Non-Breaking Integration

This module:
- ✅ Does NOT modify any existing database tables
- ✅ Does NOT modify existing routes or controllers
- ✅ Uses the existing authentication system
- ✅ Follows existing code patterns and conventions
- ✅ Adds new routes, models, and pages only
- ✅ Extends navigation without breaking existing menu

---

## Support

For issues or questions about the Timesheet module, contact the development team.

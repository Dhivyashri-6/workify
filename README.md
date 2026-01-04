# WORKIFY - Enterprise HRMS Platform

A comprehensive Human Resource Management System built with **React + Vite** (Frontend) and **Node.js + Express + MongoDB** (Backend).

## Project Structure

```
workify/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── layouts/        # Layout components
│   │   ├── context/        # React context (Auth)
│   │   ├── services/       # API service calls
│   │   ├── styles/         # Global styles
│   │   ├── utils/          # Utility functions
│   │   └── App.jsx         # Main app component
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── backend/
    ├── models/             # Mongoose schemas
    ├── controllers/        # Route controllers
    ├── routes/             # API routes
    ├── middleware/         # Auth middleware
    ├── config/             # Configuration files
    ├── server.js           # Entry point
    └── package.json
```

## Features

### For Employees
- ✅ Apply for leaves with detailed forms
- ✅ Track leave requests status
- ✅ View approval timeline
- ✅ Edit personal profile
- ✅ View holiday calendar
- ✅ Check leave balance

### For Managers
- ✅ View team member leaves
- ✅ Approve/reject leave requests
- ✅ See their own leaves
- ✅ Manage team performance

### For HR
- ✅ Review manager approvals
- ✅ Approve/reject leaves
- ✅ View all employee leaves
- ✅ Manage employee data
- ✅ Generate leave reports

### For Directors (Admin)
- ✅ Complete admin panel
- ✅ Add/remove employees, managers, HR
- ✅ Manage holiday calendar
- ✅ View and approve all leaves
- ✅ Generate comprehensive reports
- ✅ Download leave reports (CSV)
- ✅ Track employee leave history

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install

# Create .env file with MongoDB connection
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/workify
JWT_SECRET=your_secret_key
NODE_ENV=development" > .env

# Start the server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`
The backend API will be at `http://localhost:5000`

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@example.com | password123 |
| Manager | manager@example.com | password123 |
| HR | hr@example.com | password123 |
| Director | director@example.com | password123 |

## Leave Approval Workflow

1. **Employee** applies for leave
2. **Manager** reviews and approves/rejects
3. **HR** reviews manager's decision
4. **Director** gives final approval
5. Once approved, leave is confirmed

If rejected at any stage, it goes to **Rejected Leaves**.

## Technology Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router v6
- Axios
- Framer Motion
- React Icons
- React Hook Form

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- BCryptjs

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/team` - Get team members
- `GET /api/users` - Get all users (Director only)
- `POST /api/users` - Add new user (Director only)
- `DELETE /api/users/:id` - Remove user (Director only)

### Leaves
- `POST /api/leaves/apply` - Apply for leave
- `GET /api/leaves/my-leaves` - Get my leaves
- `GET /api/leaves/team-leaves` - Get team leaves
- `GET /api/leaves/requests` - Get pending requests
- `PUT /api/leaves/:id/approve` - Approve leave
- `PUT /api/leaves/:id/reject` - Reject leave

### Holidays
- `GET /api/holidays` - Get all holidays
- `POST /api/holidays` - Add holiday (Director only)
- `PUT /api/holidays/:id` - Update holiday (Director only)
- `DELETE /api/holidays/:id` - Delete holiday (Director only)

### Reports
- `GET /api/reports/leaves` - Overall leave report
- `GET /api/reports/employee/:id` - Employee leave report
- `GET /api/reports/download/:type` - Download reports

## Color Scheme

- **Primary**: Dark Blue (#001a4d)
- **Secondary**: Blue (#0033a0)
- **Accent**: Light Blue (#1a5db7)
- **Text**: Dark (#000000), White (#ffffff)
- **Gray**: Professional grayscale

## Future Enhancements

- [ ] Payroll Management
- [ ] Attendance Tracking
- [ ] Performance Reviews
- [ ] Expense Management
- [ ] Employee Directory
- [ ] Document Management
- [ ] Two-Factor Authentication
- [ ] Email Notifications
- [ ] Mobile App

## License

This project is proprietary to Qantler Technologies.

## Contact

For support or inquiries, contact the HR Department or Development Team.

---

Built with ❤️ by Qantler Technologies

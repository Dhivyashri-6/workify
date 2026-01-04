# WORKIFY - Complete Setup Guide

This guide will help you set up and run the WORKIFY Enterprise HRMS application.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - Either [Local Installation](https://docs.mongodb.com/manual/installation/) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for version control)
- **MongoDB Compass** (for database visualization) - Already on your system

## Project Structure Overview

```
WORKIFY/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── pages/           # Page components (Dashboard, Leaves, etc.)
│   │   ├── components/      # Reusable UI components
│   │   ├── layouts/         # Layout wrappers
│   │   ├── context/         # Auth context
│   │   ├── services/        # API calls
│   │   ├── styles/          # Global CSS & Tailwind
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── backend/                  # Node.js + Express API
    ├── models/              # MongoDB schemas
    ├── controllers/         # Request handlers
    ├── routes/              # API routes
    ├── middleware/          # Auth middleware
    ├── config/              # Configuration
    ├── server.js            # Entry point
    ├── package.json
    └── .env                 # Environment variables
```

## Step-by-Step Installation

### Part 1: Backend Setup

#### 1. Navigate to Backend Directory

```bash
cd backend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# Option 1: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/workify

# Option 2: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workify?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
```

**Important:** Change `JWT_SECRET` to a strong, random string for production.

#### 4. Verify MongoDB Connection

Make sure MongoDB is running:

**For Local MongoDB:**
```bash
# On Windows
mongod

# On macOS (if installed via Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

**For MongoDB Atlas:**
- Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string
- Update the `.env` file with your connection string

#### 5. Start Backend Server

```bash
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB Connected
```

### Part 2: Frontend Setup

#### 1. Navigate to Frontend Directory

Open a new terminal window and navigate to the frontend:

```bash
cd frontend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Start Frontend Development Server

```bash
npm run dev
```

You should see:
```
  VITE v5.0.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

## Accessing the Application

### Frontend

Open your browser and navigate to:
```
http://localhost:3000
```

or

```
http://localhost:5173
```

### Backend API

The API will be available at:
```
http://localhost:5000/api
```

## Default Demo Credentials

The application comes with pre-configured demo accounts:

| Role | Email | Password |
|------|-------|----------|
| **Employee** | employee@example.com | password123 |
| **Manager** | manager@example.com | password123 |
| **HR** | hr@example.com | password123 |
| **Director** | director@example.com | password123 |

### Creating Demo Data

To create the demo accounts in your MongoDB, run the following in MongoDB Compass or MongoDB Shell:

```javascript
use workify

db.users.insertMany([
  {
    name: "John Employee",
    email: "employee@example.com",
    password: "$2a$10$YoXW7W7eZ2Z...", // hashed password123
    role: "employee",
    department: "Engineering",
    designation: "Junior Developer",
    leaveBalance: {
      casualLeave: 12,
      sickLeave: 10,
      earnedLeave: 20,
      maternityLeave: 180
    },
    isActive: true,
    createdAt: new Date()
  },
  // ... other users
])
```

**Note:** Password hashing is handled automatically by the application. You can create users through the Director admin panel.

## Project Features

### For Employees
✅ Apply for leaves with detailed forms
✅ Track leave request status (Applied → Manager → HR → Director → Approved)
✅ View approval timeline
✅ Edit personal profile
✅ View company holiday calendar
✅ Check remaining leave balance

### For Managers
✅ View team member leaves
✅ Approve/reject leave requests
✅ View team performance
✅ Check their own leave status

### For HR
✅ Review all leave requests
✅ Approve/reject after manager review
✅ Manage employee data
✅ Generate leave statistics

### For Directors (Admin)
✅ Complete admin panel
✅ Add/remove employees, managers, HR
✅ Manage company holidays
✅ Approve/reject all final leave requests
✅ Generate detailed reports
✅ Download leave reports (CSV)
✅ Track employee leave history

## Leave Approval Workflow

```
1. Employee applies for leave
         ↓
2. Manager reviews and approves/rejects
         ↓
   If rejected by manager → Rejected Leaves
   If approved by manager → Continues to HR
         ↓
3. HR reviews and approves/rejects
         ↓
   If rejected by HR → Rejected Leaves
   If approved by HR → Continues to Director
         ↓
4. Director gives final approval/rejection
         ↓
   Leave Approved ✓ or Rejected ✗
```

## API Endpoints

### Authentication
```
POST   /api/auth/register              - Register new user
POST   /api/auth/login                 - Login user
GET    /api/auth/me                    - Get current user
```

### Users
```
GET    /api/users/profile              - Get user profile
PUT    /api/users/profile              - Update profile
GET    /api/users/team                 - Get team members
GET    /api/users                      - Get all users (Director)
POST   /api/users                      - Add new user (Director)
DELETE /api/users/:id                  - Remove user (Director)
```

### Leaves
```
POST   /api/leaves/apply               - Apply for leave
GET    /api/leaves/my-leaves           - Get my leaves
GET    /api/leaves/team-leaves         - Get team leaves
GET    /api/leaves/requests            - Get pending requests
PUT    /api/leaves/:id/approve         - Approve leave
PUT    /api/leaves/:id/reject          - Reject leave
GET    /api/leaves/history/:userId     - Get employee history
```

### Holidays
```
GET    /api/holidays                   - Get all holidays
POST   /api/holidays                   - Add holiday (Director)
PUT    /api/holidays/:id               - Update holiday (Director)
DELETE /api/holidays/:id               - Delete holiday (Director)
```

### Reports
```
GET    /api/reports/leaves             - Overall report (Director)
GET    /api/reports/employee/:id       - Employee report (Director)
GET    /api/reports/download/:type     - Download reports
```

## MongoDB Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (employee|manager|hr|director),
  department: String,
  designation: String,
  phone: String,
  dob: Date,
  gender: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  leaveBalance: {
    casualLeave: Number,
    sickLeave: Number,
    earnedLeave: Number,
    maternityLeave: Number
  },
  managerId: ObjectId (ref: User),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Leaves Collection
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId (ref: User),
  leaveType: String (casual|sick|earned|maternity|other),
  startDate: Date,
  endDate: Date,
  numberOfDays: Number,
  reason: String,
  status: String (applied|manager-approved|hr-approved|director-approved|rejected),
  approvals: [{
    role: String,
    userId: ObjectId,
    status: String,
    comments: String,
    approvedAt: Date
  }],
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Holidays Collection
```javascript
{
  _id: ObjectId,
  name: String,
  date: Date,
  description: String,
  category: String (national|state|company),
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### MongoDB Connection Error
**Error:** `MongoDB Connection Error: connect ECONNREFUSED`

**Solution:**
1. Ensure MongoDB is running
2. Check if port 27017 is being used
3. Verify connection string in `.env`

```bash
# Windows - Check MongoDB service
Get-Service MongoDB | Start-Service

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (replace PID)
kill -9 <PID>

# Or change PORT in .env
PORT=5001
```

### CORS Error
**Error:** `Access to XMLHttpRequest blocked by CORS`

**Solution:**
The backend `.env` should have:
```env
CORS_ORIGIN=http://localhost:3000
```

## Building for Production

### Frontend Build
```bash
cd frontend
npm run build
```

This creates an optimized build in the `dist/` folder.

### Backend Deployment
```bash
# Install production dependencies only
npm install --production

# Set NODE_ENV to production
NODE_ENV=production node server.js
```

## Environment Variables Summary

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/workify

# Security
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Email (Optional - for future use)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
```

## Support & Documentation

- **Frontend Framework:** [React Documentation](https://react.dev)
- **Build Tool:** [Vite Documentation](https://vitejs.dev)
- **CSS Framework:** [Tailwind CSS](https://tailwindcss.com)
- **Backend Framework:** [Express.js](https://expressjs.com)
- **Database:** [MongoDB Documentation](https://docs.mongodb.com)

## Next Steps

1. ✅ Install all dependencies
2. ✅ Configure MongoDB
3. ✅ Set up environment variables
4. ✅ Start backend and frontend servers
5. ✅ Login with demo credentials
6. ✅ Explore the application

## Common Tasks

### Adding a New User (Director)
1. Login as director@example.com
2. Go to Admin Panel
3. Click "Add User"
4. Fill in the form
5. User receives temporary password via email (future implementation)

### Applying for Leave
1. Login as employee
2. Go to Leaves → Apply Leave
3. Select leave type, dates, and reason
4. Submit for approval
5. Track status in Leaves page

### Approving Leaves
1. Login as manager/HR/director (as per workflow)
2. Go to Approvals
3. Review leave request
4. Add comments if needed
5. Click Approve or Reject

### Managing Holidays
1. Login as director
2. Go to Holiday Calendar
3. Click "Add Holiday"
4. Enter holiday details
5. Save

## Tips for First Time Use

1. **Start with Director account** to add other users and set up holidays
2. **Create sample leaves** from employee account to test the workflow
3. **Use different browsers/incognito** to simulate multiple users
4. **Check browser console** (F12) for any errors
5. **Monitor backend logs** for API calls and errors

## Version Information

- **React:** 18.2.0
- **Vite:** 5.0.8
- **Node.js:** v14+
- **Express:** 4.18.2
- **MongoDB:** 4.4+
- **Tailwind CSS:** 3.4.1

---

**Happy using WORKIFY!** 🚀

For issues or questions, contact the development team.

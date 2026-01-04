# ⚡ WORKIFY - Quick Reference Guide

## 🎯 In 30 Seconds

**WORKIFY** is a professional Enterprise HRMS (Human Resource Management System) by **Qantler Technologies** that helps organizations manage employee leaves, profiles, holidays, and generate HR analytics.

**Demo Accounts** (all password: `password123`):
- `employee@example.com` - Regular employee
- `manager@example.com` - Team manager
- `hr@example.com` - HR personnel
- `director@example.com` - Admin/CEO

---

## 🚀 3-Step Setup

```bash
# 1️⃣ Install dependencies
cd backend && npm install
cd frontend && npm install

# 2️⃣ Start services (in separate terminals)
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev

# 3️⃣ Open browser
http://localhost:5173
```

---

## 🔐 Role Permissions Matrix

| Feature | Employee | Manager | HR | Director |
|---------|----------|---------|----|----|
| Apply Leave | ✅ | ✅ | ✅ | ✅ |
| View Own Leaves | ✅ | ✅ | ✅ | ✅ |
| View Team Leaves | ❌ | ✅ | ✅ | ✅ |
| Approve Level 1 | ❌ | ✅ | ❌ | ❌ |
| Approve Level 2 | ❌ | ❌ | ✅ | ❌ |
| Approve Level 3 | ❌ | ❌ | ❌ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ | ✅ |
| Add Employee | ❌ | ❌ | ❌ | ✅ |
| Manage Holidays | ❌ | ❌ | ❌ | ✅ |
| View Reports | ❌ | ✅ | ✅ | ✅ |
| Export Reports | ❌ | ❌ | ❌ | ✅ |

---

## 📂 Project Structure

```
WORKIFY/
├── frontend/                    ← React application
│   ├── src/
│   │   ├── pages/ (12 pages)
│   │   ├── components/
│   │   ├── layouts/ (DashboardLayout, ProtectedRoute)
│   │   ├── context/ (AuthContext)
│   │   ├── services/ (api.js)
│   │   └── styles/ (Tailwind CSS)
│   └── package.json
│
├── backend/                     ← Express API
│   ├── controllers/ (5 files)
│   ├── models/ (3 schemas)
│   ├── routes/ (5 route files)
│   ├── middleware/ (auth.js)
│   ├── server.js
│   ├── seed.js                  ← Creates demo accounts
│   └── package.json
│
└── Documentation/               ← 8+ guides
```

---

## 🔄 Leave Approval Flow

```
Employee Applies (Status: "applied")
         ↓
Manager Approves (Status: "manager-approved")
         ↓
HR Reviews (Status: "hr-approved")
         ↓
Director Approves (Status: "director-approved")
         ↓
Leave Confirmed ✅
```

**Note**: Can be rejected at any stage

---

## 🎨 Design System

- **Primary Color**: `#2563eb` (Bright Blue)
- **Secondary**: `#3b82f6` (Medium Blue)
- **Accent**: `#60a5fa` (Light Blue)
- **Text**: Gray-900, Gray-700, Gray-600
- **Backgrounds**: White, Gray-50
- **Framework**: Tailwind CSS 3.4
- **Icons**: React Icons
- **Responsive**: Mobile-first design

---

## 🛠️ Tech Stack

**Frontend:**
- React 18.2
- Vite 5.0
- Tailwind CSS 3.4
- React Router v6
- Axios
- React Icons

**Backend:**
- Node.js
- Express 4.18
- MongoDB
- Mongoose 8.0
- JWT
- BCryptjs

---

## 📋 What Each Page Does

| Page | Purpose | Access |
|------|---------|--------|
| **LandingPage** | Welcome, features, company info | Everyone |
| **SignInPage** | Login to system | Everyone |
| **Dashboard** | Statistics, leave balance | Logged in |
| **ProfilePage** | Edit personal information | Logged in |
| **LeavesPage** | View all own leaves | Logged in |
| **ApplyLeavePage** | Apply for new leave | Logged in |
| **HolidayCalendarPage** | View/manage holidays | Logged in |
| **AdminPage** | Add/remove employees | Director |
| **LeaveApprovalsPage** | Approve requests | Manager/HR/Dir |
| **TeamLeavesPage** | View team leaves | Manager/HR/Dir |
| **ReportsPage** | Analytics & export | Director |
| **SettingsPage** | User preferences | Logged in |

---

## 🔑 Database Models

### User Schema
```javascript
{
  name, email, password (hashed)
  role: 'employee' | 'manager' | 'hr' | 'director'
  department, designation, managerId
  phone, dob, gender, address, city, state, zipCode
  leaveBalance: { casualLeave, sickLeave, earnedLeave, maternityLeave }
  isActive: boolean
}
```

### Leave Schema
```javascript
{
  employeeId, startDate, endDate, numberOfDays
  leaveType: 'casual' | 'sick' | 'earned' | 'maternity' | 'other'
  reason
  status: 'applied' | 'manager-approved' | 'hr-approved' | 'director-approved' | 'rejected'
  approvals: [{ role, userId, status, comments, approvedAt }]
  rejectionReason, rejectedBy
}
```

### Holiday Schema
```javascript
{
  name, date, description
  category: 'national' | 'state' | 'company'
  createdBy (Director ID)
}
```

---

## 🔗 API Endpoints

```
POST   /api/auth/register          - Create account
POST   /api/auth/login             - Login
GET    /api/auth/me                - Current user

GET    /api/users/profile          - Your profile
PUT    /api/users/profile          - Update profile
GET    /api/users/team             - Your team
GET    /api/users/all              - All employees (Director)
POST   /api/users/add              - Add employee (Director)
DELETE /api/users/:id              - Remove employee (Director)

POST   /api/leaves/apply           - Apply leave
GET    /api/leaves/my-leaves       - Your leaves
GET    /api/leaves/team-leaves     - Team leaves
GET    /api/leaves/requests        - Pending approvals
PUT    /api/leaves/:id/approve     - Approve/move forward
PUT    /api/leaves/:id/reject      - Reject leave
GET    /api/leaves/history/:userId - Leave history

GET    /api/holidays/all           - All holidays
POST   /api/holidays/add           - Add holiday (Director)
PUT    /api/holidays/:id           - Update holiday (Director)
DELETE /api/holidays/:id           - Delete holiday (Director)

GET    /api/reports/leaves         - Overall statistics
GET    /api/reports/employee/:id   - Employee report
GET    /api/reports/download/:type - Export CSV
```

---

## ⚙️ Configuration Files

### backend/.env
```env
MONGODB_URI=mongodb://localhost:27017/workify
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

### frontend/.env (optional)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🐛 Troubleshooting

### "Invalid credentials"
- Run `node seed.js` in backend folder
- Check MongoDB is running
- Clear browser cache

### "Cannot GET /api/..."
- Backend not running
- Check port 5000 is not in use
- Check .env configuration

### "Port already in use"
```bash
# Find process
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### "MongoDB connection error"
- Start MongoDB: `mongod`
- Check connection string in .env
- Verify database name: `workify`

---

## 📊 Default Leave Balance

All new employees start with:
- **Casual Leave**: 12 days/year
- **Sick Leave**: 10 days/year
- **Earned Leave**: 20 days/year
- **Maternity Leave**: 180 days (for eligible employees)

---

## 🔒 Security Features

✅ JWT-based authentication (7-day tokens)
✅ Password hashing with BCryptjs
✅ Role-based access control (RBAC)
✅ Protected routes on frontend & backend
✅ CORS enabled for safe cross-origin requests
✅ Input validation on both ends
✅ Secure error messages (no data leaks)

---

## 📱 Responsive Design

- ✅ Mobile: < 640px
- ✅ Tablet: 640px - 1024px
- ✅ Desktop: > 1024px

All pages optimized for all screen sizes!

---

## 🎓 Learning Path

1. **Explore Landing Page** - Understand company & features
2. **Login as Employee** - Basic functionality
3. **Apply Leave** - See form validation
4. **Switch to Manager** - Approve requests
5. **Switch to HR** - Second level review
6. **Switch to Director** - Admin features, manage holidays
7. **Edit Profile** - See form updates
8. **Generate Reports** - View analytics

---

## 📞 Contact & Support

**Qantler Technologies**
- Email: sales@qantler.com
- Website: https://qantler.com
- Offices: India, Singapore, USA

---

## 📄 File List

```
WORKIFY/
├── COMPLETION_REPORT.md              - Project completion stats
├── WORKIFY_COMPLETE_GUIDE.md          - Comprehensive documentation
├── HOW_TO_RUN.md                      - Detailed setup guide
├── LOGIN_GUIDE.md                     - Login instructions
├── START_HERE.md                      - Getting started
├── QUICKSTART.md                      - 5-minute setup
├── README.md                          - Complete docs
├── FILE_MANIFEST.md                   - All files listed
├── IMPLEMENTATION_SUMMARY.md          - Feature summary
├── INDEX.md                           - Quick links
└── frontend/, backend/                - Source code
```

---

## ✅ Checklist Before Running

- [ ] Node.js installed
- [ ] MongoDB running (local or Atlas)
- [ ] Backend .env configured
- [ ] `npm install` completed in both folders
- [ ] Two terminals ready
- [ ] Port 5000 and 5173 available

---

## 🎉 You're All Set!

Everything is built, configured, and ready to run. Just:

1. Start backend: `npm run dev`
2. Start frontend: `npm run dev`
3. Open: `http://localhost:5173`
4. Login with demo account
5. Enjoy! 🚀

---

**WORKIFY v1.0 - Professional Enterprise HRMS**
*Built by Qantler Technologies*

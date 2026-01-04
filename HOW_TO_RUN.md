# 📖 COMPLETE GUIDE: What's Created & How to Run

---

## 📁 PROJECT STRUCTURE OVERVIEW

```
WORKIFY/
├── 📄 Documentation Files (7 files)
├── 📁 frontend/          ← React application (port 5173)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── 📁 backend/           ← Express API (port 5000)
    ├── server.js
    ├── package.json
    └── .env
```

---

## 🎯 WHAT WAS CREATED

### 1️⃣ **FRONTEND** - React + Vite Application

#### **Pages Created (12 total)**

| Page | Purpose | Who Can Access |
|------|---------|-----------------|
| **LandingPage** | Welcome page with features | Everyone |
| **SignInPage** | Login page | Everyone |
| **Dashboard** | Statistics & overview | All logged-in users |
| **ProfilePage** | Editable profile | All logged-in users |
| **LeavesPage** | View all leaves | All logged-in users |
| **ApplyLeavePage** | Apply for leave | All logged-in users |
| **HolidayCalendarPage** | View/manage holidays | All logged-in users (Director adds) |
| **AdminPage** | Manage employees | Director only |
| **LeaveApprovalsPage** | Approve/reject leaves | Manager, HR, Director |
| **TeamLeavesPage** | View team leaves | Manager, HR, Director |
| **ReportsPage** | Analytics & export | Director only |
| **SettingsPage** | User preferences | All logged-in users |

#### **Layouts Created (2 total)**

1. **DashboardLayout.jsx**
   - Sidebar navigation (collapsible)
   - Top navigation bar
   - Shows role-based menu items
   - Displays user greeting and date

2. **ProtectedRoute.jsx**
   - Protects pages from unauthorized access
   - Checks if user is logged in
   - Checks if user has required role
   - Redirects to login if not authorized

#### **Core Infrastructure**

- **AuthContext.jsx** - Manages login/logout and user state
- **api.js** - All API calls to backend
- **index.css** - Global styles and Tailwind CSS
- **App.jsx** - Main router setup
- **main.jsx** - Application entry point

#### **Configuration Files**

- **package.json** - Dependencies and scripts
- **vite.config.js** - Vite build configuration
- **tailwind.config.js** - Tailwind CSS customization
- **postcss.config.js** - PostCSS configuration
- **index.html** - HTML entry point

---

### 2️⃣ **BACKEND** - Express + MongoDB API

#### **Database Models (3 total)**

##### **User Model**
Stores employee information with fields:
```
- name, email, password (hashed)
- role: 'employee' | 'manager' | 'hr' | 'director'
- department, designation, managerId
- phone, date of birth, gender, address, city, state, zipCode
- leaveBalance (casual, sick, earned, maternity)
- isActive (true/false for terminated employees)
```

##### **Leave Model**
Stores leave requests with:
```
- employeeId (which employee)
- startDate, endDate, numberOfDays
- leaveType: 'casual' | 'sick' | 'earned' | 'maternity' | 'other'
- reason (why they need leave)
- status: 'applied' | 'manager-approved' | 'hr-approved' | 'director-approved' | 'rejected'
- approvals (detailed approval history from each level)
- rejectionReason (if rejected)
```

##### **Holiday Model**
Stores company holidays with:
```
- name (holiday name)
- date (when)
- description
- category: 'national' | 'state' | 'company'
- createdBy (director who added it)
```

#### **Controllers (5 total)**

##### **1. authController.js**
Handles login & registration:
- `register()` - Create new account
- `login()` - Login with email/password
- `getCurrentUser()` - Get logged-in user info

##### **2. userController.js**
Manages user accounts:
- `getProfile()` - Get your profile
- `updateProfile()` - Update your profile
- `getAllUsers()` - Get all employees (Director)
- `getTeamMembers()` - Get your team (Manager/HR/Director)
- `addUser()` - Add new employee (Director)
- `removeUser()` - Remove/terminate employee (Director)

##### **3. leaveController.js**
Handles leave workflow:
- `applyLeave()` - Apply for leave
- `getMyLeaves()` - Your leave requests
- `getTeamLeaves()` - Your team's leaves
- `getLeaveRequests()` - Pending approvals for you
- `approveLeave()` - Approve/move to next level
- `rejectLeave()` - Reject leave with reason
- `getLeaveHistory()` - Historical leave data

##### **4. holidayController.js**
Manages holidays:
- `getHolidays()` - List all holidays
- `addHoliday()` - Add new holiday (Director)
- `updateHoliday()` - Edit holiday (Director)
- `deleteHoliday()` - Delete holiday (Director)

##### **5. reportController.js**
Generates analytics:
- `getLeaveReport()` - Overall statistics
- `getEmployeeLeaveReport()` - Individual employee history
- `downloadReport()` - Export to CSV

#### **API Routes (5 files)**

```
/api/auth
├── POST /register        - Create account
├── POST /login           - Login
└── GET /me              - Get current user

/api/users
├── GET /profile         - Your profile
├── PUT /profile         - Update profile
├── GET /team            - Your team
├── GET /all             - All employees (Director)
├── POST /add            - Add employee (Director)
└── DELETE /:id          - Remove employee (Director)

/api/leaves
├── POST /apply          - Apply for leave
├── GET /my-leaves       - Your leaves
├── GET /team-leaves     - Team leaves
├── GET /requests        - Pending for approval
├── PUT /:id/approve     - Approve/move forward
├── PUT /:id/reject      - Reject leave
└── GET /history/:userId - Leave history

/api/holidays
├── GET /all             - All holidays
├── POST /add            - Add holiday (Director)
├── PUT /:id             - Update holiday (Director)
└── DELETE /:id          - Delete holiday (Director)

/api/reports
├── GET /leaves          - Overall statistics
├── GET /employee/:id    - Individual report
└── GET /download/:type  - Export CSV
```

#### **Middleware**

**auth.js** - Security layer
- Verifies JWT tokens
- Checks user roles
- Prevents unauthorized access

#### **Server Configuration**

**server.js**
- Starts Express server on port 5000
- Connects to MongoDB
- Sets up all routes
- Enables CORS for frontend

**.env** - Environment variables
- MongoDB connection string
- JWT secret
- Port number

---

## 🔄 HOW EVERYTHING WORKS TOGETHER

### Flow Diagram

```
User Browser
    ↓
Frontend (React at http://localhost:5173)
    ├─ AuthContext (manages login state)
    ├─ Pages (components user sees)
    └─ api.js (makes requests)
         ↓
API Request (HTTP)
         ↓
Backend (Express at http://localhost:5000)
    ├─ Routes (find correct endpoint)
    ├─ Middleware (check authorization)
    ├─ Controllers (execute business logic)
    └─ Models (interact with database)
         ↓
MongoDB Database
    ├─ Users collection
    ├─ Leaves collection
    └─ Holidays collection
         ↓
Response back to Frontend
    ↓
UI Updates
```

---

## 🚀 STEP-BY-STEP: HOW TO RUN

### **STEP 1: Open Two Terminals**

- **Terminal 1**: For Backend
- **Terminal 2**: For Frontend

---

### **STEP 2: Install Backend Dependencies**

**In Terminal 1:**

```bash
cd backend
npm install
```

**What this does:**
- Downloads all necessary packages
- Creates `node_modules` folder
- Takes 1-2 minutes

**Packages installed:**
- express (web server)
- mongoose (database)
- jsonwebtoken (authentication)
- bcryptjs (password security)
- cors (cross-origin access)

---

### **STEP 3: Install Frontend Dependencies**

**In Terminal 2:**

```bash
cd frontend
npm install
```

**What this does:**
- Downloads all React packages
- Sets up Vite build tool
- Takes 1-2 minutes

**Packages installed:**
- react (UI framework)
- vite (development server)
- tailwindcss (styling)
- axios (API calls)
- react-router (navigation)

---

### **STEP 4: Start MongoDB**

**Important:** MongoDB must be running!

#### Option A: Local MongoDB
```bash
# If MongoDB is installed locally
mongod
```

#### Option B: MongoDB Atlas (Cloud)
Create connection string:
1. Go to mongodb.com
2. Create free account
3. Create cluster
4. Get connection string
5. Update in `backend/.env`

---

### **STEP 5: Configure Backend (.env)**

**In Terminal 1, edit `backend/.env`:**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/workify
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workify

# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

---

### **STEP 6: Start the Backend**

**In Terminal 1:**

```bash
cd backend
npm run dev
```

**Expected output:**
```
Server running on port 5000
MongoDB connected successfully
API is ready at http://localhost:5000/api
```

**If this doesn't happen, check:**
- ✅ MongoDB is running
- ✅ Port 5000 is not in use
- ✅ .env file is correctly configured
- ✅ All npm packages installed

---

### **STEP 7: Start the Frontend**

**In Terminal 2:**

```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.0.8 ready in XXX ms

➜ Local:   http://localhost:5173/
➜ press h to show help
```

**If this doesn't happen, check:**
- ✅ All npm packages installed
- ✅ Port 5173 is not in use

---

### **STEP 8: Open in Browser**

Open your browser and go to:

```
http://localhost:5173
```

You should see the WORKIFY landing page! 🎉

---

## 🔐 LOGIN WITH DEMO ACCOUNTS

### Available Test Accounts

All passwords are: `password123`

```
1. Employee
   Email: employee@example.com
   Password: password123
   Access: Apply leaves, view profile, see holidays

2. Manager
   Email: manager@example.com
   Password: password123
   Access: Approve employee leaves, see team, apply own leave

3. HR
   Email: hr@example.com
   Password: password123
   Access: Review all requests, see all leaves, generate reports

4. Director
   Email: director@example.com
   Password: password123
   Access: Everything - add employees, manage holidays, full reports
```

---

## 🎯 TEST THE APPLICATION

### As Employee
1. Login with employee@example.com
2. Click "Apply Leave"
3. Select leave type and dates
4. Click "Apply"
5. Go to "Leaves" page - see status as "Applied"

### As Manager
1. Login with manager@example.com
2. Click "Leave Approvals"
3. Find employee leave
4. Click "Approve" or "Reject"
5. Can also view "Team Leaves"

### As HR
1. Login with hr@example.com
2. Click "Leave Approvals"
3. Approve leaves from manager
4. Can view all statistics
5. Can see team leaves

### As Director
1. Login with director@example.com
2. Click "Admin" - Add/Remove employees
3. Click "Holidays" - Add/Edit/Delete holidays
4. Click "Reports" - See all statistics
5. Can export reports as CSV

---

## 📊 LEAVE APPROVAL WORKFLOW

The leave goes through 4 approval stages:

```
Employee Applies
    ↓
Manager Approves (or Rejects - stops here)
    ↓
HR Reviews (or Rejects - stops here)
    ↓
Director Approves (or Rejects)
    ↓
Leave Approved/Rejected
```

**Important:**
- If rejected at any stage, leave is rejected
- Status updates in real-time
- Employee sees timeline of who approved/rejected

---

## 📁 FILE STRUCTURE QUICK REFERENCE

### Frontend File Locations

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── SignInPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── LeavesPage.jsx
│   │   ├── ApplyLeavePage.jsx
│   │   ├── HolidayCalendarPage.jsx
│   │   ├── AdminPage.jsx
│   │   ├── LeaveApprovalsPage.jsx
│   │   ├── TeamLeavesPage.jsx
│   │   ├── ReportsPage.jsx
│   │   └── SettingsPage.jsx
│   ├── layouts/
│   │   ├── DashboardLayout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

### Backend File Locations

```
backend/
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── leaveController.js
│   ├── holidayController.js
│   └── reportController.js
├── models/
│   ├── User.js
│   ├── Leave.js
│   └── Holiday.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── leaves.js
│   ├── holidays.js
│   └── reports.js
├── middleware/
│   └── auth.js
├── server.js
├── package.json
└── .env
```

---

## ⚙️ HOW TO STOP THE SERVERS

To stop the application:

**In Terminal 1 (Backend):**
```bash
Press Ctrl + C
```

**In Terminal 2 (Frontend):**
```bash
Press Ctrl + C
```

Both will stop gracefully.

---

## 🔄 RESTART THE SERVERS

To start again:

**Terminal 1:**
```bash
cd backend && npm run dev
```

**Terminal 2:**
```bash
cd frontend && npm run dev
```

Wait 5-10 seconds for both to be ready, then open http://localhost:5173

---

## 🐛 TROUBLESHOOTING

### Issue: Port 5000 already in use

**Solution:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Issue: Port 5173 already in use

**Solution:**
```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <PID> /F
```

### Issue: MongoDB connection error

**Solution:**
- Check if MongoDB is running
- Check connection string in .env
- Make sure database name is `workify`

### Issue: npm packages not installing

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -r node_modules package-lock.json

# Reinstall
npm install
```

### Issue: "Cannot find module" error

**Solution:**
```bash
# Reinstall dependencies
npm install

# Make sure you're in correct directory
cd backend  # or cd frontend
```

---

## 📝 USEFUL COMMANDS

### Backend Commands
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests (if configured)
```

### Frontend Commands
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 🎨 CUSTOMIZATION TIPS

### Change Colors
Edit `frontend/tailwind.config.js`

### Change Site Name
Edit `frontend/index.html` and page headers

### Add More Demo Accounts
Manually insert in MongoDB or modify backend seed data

### Change Port Numbers
- Backend: Edit `backend/.env` (PORT=)
- Frontend: Edit `frontend/vite.config.js`

---

## 📚 FOR MORE INFORMATION

- **Quick Setup**: See `QUICKSTART.md`
- **Detailed Setup**: See `SETUP.md`
- **Main Guide**: See `START_HERE.md`
- **Complete Docs**: See `README.md`
- **File List**: See `FILE_MANIFEST.md`

---

## ✅ CHECKLIST BEFORE RUNNING

- [ ] Node.js installed
- [ ] MongoDB installed or Atlas account created
- [ ] Backend .env configured
- [ ] Two terminals open
- [ ] Both npm install commands completed
- [ ] MongoDB is running
- [ ] No other services on ports 5000 or 5173

---

## 🎉 YOU'RE READY!

Everything is set up. Just follow these steps:

1. `cd backend && npm install` ← Install backend
2. `cd frontend && npm install` ← Install frontend
3. Start MongoDB ← Start database
4. `npm run dev` in backend folder ← Start API
5. `npm run dev` in frontend folder ← Start React app
6. Open http://localhost:5173 ← View in browser
7. Login with any demo account ← Start using!

**Happy coding! 🚀**

---

**WORKIFY v1.0 - Enterprise HRMS System**

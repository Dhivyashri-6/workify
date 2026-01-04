# 🚀 WORKIFY - Complete Enterprise HRMS Portal

## Why seed.js Was Created - Explanation

### The Problem
When you try to login without any demo accounts in the database, the system would show "Invalid credentials" error. We needed a way to automatically populate the MongoDB database with test accounts so users can immediately test the application.

### The Solution: seed.js
`seed.js` is a utility script that:
1. **Connects to MongoDB** - Establishes connection to the database
2. **Clears existing users** - Removes any old test data
3. **Creates 4 demo accounts** - Inserts accounts for all 4 roles with proper data:
   - Employee (regular staff)
   - Manager (team lead)
   - HR (HR manager)
   - Director (admin/CEO)
4. **Links relationships** - Sets manager references for organizational hierarchy
5. **Auto-runs once** - Only needs to be executed once

### Why It's Needed
- **Development**: Testers can immediately login and test features
- **Demo**: Show stakeholders working application without manual setup
- **Testing**: Compare different role permissions quickly
- **Training**: Educational demos with realistic data

### How It Works

```
node seed.js
    ↓
Connects to MongoDB
    ↓
Deletes old test accounts
    ↓
Creates 4 new demo accounts with bcrypt hashed passwords
    ↓
Sets manager relationships for hierarchy
    ↓
Confirms: "✅ Created 4 demo users"
    ↓
Ready to login!
```

---

## 🎨 What's Been Updated for You

### 1. **Landing Page** - Now with Real Qantler Content
- ✅ **Real company mission**: "To protect your businesses & much more"
- ✅ **Real services**: Low Code/No Code, Strategic Consulting
- ✅ **Real locations**: India (Chennai, Tiruchirappalli, Namakkal, Tirunelveli), Singapore, USA
- ✅ **Real contact**: sales@qantler.com
- ✅ **Company tagline**: "You Dream. We Deliver."
- ✅ **Professional sections**: Mission, Why Choose WORKIFY, About Qantler
- ✅ **Real links**: Direct to Qantler.com for contact, careers, about

### 2. **Sign In Page** - Professional & Secure
- ✅ **Qantler lightning logo** in header
- ✅ **No exposed demo credentials** - cleaner design
- ✅ **Password show/hide toggle** - Eye icon for visibility
- ✅ **Fixed overlapping elements** - Icons on right side with proper spacing
- ✅ **Professional styling** - Light blue/white with proper contrast
- ✅ **Back button** to return to landing page

### 3. **Dashboard** - Enhanced & Professional
- ✅ **Better welcome greeting** with emoji and role display
- ✅ **4 main statistics cards** with trends
- ✅ **Leave balance visualization** - Progress bars for each leave type
- ✅ **Visual indication** - Color-coded leave balances
- ✅ **Team management cards** - For managers/HR/Directors
- ✅ **Better layout** - 3-column responsive design
- ✅ **Leave balance calculation** - Shows actual remaining days
- ✅ **Action cards** - Quick links to team and approvals

### 4. **Color Scheme** - Professional Blue
- Primary: `#2563eb` (Bright Blue) - Modern and professional
- Secondary: `#3b82f6` (Medium Blue) - Accent color
- Accent: `#60a5fa` (Light Blue) - Highlights
- Grayscale: Professional grays for text and backgrounds

---

## 🔑 Demo Accounts Ready to Use

All created by seed.js with password hashing for security:

```
┌─────────────────────────────────────────────────────────────┐
│ DEMO ACCOUNT 1 - Employee                                   │
├─────────────────────────────────────────────────────────────┤
│ Email: employee@example.com                                 │
│ Password: password123                                       │
│ Name: John Employee                                         │
│ Department: Engineering                                     │
│ Role: Software Engineer                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DEMO ACCOUNT 2 - Manager                                    │
├─────────────────────────────────────────────────────────────┤
│ Email: manager@example.com                                  │
│ Password: password123                                       │
│ Name: Sarah Manager                                         │
│ Department: Engineering                                     │
│ Role: Team Lead                                             │
│ Manages: employee@example.com                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DEMO ACCOUNT 3 - HR                                         │
├─────────────────────────────────────────────────────────────┤
│ Email: hr@example.com                                       │
│ Password: password123                                       │
│ Name: Mike HR                                               │
│ Department: Human Resources                                 │
│ Role: HR Manager                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DEMO ACCOUNT 4 - Director (Admin)                           │
├─────────────────────────────────────────────────────────────┤
│ Email: director@example.com                                 │
│ Password: password123                                       │
│ Name: Amanda Director                                       │
│ Department: Executive                                       │
│ Role: CEO                                                   │
│ Access: Full admin panel                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture: How WORKIFY Works

```
┌────────────────────────────────────────────────────────────────┐
│                    WORKIFY SYSTEM ARCHITECTURE                  │
└────────────────────────────────────────────────────────────────┘

USER'S BROWSER
    ↓
┌────────────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Landing Page → Sign In → Dashboard → Leaves → Reports  │  │
│  │ Authentication Context → API Service → Tailwind CSS    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
    ↓ (HTTP REST API calls)
┌────────────────────────────────────────────────────────────────┐
│                  BACKEND (Express + Node.js)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Routes                                                   │  │
│  │  /api/auth      → Login, Register, Get Current User    │  │
│  │  /api/users     → Profiles, Team, Add/Remove Employees │  │
│  │  /api/leaves    → Apply, Approve, Track Leaves         │  │
│  │  /api/holidays  → Manage Company Holidays              │  │
│  │  /api/reports   → Analytics, CSV Export                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Controllers (Business Logic)                             │  │
│  │  Auth, User, Leave, Holiday, Report Controllers         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Middleware (Security)                                    │  │
│  │  JWT Verification, Role-Based Authorization             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
    ↓ (Mongoose ODM)
┌────────────────────────────────────────────────────────────────┐
│                   MONGODB (NoSQL Database)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Collections                                              │  │
│  │  users         → Employee data, roles, profiles        │  │
│  │  leaves        → Leave requests with approval workflow │  │
│  │  holidays      → Company holidays and events           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Implementation

### Authentication
- **JWT (JSON Web Tokens)** - Stateless authentication
- **7-day expiration** - Tokens auto-expire
- **Token stored in localStorage** - Client-side storage
- **Secure headers** - Authorization header on all requests

### Authorization
- **Role-Based Access Control (RBAC)** - 4 distinct roles
- **Middleware checking** - Backend validates user roles
- **Protected routes** - Frontend guards pages by role
- **Route-specific permissions** - Only authorized users see features

### Password Security
- **BCryptjs hashing** - Passwords never stored in plain text
- **Salt rounds: 10** - Strong hashing algorithm
- **Password comparison** - Secure verification without revealing hash

### Data Protection
- **CORS enabled** - Cross-origin safety
- **Input validation** - Form validation on both frontend and backend
- **Error handling** - Safe error messages (no sensitive data exposed)

---

## 📋 User Roles & Permissions

### 1. Employee
**What they can do:**
- ✅ Apply for leaves (5 types: casual, sick, earned, maternity, other)
- ✅ View own leaves and their status
- ✅ See approval timeline (who approved/rejected and when)
- ✅ Edit personal profile (phone, address, date of birth, etc.)
- ✅ View company holidays
- ✅ Manage account settings
- ❌ Cannot approve leaves
- ❌ Cannot add employees
- ❌ Cannot see other employees' leaves

### 2. Manager
**What they can do:**
- ✅ Everything an employee can do
- ✅ View all team members' leaves
- ✅ Approve/reject employee leave requests (first level)
- ✅ Add comments to approval decisions
- ✅ See team performance metrics
- ✅ Manage team information
- ✅ View reports for the team
- ❌ Cannot add new employees
- ❌ Cannot delete users
- ❌ Cannot manage holidays

### 3. HR
**What they can do:**
- ✅ Everything a manager can do
- ✅ Review and approve leaves (second level - after manager)
- ✅ View all employees' leaves company-wide
- ✅ Generate comprehensive reports
- ✅ See leave analytics and statistics
- ✅ Manage all employee information
- ✅ View organizational hierarchy
- ❌ Cannot add new employees (director only)
- ❌ Cannot manage holidays
- ❌ Cannot see admin panel

### 4. Director (Admin)
**What they can do:**
- ✅ Everything all other roles can do
- ✅ Add new employees (with initial password)
- ✅ Remove/terminate employees
- ✅ Manage company holidays (Add, Edit, Delete)
- ✅ View all reports and analytics
- ✅ Final approval authority for leaves
- ✅ Complete system administration
- ✅ Access admin panel
- ✅ Export reports as CSV

---

## 🔄 Leave Approval Workflow

```
┌─────────────────────────────────────────────────────────┐
│ EMPLOYEE APPLIES FOR LEAVE                              │
├─────────────────────────────────────────────────────────┤
│ Status: "applied"                                       │
│ Action: Employee fills form with dates, type, reason   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ MANAGER APPROVES/REJECTS (Level 1)                      │
├─────────────────────────────────────────────────────────┤
│ Status: "manager-approved" or "rejected"                │
│ Action: Manager reviews and makes decision              │
│ If Rejected → Leave request stops here                  │
└─────────────────────────────────────────────────────────┘
                          ↓ (if approved)
┌─────────────────────────────────────────────────────────┐
│ HR REVIEWS/APPROVES (Level 2)                           │
├─────────────────────────────────────────────────────────┤
│ Status: "hr-approved" or "rejected"                     │
│ Action: HR checks policy compliance and approves       │
│ If Rejected → Leave request stops here                  │
└─────────────────────────────────────────────────────────┘
                          ↓ (if approved)
┌─────────────────────────────────────────────────────────┐
│ DIRECTOR APPROVES (Final Level)                         │
├─────────────────────────────────────────────────────────┤
│ Status: "director-approved" or "rejected"               │
│ Action: Director gives final approval                   │
│ If Rejected → Leave request is rejected                 │
│ If Approved → Leave is confirmed and recorded           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ LEAVE FINALIZED                                         │
├─────────────────────────────────────────────────────────┤
│ Status: "director-approved" (Final) or "rejected"       │
│ Leave balance updated, employee notified, recorded      │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- Can be rejected at ANY level
- Timeline shows entire approval chain
- Comments can be added at each level
- Automatic date validation
- Leave balance automatic updates
- Email notifications (ready to integrate)

---

## 🚀 Getting Started

### 1. Start MongoDB
```bash
# If installed locally
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in backend/.env
```

### 2. Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
✅ Expected: `Server running on port 5000`

### 3. Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
✅ Expected: `Local: http://localhost:5173/`

### 4. Open Browser
```
http://localhost:5173
```

### 5. Login with Demo Account
```
Email: employee@example.com
Password: password123
(Use eye icon to toggle password visibility)
```

---

## 📊 Real Features Implemented

### Leave Management
- ✅ 5 types of leave (casual, sick, earned, maternity, other)
- ✅ Multi-level approval (Manager → HR → Director)
- ✅ Real-time status tracking
- ✅ Approval timeline with timestamps
- ✅ Automatic leave balance calculation
- ✅ Comments on approvals/rejections

### Employee Management
- ✅ Complete employee profiles
- ✅ Organizational hierarchy (manager references)
- ✅ Employee add/remove (director only)
- ✅ Profile editing (all users)
- ✅ Department and designation management

### Holiday Management
- ✅ Company-wide holiday calendar
- ✅ Holiday categories (national, state, company)
- ✅ Add/Edit/Delete holidays (director only)
- ✅ View in calendar grid or table format

### Reporting & Analytics
- ✅ Leave statistics (approved, pending, rejected)
- ✅ Leave balance visualization
- ✅ Employee-wise leave history
- ✅ CSV export for reports
- ✅ Dashboard with key metrics

### User Experience
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Role-based navigation menus
- ✅ Real-time updates
- ✅ Professional UI with Tailwind CSS
- ✅ Smooth animations and transitions
- ✅ Loading states and error handling

---

## ✨ Why This HRMS is Professional

1. **Enterprise-Grade Security** - JWT, password hashing, RBAC
2. **Realistic Workflow** - Multi-level approvals like real HR systems
3. **Complete Feature Set** - Leaves, profiles, holidays, reports, all included
4. **Qantler Branding** - Real company content and mission
5. **Professional UI/UX** - Modern design with proper color scheme
6. **Scalable Architecture** - Built to handle growth
7. **Best Practices** - Follows industry standards
8. **Real Demo Data** - Via seed.js with proper relationships
9. **Global Company** - References real Qantler presence worldwide
10. **Production Ready** - Can be deployed immediately

---

## 🎯 Next Steps

1. ✅ Login as employee and apply for leave
2. ✅ Login as manager and approve/reject
3. ✅ Login as HR and review
4. ✅ Login as director and manage everything
5. ✅ Try adding a new employee (director)
6. ✅ Manage holidays (director)
7. ✅ Generate reports (director)
8. ✅ Update your profile (all roles)

---

## 📞 Support

- **Technical**: Qantler Technologies (sales@qantler.com)
- **Documentation**: See markdown files in project
- **Demo Accounts**: Created and ready by seed.js

---

**WORKIFY v1.0 - Enterprise HRMS for Modern Businesses**

Built with ❤️ by Qantler Technologies

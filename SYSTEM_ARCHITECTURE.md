# 📊 WORKIFY System Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         WORKIFY HRMS                             │
│                    Enterprise System Overview                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    👥 USER ROLES (4 Total)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👤 EMPLOYEE         👔 MANAGER        👨‍💼 HR             👔 DIRECTOR  │
│  ├─ Apply Leaves     ├─ All above      ├─ All above     ├─ All above │
│  ├─ View Own Leaves  ├─ Team Leaves    ├─ Company Leaves├─ Admin      │
│  ├─ Edit Profile     ├─ Approve L1     ├─ Approve L2    ├─ Add Users  │
│  └─ View Holidays    └─ Reports        ├─ Reports       ├─ Holidays   │
│                                        └─ Analytics     └─ Full Power │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              📱 FRONTEND (React + Vite + Tailwind)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🏠 PAGES (12 Total):                                           │
│  ├─ LandingPage          → Company info, features              │
│  ├─ SignInPage           → JWT authentication                  │
│  ├─ Dashboard            → Statistics, leave balance           │
│  ├─ ProfilePage          → Editable user info                  │
│  ├─ LeavesPage           → Filtered leave list                 │
│  ├─ ApplyLeavePage       → Leave application form              │
│  ├─ HolidayCalendarPage  → Holiday management                  │
│  ├─ AdminPage            → User management (Director)          │
│  ├─ LeaveApprovalsPage   → Approval workflow                   │
│  ├─ TeamLeavesPage       → Team leave overview                 │
│  ├─ ReportsPage          → Analytics & CSV export              │
│  └─ SettingsPage         → User preferences                    │
│                                                                  │
│  🔧 CORE COMPONENTS:                                            │
│  ├─ DashboardLayout      → Sidebar + Navigation                │
│  ├─ ProtectedRoute       → Role-based route guard              │
│  ├─ AuthContext          → Global auth state                   │
│  ├─ API Service          → Axios HTTP client                   │
│  └─ Tailwind CSS         → Responsive design                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ REST API (20+ Endpoints)
┌─────────────────────────────────────────────────────────────────┐
│           🔧 BACKEND (Express + Node.js + JWT)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🛣️ ROUTES (5 Groups):                                          │
│  ├─ /api/auth            → Login, Register, Get User           │
│  ├─ /api/users           → Profiles, Teams, Add/Remove         │
│  ├─ /api/leaves          → Apply, Approve, Track               │
│  ├─ /api/holidays        → CRUD operations                     │
│  └─ /api/reports         → Analytics, CSV Export               │
│                                                                  │
│  🎮 CONTROLLERS (5 Total):                                      │
│  ├─ authController       → Authentication logic                │
│  ├─ userController       → User management                     │
│  ├─ leaveController      → Leave workflow                      │
│  ├─ holidayController    → Holiday management                  │
│  └─ reportController     → Analytics & reports                 │
│                                                                  │
│  🔐 MIDDLEWARE:                                                 │
│  ├─ JWT Verification     → Token validation                    │
│  └─ Role Authorization   → RBAC enforcement                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ Mongoose ODM
┌─────────────────────────────────────────────────────────────────┐
│            💾 MONGODB DATABASE (3 Collections)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👥 Users Collection                                            │
│  ├─ name, email, password (hashed)                            │
│  ├─ role (employee | manager | hr | director)                 │
│  ├─ department, designation, managerId                        │
│  ├─ phone, dob, gender, address, city, state, zipCode       │
│  ├─ leaveBalance (casual, sick, earned, maternity)          │
│  ├─ isActive (true/false for termination)                    │
│  └─ timestamps (createdAt, updatedAt)                        │
│                                                                  │
│  📋 Leaves Collection                                          │
│  ├─ employeeId (reference to User)                           │
│  ├─ startDate, endDate, numberOfDays                         │
│  ├─ leaveType (casual | sick | earned | maternity | other)  │
│  ├─ reason (leave reason)                                     │
│  ├─ status (applied | manager-approved | hr-approved |       │
│  │          director-approved | rejected)                    │
│  ├─ approvals (array with role, userId, status, comments)   │
│  ├─ rejectionReason, rejectedBy                              │
│  └─ timestamps                                                │
│                                                                  │
│  🎉 Holidays Collection                                        │
│  ├─ name, date, description                                  │
│  ├─ category (national | state | company)                    │
│  ├─ createdBy (Director ID)                                  │
│  └─ timestamps                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Leave Approval Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    LEAVE APPROVAL PROCESS                         │
└──────────────────────────────────────────────────────────────────┘

         ┌─────────────────────────────────────┐
         │   EMPLOYEE APPLIES FOR LEAVE        │
         │   Status: "applied"                 │
         └──────────────┬──────────────────────┘
                        │
                        ↓
         ┌─────────────────────────────────────┐
         │  MANAGER REVIEWS & APPROVES (L1)    │
         │  Status: "manager-approved" or ...  │
         └──────────────┬──────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
        REJECTS                    APPROVES
          │                           │
          ↓                           ↓
    ┌─────────────┐          ┌──────────────────────────────┐
    │ REJECTED ❌ │          │ HR REVIEWS & APPROVES (L2)    │
    │ Process End │          │ Status: "hr-approved" or ...  │
    └─────────────┘          └──────────────┬───────────────┘
                                            │
                             ┌──────────────┴──────────────┐
                             │                             │
                           REJECTS                      APPROVES
                             │                             │
                             ↓                             ↓
                        ┌─────────────┐        ┌──────────────────────┐
                        │ REJECTED ❌ │        │ DIRECTOR APPROVES (L3)│
                        │ Process End │        │ Status: "director-..." │
                        └─────────────┘        └──────────────┬───────┘
                                                             │
                                         ┌───────────────────┴──────────────┐
                                         │                                  │
                                       REJECTS                           APPROVES
                                         │                                  │
                                         ↓                                  ↓
                                    ┌─────────────┐            ┌──────────────────┐
                                    │ REJECTED ❌ │            │ APPROVED ✅      │
                                    │ Process End │            │ Leave Confirmed  │
                                    └─────────────┘            │ Balance Updated  │
                                                              └──────────────────┘

KEY POINTS:
• Can be rejected at ANY stage
• Each stage can add comments
• Timeline shows entire chain
• Automatic date validation
• Leave balance updates automatically
```

---

## Feature Matrix by Role

```
┌────────────────────────────────────────────────────────────────────┐
│                    FEATURE AVAILABILITY BY ROLE                     │
├────────────────┬──────────┬──────────┬──────────┬──────────┬────────┤
│ Feature        │ Employee │ Manager  │ HR       │ Director │ Notes  │
├────────────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ Apply Leave    │    ✅    │    ✅    │    ✅    │    ✅    │ All    │
│ View Own       │    ✅    │    ✅    │    ✅    │    ✅    │ Basic  │
│ View Team      │    ❌    │    ✅    │    ✅    │    ✅    │ Mgmt   │
│ View All       │    ❌    │    ❌    │    ✅    │    ✅    │ Admin  │
│ Approve (L1)   │    ❌    │    ✅    │    ❌    │    ❌    │ Mgr    │
│ Approve (L2)   │    ❌    │    ❌    │    ✅    │    ❌    │ HR     │
│ Approve (L3)   │    ❌    │    ❌    │    ❌    │    ✅    │ Dir    │
│ Reject        │    ❌    │    ✅    │    ✅    │    ✅    │ Apprvr │
│ Edit Profile   │    ✅    │    ✅    │    ✅    │    ✅    │ All    │
│ View Holidays  │    ✅    │    ✅    │    ✅    │    ✅    │ All    │
│ Manage Holiday │    ❌    │    ❌    │    ❌    │    ✅    │ Dir    │
│ Add Employee   │    ❌    │    ❌    │    ❌    │    ✅    │ Dir    │
│ Remove Emp.    │    ❌    │    ❌    │    ❌    │    ✅    │ Dir    │
│ View Reports   │    ❌    │    ✅    │    ✅    │    ✅    │ Mgmt   │
│ Export Reports │    ❌    │    ❌    │    ❌    │    ✅    │ Dir    │
│ Settings       │    ✅    │    ✅    │    ✅    │    ✅    │ All    │
│ Admin Panel    │    ❌    │    ❌    │    ❌    │    ✅    │ Dir    │
└────────────────┴──────────┴──────────┴──────────┴──────────┴────────┘

Legend:
✅ = Full Access
❌ = No Access
L1 = Level 1 (Manager approval)
L2 = Level 2 (HR approval)
L3 = Level 3 (Director approval)
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST/RESPONSE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

USER BROWSER
    │
    │ 1. User clicks "Apply Leave"
    ↓
REACT COMPONENT
    │
    │ 2. Form validation
    │ 3. Gather data
    ↓
API SERVICE (Axios)
    │
    │ 4. Add JWT token to header
    │ 5. Make HTTP POST request
    │ POST /api/leaves/apply
    ↓
EXPRESS SERVER
    │
    │ 6. Receive request
    │ 7. Extract token from header
    ↓
MIDDLEWARE (Auth)
    │
    │ 8. Verify JWT token
    │ 9. Extract user from token
    │ 10. Check if user is logged in
    ↓
MIDDLEWARE (Validation)
    │
    │ 11. Validate request data
    │ 12. Check dates, leave type
    │ 13. Verify leave balance
    ↓
CONTROLLER (leaveController)
    │
    │ 14. Process business logic
    │ 15. Calculate number of days
    │ 16. Create leave document
    ↓
MODEL (Leave)
    │
    │ 17. Validate schema
    │ 18. Add timestamps
    ↓
DATABASE (MongoDB)
    │
    │ 19. Save to database
    │ 20. Return created document
    ↓
RESPONSE HANDLER
    │
    │ 21. Format response
    │ 22. Send JSON response
    ↓
API SERVICE
    │
    │ 23. Parse response
    │ 24. Update component state
    ↓
REACT COMPONENT
    │
    │ 25. Re-render with new data
    │ 26. Show success message
    ↓
USER SEES
    │
    ✅ Leave successfully applied!
```

---

## Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                        │
└────────────────────────────────────────────────────────────────┘

LAYER 1: BROWSER
├─ HTTPS/SSL encryption (when deployed)
├─ Secure token storage (localStorage with secure flags)
├─ XSS protection (React auto-escapes)
└─ CSRF tokens (when needed)

    ↓

LAYER 2: FRONTEND
├─ Protected routes (ProtectedRoute component)
├─ Role checking before rendering
├─ Input validation
├─ Client-side access control
└─ Secure API calls

    ↓ (HTTPS)

LAYER 3: NETWORK
├─ CORS policy enforcement
├─ Rate limiting (can be added)
├─ DDoS protection (when deployed)
└─ SSL/TLS encryption

    ↓

LAYER 4: BACKEND
├─ JWT verification middleware
├─ User authentication check
├─ Role authorization middleware
├─ Request validation
└─ Error handling without data leaks

    ↓

LAYER 5: DATABASE
├─ MongoDB authentication
├─ Connection encryption
├─ Data validation (Mongoose schemas)
├─ Indexed fields for performance
└─ Backup and recovery

    ↓

LAYER 6: APPLICATION
├─ Password hashing (BCryptjs)
├─ Secure password comparison
├─ Token expiration
├─ Session management
└─ Audit logging (can be added)
```

---

## Performance Metrics

```
┌────────────────────────────────────────────────────────────────┐
│                  WORKIFY PERFORMANCE TARGETS                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📊 API Response Times:                                       │
│  • Login: < 200ms                                            │
│  • Fetch leaves: < 300ms                                     │
│  • Approve leave: < 250ms                                    │
│  • Generate report: < 500ms                                  │
│                                                                │
│  💾 Database:                                                │
│  • Indexed queries: < 100ms                                  │
│  • Bulk operations: < 1s                                     │
│  • Connection pool: 10-50 connections                        │
│                                                                │
│  🚀 Frontend:                                                │
│  • Initial load: < 2s                                        │
│  • Page transitions: < 300ms                                 │
│  • Search/filter: < 200ms                                    │
│                                                                │
│  🔒 Security:                                                │
│  • Token validation: < 50ms                                  │
│  • Password hashing: < 1s (one-time)                        │
│  • Authorization check: < 50ms                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Deployment Ready Checklist

```
┌────────────────────────────────────────────────────────────────┐
│               PRODUCTION DEPLOYMENT CHECKLIST                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ SECURITY                                  │ Status           │
│ ├─ JWT secret configured                 │ ✅ Required       │
│ ├─ HTTPS/SSL enabled                     │ ✅ Required       │
│ ├─ CORS properly configured              │ ✅ Required       │
│ ├─ Environment variables set             │ ✅ Required       │
│ ├─ Password requirements enforced        │ ✅ Implemented    │
│ └─ Rate limiting enabled                 │ ⚠️ Optional       │
│                                                                │
│ DATABASE                                  │ Status           │
│ ├─ MongoDB production instance           │ ✅ Required       │
│ ├─ Backups configured                    │ ✅ Required       │
│ ├─ Connection string secure              │ ✅ Required       │
│ ├─ Collections indexed                   │ ✅ Optimized      │
│ └─ Authentication enabled                │ ✅ Configured     │
│                                                                │
│ BACKEND                                   │ Status           │
│ ├─ Error handling production-ready       │ ✅ Implemented    │
│ ├─ Logging configured                    │ ⚠️ Optional       │
│ ├─ Environment production                │ ✅ Required       │
│ ├─ API routes documented                 │ ✅ Complete       │
│ └─ Health check endpoints                │ ⚠️ Optional       │
│                                                                │
│ FRONTEND                                  │ Status           │
│ ├─ Build optimized                       │ ✅ Vite ready     │
│ ├─ API endpoints configured              │ ✅ Required       │
│ ├─ Environment variables set             │ ✅ Required       │
│ ├─ Error boundaries added                │ ⚠️ Optional       │
│ └─ Analytics ready                       │ ⚠️ Optional       │
│                                                                │
│ MONITORING                                │ Status           │
│ ├─ Error tracking (Sentry)               │ ⚠️ Optional       │
│ ├─ Performance monitoring                │ ⚠️ Optional       │
│ ├─ Log aggregation                       │ ⚠️ Optional       │
│ └─ Uptime monitoring                     │ ⚠️ Optional       │
│                                                                │
│ ✅ = Done & Ready | ⚠️ = Optional | ❌ = Not Done             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Qantler Technologies Integration

```
┌────────────────────────────────────────────────────────────────┐
│             QANTLER TECHNOLOGIES BRANDING                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 📍 LOCATIONS:                                                 │
│  • India:                                                      │
│    - Chennai (HQ): Gamma Block, SSPDL Alpha City             │
│    - Tiruchirappalli: St.Joseph's College Campus             │
│    - Namakkal: LMR Shopping Arcade                           │
│    - Tirunelveli: FXEC Campus                                │
│  • Singapore: Jalan Besar                                    │
│  • USA: Edison, New Jersey                                   │
│                                                                │
│ 🎯 MISSION:                                                   │
│  "To protect your businesses & much more"                    │
│                                                                │
│ 💡 MOTTO:                                                     │
│  "You Dream. We Deliver."                                    │
│                                                                │
│ 🔧 SPECIALIZATIONS:                                           │
│  • Low Code / No Code platforms                              │
│  • Strategic IT consulting                                   │
│  • Custom application development                            │
│  • Digital transformation                                    │
│                                                                │
│ 📞 CONTACT:                                                   │
│  • Email: sales@qantler.com                                  │
│  • Website: https://qantler.com                              │
│                                                                │
│ 🌐 GLOBAL PRESENCE:                                           │
│  • Serves Fortune 500 companies                              │
│  • International expertise                                   │
│  • Proven track record                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**WORKIFY System Architecture & Documentation**
*Complete Enterprise HRMS Platform*
*By Qantler Technologies*

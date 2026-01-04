# WORKIFY Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js installed
- MongoDB running (locally or Atlas)

### Step 1: Backend Setup (2 minutes)

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/workify
JWT_SECRET=your_secret_key
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

Expected output:
```
Server running on port 5000
MongoDB Connected
```

### Step 2: Frontend Setup (2 minutes)

Open new terminal:
```bash
cd frontend
npm install
npm run dev
```

Expected output:
```
VITE v5.0.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 3: Access Application (1 minute)

Open browser: `http://localhost:5173`

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Director | director@example.com | password123 |
| HR | hr@example.com | password123 |
| Manager | manager@example.com | password123 |
| Employee | employee@example.com | password123 |

---

## 🎯 First Time User Actions

### As Director:
1. ✅ Go to Admin Panel → Add Users
2. ✅ Go to Holiday Calendar → Add Holidays
3. ✅ Review Leave Approvals

### As Manager:
1. ✅ View Team Leaves
2. ✅ Approve/Reject Leave Requests

### As HR:
1. ✅ Review Leave Approvals
2. ✅ View Reports

### As Employee:
1. ✅ Go to Apply Leave
2. ✅ Submit Leave Request
3. ✅ Track Status in Leaves Page
4. ✅ Edit Profile

---

## 📊 Feature Overview

| Feature | Employee | Manager | HR | Director |
|---------|----------|---------|-----|----------|
| Apply Leave | ✅ | ✅ | ✅ | ✅ |
| View My Leaves | ✅ | ✅ | ✅ | ✅ |
| View Team Leaves | ❌ | ✅ | ✅ | ✅ |
| Approve Leaves | ❌ | ✅ | ✅ | ✅ |
| View Reports | ❌ | ❌ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ❌ | ✅ |
| Manage Holidays | ❌ | ❌ | ❌ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ | ✅ |

---

## 🔧 Troubleshooting

**Port Already in Use?**
```bash
# Change PORT in backend/.env to 5001
```

**MongoDB Not Connecting?**
```bash
# Make sure MongoDB is running
mongod
```

**Frontend Not Loading?**
```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules
cd frontend && npm install
npm run dev
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/server.js` | Backend entry point |
| `frontend/src/App.jsx` | Frontend main component |
| `backend/models/User.js` | User schema |
| `backend/models/Leave.js` | Leave schema |
| `backend/controllers/` | Business logic |
| `frontend/pages/` | Page components |

---

## 🌐 Available Routes

**Frontend:**
- `/` - Landing page
- `/signin` - Sign in
- `/dashboard` - Main dashboard
- `/leaves` - Leave management
- `/apply-leave` - Apply for leave
- `/profile` - User profile
- `/holidays` - Holiday calendar
- `/admin` - Admin panel (Director)
- `/approvals` - Leave approvals (Manager/HR/Director)
- `/team-leaves` - Team leaves (Manager)
- `/reports` - Reports (Director)
- `/settings` - Settings

**Backend API:**
- `POST /api/auth/login` - Login
- `GET /api/leaves/my-leaves` - Get my leaves
- `POST /api/leaves/apply` - Apply leave
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile

---

## 💾 MongoDB Setup

### Option 1: Local MongoDB
```bash
# macOS
brew services start mongodb-community

# Windows - Run MongoDB Server
mongod

# Linux
sudo systemctl start mongod
```

### Option 2: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env`

---

## 📞 Need Help?

Check these files:
- `README.md` - Detailed documentation
- `SETUP.md` - Complete setup guide
- Backend logs - Check terminal for errors
- Browser console - Check for frontend errors (F12)

---

## 🎓 Learn More

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Tutorial](https://docs.mongodb.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**You're all set! Start exploring WORKIFY! 🎉**

const User = require('../models/User');
const Leave = require('../models/Leave');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('managerId', 'name email');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, dob, gender, address, city, state, zipCode, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        dob,
        gender,
        address,
        city,
        state,
        zipCode,
        profileImage,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (Director only)
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get team members
exports.getTeamMembers = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'manager') {
      query = { managerId: req.user.id };
    } else if (req.user.role === 'hr') {
      query = { role: { $in: ['employee', 'manager'] } };
    } else if (req.user.role === 'director') {
      query = { _id: { $ne: req.user.id } };
    }

    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add user (Director only)
exports.addUser = async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, email, role, department, designation, managerId } = req.body;

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role,
      department,
      designation,
      managerId: managerId || null,
    });

    // TODO: Send email with credentials

    res.status(201).json({
      message: 'User added successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        temporaryPassword: tempPassword,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove user (Director only)
exports.removeUser = async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.params.id;

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot remove yourself' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove managerId references from employees who have this user as manager
    await User.updateMany(
      { managerId: userId },
      { $unset: { managerId: '' } }
    );

    // Delete all leaves associated with this user
    await Leave.deleteMany({ employeeId: userId });

    // Delete all leaves where this user was an approver
    await Leave.updateMany(
      { 'approvals.userId': userId },
      { $pull: { approvals: { userId: userId } } }
    );

    // Delete leaves where this user rejected them
    await Leave.updateMany(
      { rejectedBy: userId },
      { $unset: { rejectedBy: '' } }
    );

    // Delete the user from database
    await User.findByIdAndDelete(userId);

    // TODO: Send termination email

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

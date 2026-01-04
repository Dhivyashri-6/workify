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
    const { name, email, phone, dob, gender, address, city, state, zipCode, department, designation, managerId, profileImage } = req.body;

    // Check if email is being changed and if it already exists
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData = {
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
    };

    // Allow email update
    if (email) {
      updateData.email = email.toLowerCase();
    }

    // Allow department and designation update
    if (department !== undefined) {
      updateData.department = department;
    }
    if (designation !== undefined) {
      updateData.designation = designation;
    }

    // Allow managerId update only for employees
    if (req.user.role === 'employee' && managerId !== undefined) {
      // Validate manager exists and is actually a manager
      if (managerId) {
        const manager = await User.findById(managerId);
        if (!manager || manager.role !== 'manager') {
          return res.status(400).json({ message: 'Invalid manager selected' });
        }
      }
      updateData.managerId = managerId || null;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('managerId', 'name email');

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

// Get all managers (for employee profile editing)
exports.getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager', isActive: true })
      .select('name email department designation')
      .sort({ name: 1 });
    res.json(managers);
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

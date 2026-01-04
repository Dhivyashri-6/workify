const User = require('../models/User');

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

    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });

    // TODO: Send termination email

    res.json({ message: 'User removed successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

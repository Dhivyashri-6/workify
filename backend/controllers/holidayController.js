const Holiday = require('../models/Holiday');

// Get all holidays
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().populate('createdBy', 'name');
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add holiday
exports.addHoliday = async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, date, description, category } = req.body;

    const holiday = await Holiday.create({
      name,
      date,
      description,
      category,
      createdBy: req.user.id,
    });

    res.status(201).json({ message: 'Holiday added successfully', holiday });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update holiday
exports.updateHoliday = async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, date, description, category } = req.body;

    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { name, date, description, category, updatedAt: new Date() },
      { new: true }
    );

    res.json({ message: 'Holiday updated successfully', holiday });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete holiday
exports.deleteHoliday = async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Holiday.findByIdAndDelete(req.params.id);

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

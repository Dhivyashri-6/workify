const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create demo users
    const demoUsers = [
      {
        name: 'John Employee',
        email: 'employee@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Engineering',
        designation: 'Software Engineer',
        phone: '+1234567890',
        dob: new Date('1995-05-15'),
        gender: 'Male',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Sarah Manager',
        email: 'manager@example.com',
        password: hashedPassword,
        role: 'manager',
        department: 'Engineering',
        designation: 'Team Lead',
        phone: '+1234567891',
        dob: new Date('1990-08-20'),
        gender: 'Female',
        address: '456 Oak Ave',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Mike HR',
        email: 'hr@example.com',
        password: hashedPassword,
        role: 'hr',
        department: 'Human Resources',
        designation: 'HR Manager',
        phone: '+1234567892',
        dob: new Date('1988-03-10'),
        gender: 'Male',
        address: '789 Pine Rd',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Amanda Director',
        email: 'director@example.com',
        password: hashedPassword,
        role: 'director',
        department: 'Executive',
        designation: 'CEO',
        phone: '+1234567893',
        dob: new Date('1985-12-05'),
        gender: 'Female',
        address: '321 Executive Blvd',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
    ];

    // Insert users
    const createdUsers = await User.insertMany(demoUsers);
    console.log(`✅ Created ${createdUsers.length} demo users`);

    // Update manager reference for employee
    await User.findOneAndUpdate(
      { email: 'employee@example.com' },
      { managerId: createdUsers[1]._id }
    );
    console.log('✅ Linked employee to manager');

    console.log('\n📋 Demo Accounts Created:');
    console.log('Employee: employee@example.com / password123');
    console.log('Manager: manager@example.com / password123');
    console.log('HR: hr@example.com / password123');
    console.log('Director: director@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

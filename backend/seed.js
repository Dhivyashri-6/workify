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

    // Create demo users - Directors first
    const directors = [
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
      {
        name: 'Robert Chen',
        email: 'robert.chen@example.com',
        password: hashedPassword,
        role: 'director',
        department: 'Executive',
        designation: 'CTO',
        phone: '+1234567894',
        dob: new Date('1983-07-18'),
        gender: 'Male',
        address: '555 Tech Park',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
    ];

    // Managers
    const managers = [
      {
        name: 'Sarah Manager',
        email: 'manager@example.com',
        password: hashedPassword,
        role: 'manager',
        department: 'Engineering',
        designation: 'Engineering Manager',
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
        name: 'David Thompson',
        email: 'david.thompson@example.com',
        password: hashedPassword,
        role: 'manager',
        department: 'Sales',
        designation: 'Sales Manager',
        phone: '+1234567895',
        dob: new Date('1987-04-12'),
        gender: 'Male',
        address: '789 Market St',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        password: hashedPassword,
        role: 'manager',
        department: 'Marketing',
        designation: 'Marketing Manager',
        phone: '+1234567896',
        dob: new Date('1989-11-25'),
        gender: 'Female',
        address: '234 Creative Blvd',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'James Wilson',
        email: 'james.wilson@example.com',
        password: hashedPassword,
        role: 'manager',
        department: 'Engineering',
        designation: 'Senior Engineering Manager',
        phone: '+1234567897',
        dob: new Date('1986-09-30'),
        gender: 'Male',
        address: '567 Code Street',
        city: 'Denver',
        state: 'CO',
        zipCode: '80201',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
    ];

    // HR Staff
    const hrStaff = [
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
        name: 'Lisa Anderson',
        email: 'lisa.anderson@example.com',
        password: hashedPassword,
        role: 'hr',
        department: 'Human Resources',
        designation: 'HR Specialist',
        phone: '+1234567898',
        dob: new Date('1992-06-15'),
        gender: 'Female',
        address: '890 HR Plaza',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        password: hashedPassword,
        role: 'hr',
        department: 'Human Resources',
        designation: 'HR Coordinator',
        phone: '+1234567899',
        dob: new Date('1991-02-28'),
        gender: 'Male',
        address: '123 Talent Ave',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
    ];

    // Employees
    const employees = [
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
        name: 'Jennifer Martinez',
        email: 'jennifer.martinez@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Engineering',
        designation: 'Frontend Developer',
        phone: '+1234567900',
        dob: new Date('1996-08-22'),
        gender: 'Female',
        address: '456 Dev Lane',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        leaveBalance: {
          casualLeave: 10,
          sickLeave: 8,
          earnedLeave: 18,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Alex Kumar',
        email: 'alex.kumar@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Engineering',
        designation: 'Backend Developer',
        phone: '+1234567901',
        dob: new Date('1994-03-10'),
        gender: 'Male',
        address: '789 Server St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02102',
        leaveBalance: {
          casualLeave: 11,
          sickLeave: 9,
          earnedLeave: 19,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Sophie Johnson',
        email: 'sophie.johnson@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Sales',
        designation: 'Sales Representative',
        phone: '+1234567902',
        dob: new Date('1997-01-18'),
        gender: 'Female',
        address: '321 Sales Drive',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90002',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Ryan O\'Connor',
        email: 'ryan.oconnor@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Sales',
        designation: 'Account Executive',
        phone: '+1234567903',
        dob: new Date('1993-07-05'),
        gender: 'Male',
        address: '654 Client Road',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90003',
        leaveBalance: {
          casualLeave: 10,
          sickLeave: 8,
          earnedLeave: 18,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Marketing',
        designation: 'Marketing Specialist',
        phone: '+1234567904',
        dob: new Date('1995-11-12'),
        gender: 'Female',
        address: '987 Brand Avenue',
        city: 'Austin',
        state: 'TX',
        zipCode: '78702',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Kevin Lee',
        email: 'kevin.lee@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Engineering',
        designation: 'DevOps Engineer',
        phone: '+1234567905',
        dob: new Date('1992-04-20'),
        gender: 'Male',
        address: '147 Cloud Street',
        city: 'Denver',
        state: 'CO',
        zipCode: '80202',
        leaveBalance: {
          casualLeave: 11,
          sickLeave: 9,
          earnedLeave: 19,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Rachel Kim',
        email: 'rachel.kim@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Engineering',
        designation: 'QA Engineer',
        phone: '+1234567906',
        dob: new Date('1996-09-08'),
        gender: 'Female',
        address: '258 Test Boulevard',
        city: 'Boston',
        state: 'MA',
        zipCode: '02103',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Daniel White',
        email: 'daniel.white@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Sales',
        designation: 'Business Development',
        phone: '+1234567907',
        dob: new Date('1994-12-14'),
        gender: 'Male',
        address: '369 Growth Way',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90004',
        leaveBalance: {
          casualLeave: 10,
          sickLeave: 8,
          earnedLeave: 18,
          maternityLeave: 180,
        },
        isActive: true,
      },
      {
        name: 'Olivia Taylor',
        email: 'olivia.taylor@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Marketing',
        designation: 'Content Writer',
        phone: '+1234567908',
        dob: new Date('1998-06-30'),
        gender: 'Female',
        address: '741 Content Court',
        city: 'Austin',
        state: 'TX',
        zipCode: '78703',
        leaveBalance: {
          casualLeave: 12,
          sickLeave: 10,
          earnedLeave: 20,
          maternityLeave: 180,
        },
        isActive: true,
      },
    ];

    // Combine all users
    const demoUsers = [...directors, ...managers, ...hrStaff, ...employees];

    // Insert users
    const createdUsers = await User.insertMany(demoUsers);
    console.log(`✅ Created ${createdUsers.length} demo users`);

    // Find managers by email to link employees
    const sarahManager = createdUsers.find(u => u.email === 'manager@example.com');
    const davidManager = createdUsers.find(u => u.email === 'david.thompson@example.com');
    const emilyManager = createdUsers.find(u => u.email === 'emily.rodriguez@example.com');
    const jamesManager = createdUsers.find(u => u.email === 'james.wilson@example.com');

    // Link employees to managers
    await User.findOneAndUpdate(
      { email: 'employee@example.com' },
      { managerId: sarahManager._id }
    );
    await User.findOneAndUpdate(
      { email: 'jennifer.martinez@example.com' },
      { managerId: sarahManager._id }
    );
    await User.findOneAndUpdate(
      { email: 'alex.kumar@example.com' },
      { managerId: sarahManager._id }
    );
    await User.findOneAndUpdate(
      { email: 'kevin.lee@example.com' },
      { managerId: jamesManager._id }
    );
    await User.findOneAndUpdate(
      { email: 'rachel.kim@example.com' },
      { managerId: jamesManager._id }
    );
    await User.findOneAndUpdate(
      { email: 'sophie.johnson@example.com' },
      { managerId: davidManager._id }
    );
    await User.findOneAndUpdate(
      { email: 'ryan.oconnor@example.com' },
      { managerId: davidManager._id }
    );
    await User.findOneAndUpdate(
      { email: 'daniel.white@example.com' },
      { managerId: davidManager._id }
    );
    await User.findOneAndUpdate(
      { email: 'maria.garcia@example.com' },
      { managerId: emilyManager._id }
    );
    await User.findOneAndUpdate(
      { email: 'olivia.taylor@example.com' },
      { managerId: emilyManager._id }
    );
    console.log('✅ Linked employees to managers');

    console.log('\n📋 Demo Accounts Created:');
    console.log('\n👑 Directors:');
    console.log('  - director@example.com / password123');
    console.log('  - robert.chen@example.com / password123');
    console.log('\n👔 Managers:');
    console.log('  - manager@example.com / password123');
    console.log('  - david.thompson@example.com / password123');
    console.log('  - emily.rodriguez@example.com / password123');
    console.log('  - james.wilson@example.com / password123');
    console.log('\n📊 HR Staff:');
    console.log('  - hr@example.com / password123');
    console.log('  - lisa.anderson@example.com / password123');
    console.log('  - michael.brown@example.com / password123');
    console.log('\n👨‍💼 Employees:');
    console.log('  - employee@example.com / password123');
    console.log('  - jennifer.martinez@example.com / password123');
    console.log('  - alex.kumar@example.com / password123');
    console.log('  - sophie.johnson@example.com / password123');
    console.log('  - ryan.oconnor@example.com / password123');
    console.log('  - maria.garcia@example.com / password123');
    console.log('  - kevin.lee@example.com / password123');
    console.log('  - rachel.kim@example.com / password123');
    console.log('  - daniel.white@example.com / password123');
    console.log('  - olivia.taylor@example.com / password123');
    console.log('\n📊 Summary:');
    console.log(`  - ${directors.length} Directors`);
    console.log(`  - ${managers.length} Managers`);
    console.log(`  - ${hrStaff.length} HR Staff`);
    console.log(`  - ${employees.length} Employees`);
    console.log(`  - Total: ${createdUsers.length} Users`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

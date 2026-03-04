/**
 * Database Migration Script for Timesheet Module
 * ================================================
 * 
 * This script sets up the Timesheet collections and indexes in MongoDB.
 * Since MongoDB is schema-less, the models define the schema, but we need
 * to ensure proper indexes are created for performance.
 * 
 * Run this script once to set up the timesheet indexes:
 * node backend/migrations/timesheet_migration.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workify', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for Migration');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Create indexes for Timesheet collection
const createTimesheetIndexes = async () => {
  const db = mongoose.connection.db;
  
  console.log('\n📊 Creating Timesheet collection indexes...');
  
  const timesheetCollection = db.collection('timesheets');
  
  // Create indexes
  const indexes = [
    // Index for querying by employee and date
    { key: { employeeId: 1, date: 1 }, name: 'employeeId_date_idx' },
    
    // Index for status filtering
    { key: { status: 1 }, name: 'status_idx' },
    
    // Compound index for employee + status queries
    { key: { employeeId: 1, status: 1 }, name: 'employeeId_status_idx' },
    
    // Index for date range queries
    { key: { date: -1 }, name: 'date_desc_idx' },
    
    // Index for project-based queries
    { key: { projectName: 1 }, name: 'projectName_idx' },
    
    // Compound index for reports
    { key: { employeeId: 1, date: 1, status: 1 }, name: 'employee_date_status_idx' },
  ];
  
  for (const index of indexes) {
    try {
      await timesheetCollection.createIndex(index.key, { name: index.name });
      console.log(`  ✅ Created index: ${index.name}`);
    } catch (error) {
      if (error.code === 85) {
        console.log(`  ⚠️ Index ${index.name} already exists`);
      } else {
        console.error(`  ❌ Error creating index ${index.name}:`, error.message);
      }
    }
  }
};

// Create indexes for TimesheetApproval collection
const createApprovalIndexes = async () => {
  const db = mongoose.connection.db;
  
  console.log('\n📊 Creating TimesheetApproval collection indexes...');
  
  const approvalCollection = db.collection('timesheetapprovals');
  
  const indexes = [
    // Index for querying by timesheet
    { key: { timesheetId: 1 }, name: 'timesheetId_idx' },
    
    // Index for querying by manager
    { key: { managerId: 1 }, name: 'managerId_idx' },
    
    // Index for action date sorting
    { key: { actionDate: -1 }, name: 'actionDate_desc_idx' },
  ];
  
  for (const index of indexes) {
    try {
      await approvalCollection.createIndex(index.key, { name: index.name });
      console.log(`  ✅ Created index: ${index.name}`);
    } catch (error) {
      if (error.code === 85) {
        console.log(`  ⚠️ Index ${index.name} already exists`);
      } else {
        console.error(`  ❌ Error creating index ${index.name}:`, error.message);
      }
    }
  }
};

// Main migration function
const runMigration = async () => {
  console.log('🚀 Starting Timesheet Module Migration...\n');
  console.log('=' .repeat(50));
  
  await connectDB();
  
  try {
    await createTimesheetIndexes();
    await createApprovalIndexes();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration completed successfully!');
    console.log('\nTimesheet module is ready to use.');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
};

// Run the migration
runMigration();

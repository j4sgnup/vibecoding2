
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from './seed';
import { seedAuditLogs } from './seedAuditLogs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/acm-poc-01';

const runAllSeeds = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for master seeder.');

    // Run seeds in the correct order
    await seedDatabase();
    await seedAuditLogs();

    console.log('All seeding processes completed successfully!');

  } catch (error) {
    console.error('Master seeder failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

runAllSeeds();

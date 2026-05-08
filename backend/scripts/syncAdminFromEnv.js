/**
 * One-off: set admin password from ADMIN_EMAIL / ADMIN_PASSWORD in .env
 * Run: node scripts/syncAdminFromEnv.js (from backend directory)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  const uri = process.env.MONGODB_URI;
  const email = (process.env.ADMIN_EMAIL || 'avnish@ihubiitmandi.in').trim();
  const password = (process.env.ADMIN_PASSWORD || '').trim();

  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  if (!password) {
    console.error('ADMIN_PASSWORD is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    await User.create({
      email,
      name: 'System Administrator',
      password,
      role: 'admin',
      department: 'IT',
      isactive: true
    });
    console.log('Created admin user:', email);
  } else {
    user.password = password;
    await user.save();
    console.log('Updated password for:', email);
  }
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

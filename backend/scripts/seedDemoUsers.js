/**
 * Upsert stock-manager + employee demo users (no full DB wipe).
 * Run from backend: node scripts/seedDemoUsers.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const DEMO_USERS = [
  {
    email: 'printi@ihubiitmandi.in',
    name: 'Stock Manager',
    password: 'printi@',
    role: 'stock-manager',
    department: 'Operations'
  },
  {
    email: 'rohit@ihubiitmandi.in',
    name: 'Rohit Kumar',
    password: 'rohit@123',
    role: 'employee',
    department: 'IT Department'
  }
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(uri);

  for (const u of DEMO_USERS) {
    const email = u.email.toLowerCase();
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      await User.create({ ...u, email, isactive: true });
      console.log('Created:', email, `(${u.role})`);
    } else {
      user.name = u.name;
      user.password = u.password;
      user.role = u.role;
      user.department = u.department;
      user.isactive = true;
      await user.save();
      console.log('Updated:', email, `(${u.role})`);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

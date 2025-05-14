const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

const adminUser = {
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin'
};

const seedAdminUser = async () => {
  try {
    
    await User.deleteMany({ role: 'admin' });
    
    // Create new admin user
    await User.create(adminUser);
    
    console.log('Admin user seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdminUser(); 
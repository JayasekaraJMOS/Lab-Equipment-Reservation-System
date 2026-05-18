const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_reserve_db';

  await mongoose.connect(uri);
  console.log(`[MongoDB] Connected to ${mongoose.connection.name}`);
}

module.exports = connectDatabase;

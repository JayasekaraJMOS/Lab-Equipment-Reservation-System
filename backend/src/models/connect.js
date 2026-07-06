const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const localStore = require('./localStore');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_reserve_db';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log(`[MongoDB] Successfully connected to ${mongoose.connection.name || 'database'}`);
    return { isLocalStore: false };
  } catch (err) {
    console.log('-------------------------------------------------------');
    console.log('[Database] MongoDB connection at ' + uri + ' not available: ' + err.message);
    console.log('[Database] Automatically activating persistent local storage engine.');
    console.log('[Database] All accounts, authentication, and full CRUD operations are active.');
    console.log('-------------------------------------------------------');
    localStore.enable();
    return { isLocalStore: true };
  }
}

module.exports = connectDatabase;

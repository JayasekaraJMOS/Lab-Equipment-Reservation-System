const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const connectDatabase = require('./models/connect');
const User = require('./models/User');
const seedDatabase = require('./models/seed');
const { getJwtSecret } = require('./middleware/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'EE4207 Lab Equipment Reservation System API',
    database: 'MongoDB',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', apiRoutes);

const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack || err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

async function startServer() {
  getJwtSecret();
  const dbStatus = await connectDatabase();
  if (!dbStatus?.isLocalStore && !await User.exists({})) {
    console.log('[Server] MongoDB is empty. Seeding initial data...');
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log('=======================================================');
    console.log(` LabReserve API Server Running on http://localhost:${PORT}`);
    console.log(' EE4207 Web Application Development Backend (MERN)');
    console.log('=======================================================');
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('[Server Startup Error]', error);
    process.exit(1);
  });
}

module.exports = { app, startServer };

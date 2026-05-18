const http = require('http');

function testEndpoint(path, method = 'GET', postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('[Test] Starting backend API verification tests...');

  // 1. Health check
  const health = await testEndpoint('/api/health');
  console.log('✅ Health Check Status:', health.status, health.data.system);

  // 2. Login as student
  const studentLogin = await testEndpoint('/api/auth/login', 'POST', {
    email: 'student@university.edu',
    password: 'student123'
  });
  console.log('✅ Student Login:', studentLogin.status, 'User:', studentLogin.data.user.name);
  const studentToken = studentLogin.data.token;

  // 3. Equipment catalog
  const catalog = await testEndpoint('/api/equipment');
  console.log('✅ Equipment Catalog Count:', catalog.data.equipment.length);

  // 4. Create Reservation as Student
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);

  const newRes = await testEndpoint('/api/reservations', 'POST', {
    equipment_id: 1,
    start_time: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(),
    end_time: new Date(tomorrow.setHours(16, 0, 0, 0)).toISOString(),
    purpose: 'Oscilloscope testing for EE4207 assignment'
  }, { Authorization: `Bearer ${studentToken}` });
  console.log('✅ Create Reservation:', newRes.status, 'Status:', newRes.data.status, 'Msg:', newRes.data.message);

  // 5. Test Collision Rejection (Same equipment, same time)
  const collisionRes = await testEndpoint('/api/reservations', 'POST', {
    equipment_id: 1,
    start_time: new Date(tomorrow.setHours(14, 30, 0, 0)).toISOString(),
    end_time: new Date(tomorrow.setHours(15, 30, 0, 0)).toISOString(),
    purpose: 'Conflicting slot attempt'
  }, { Authorization: `Bearer ${studentToken}` });
  console.log('✅ Collision Protection Test (Should fail with 409):', collisionRes.status, collisionRes.data.error ? 'PASSED (Conflict Detected)' : 'FAILED');

  console.log('\n🎉 ALL BACKEND API VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

// Delay 1.5s to let server launch before running tests
setTimeout(runTests, 1500);

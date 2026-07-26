require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');

const PORT = 8081; // Use a different port for testing

const runTests = async () => {
  console.log('--- RUNNING AURA SYSTEM INTEGRATION TESTS ---');
  
  let server;
  try {
    // 1. Test database connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aura';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Database connected successfully.');

    // 2. Boot server
    server = http.createServer(app).listen(PORT);
    console.log(`✅ Test server booted on port ${PORT}.`);

    // 3. Test /status endpoint
    await new Promise((resolve, reject) => {
      http.get(`http://localhost:${PORT}/status`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.success) {
            console.log('✅ Status API Test Passed.');
            resolve();
          } else {
            reject(new Error(`Status check failed with status: ${res.statusCode}`));
          }
        });
      }).on('error', reject);
    });

    // 4. Test /api/tables endpoint (Public check)
    await new Promise((resolve, reject) => {
      http.get(`http://localhost:${PORT}/api/tables`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.success && Array.isArray(parsed.data)) {
            console.log(`✅ Table Status API Test Passed. Found ${parsed.data.length} tables.`);
            resolve();
          } else {
            reject(new Error(`Tables API failed with status: ${res.statusCode}`));
          }
        });
      }).on('error', reject);
    });

    // 5. Test /api/menu endpoint (Public check)
    await new Promise((resolve, reject) => {
      http.get(`http://localhost:${PORT}/api/menu`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.success && Array.isArray(parsed.data)) {
            console.log(`✅ Menu API Test Passed. Found ${parsed.data.length} menu items.`);
            resolve();
          } else {
            reject(new Error(`Menu API failed with status: ${res.statusCode}`));
          }
        });
      }).on('error', reject);
    });

    console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀 ---');
    cleanup(server, 0);
  } catch (error) {
    console.error('❌ INTEGRATION TEST FAILED:', error.message);
    cleanup(server, 1);
  }
};

const cleanup = (server, exitCode) => {
  if (server) {
    server.close();
  }
  mongoose.connection.close();
  process.exit(exitCode);
};

runTests();

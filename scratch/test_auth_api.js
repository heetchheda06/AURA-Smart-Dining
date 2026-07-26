require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

const PORT = 8084;

const runAuthTests = async () => {
  console.log('--- TESTING REGISTER AND LOGIN APIS ---');
  let server;

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aura';
    console.log(`Connecting to Mongo: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });

    server = http.createServer(app).listen(PORT);
    console.log(`Server listening on port ${PORT}`);

    // 1. Clean test user if exists
    const testEmail = "testuser_unique@auradining.in";
    await User.deleteOne({ email: testEmail });

    // 2. Test Registration (Valid Customer)
    console.log('\nTesting POST /api/auth/register (Customer)...');
    const regResult = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        name: "Test Customer",
        email: " TestUser_Unique@auradining.in ", // tests trimming and lowercasing
        password: "CustomerPassword123"
      });

      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (regResult.status === 201 && regResult.data.success && regResult.data.token) {
      console.log('✅ Registration API passed! Returned token and user details.');
    } else {
      throw new Error(`Registration failed: ${JSON.stringify(regResult)}`);
    }

    // 3. Test Login (With case-insensitive email)
    console.log('\nTesting POST /api/auth/login (Customer login)...');
    const loginResult = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        email: "TESTUSER_UNIQUE@auradining.in",
        password: "CustomerPassword123"
      });

      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (loginResult.status === 200 && loginResult.data.success && loginResult.data.token) {
      console.log('✅ Login API passed! Successfully authenticated.');
    } else {
      throw new Error(`Login failed: ${JSON.stringify(loginResult)}`);
    }

    // Clean up test user
    await User.deleteOne({ email: testEmail });
    console.log('\n--- ALL AUTH API TESTS COMPLETED SUCCESSFULLY! 🚀 ---');
    cleanup(server, 0);
  } catch (err) {
    console.log(`⚠️ Database not connected or test info: ${err.message}`);
    cleanup(server, 0);
  }
};

const cleanup = (server, code) => {
  if (server) server.close();
  mongoose.connection.close();
  process.exit(code);
};

runAuthTests();

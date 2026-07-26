require('dotenv').config();
const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');

const PORT = 8083; // Test port for RBAC system

const runRBACTests = async () => {
  console.log('--- RUNNING AURA ENTERPRISE RBAC TESTS ---');
  let server;

  try {
    server = http.createServer(app).listen(PORT);
    console.log(`1. Booted test server on port ${PORT}...`);

    // 2. Test self-registration restriction for Manager role
    console.log('\n2. Testing registration restriction for staff roles...');
    await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        name: "Unauthorized Staff",
        email: "fake_manager@auradining.in",
        password: "Pass123!456",
        role: "manager"
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
        res.on('end', () => {
          const parsed = JSON.parse(data);
          if (res.statusCode === 403 && parsed.message.includes('administrator')) {
            console.log('✅ Staff self-registration blocked correctly (403 Access Restricted).');
            resolve();
          } else {
            reject(new Error(`Role restriction failed. Code: ${res.statusCode}, Message: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    // 3. Test Portal HTML Route Access
    console.log('\n3. Testing Portal HTML Routes...');
    const routesToTest = ['/customer', '/manager', '/chef', '/cashier', '/403'];

    for (const route of routesToTest) {
      await new Promise((resolve, reject) => {
        http.get(`http://localhost:${PORT}${route}`, (res) => {
          if (res.statusCode === 200) {
            console.log(`✅ GET ${route} returned HTTP 200 OK.`);
            resolve();
          } else {
            reject(new Error(`GET ${route} failed with status: ${res.statusCode}`));
          }
        }).on('error', reject);
      });
    }

    console.log('\n--- ALL ENTERPRISE RBAC TESTS PASSED SUCCESSFULLY! 🚀 ---');
    if (server) server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ RBAC SYSTEM TEST FAILED:', err.message);
    if (server) server.close();
    process.exit(1);
  }
};

runRBACTests();

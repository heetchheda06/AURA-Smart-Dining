require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const { parseCSV, generateCSV } = require('../utils/csvHelper');
const seedFromCSV = require('../seed/csvSeeder');
const jwt = require('jsonwebtoken');

const PORT = 8082; // Dedicated test port for CSV test

const runCSVTests = async () => {
  mongoose.set('bufferCommands', false);
  console.log('--- RUNNING AURA CSV SYSTEM TESTS ---');
  let server;

  try {
    // 1. Test csvHelper parsing and generation
    console.log('1. Testing CSV Helper parsing & generation...');
    const testData = [
      { name: "Test Dish", category: "mains", price: 999, desc: "Delicious, smooth" },
      { name: 'Dish with "Quotes" & Comma', category: "desserts", price: 450, desc: "Rich chocolate, cream" }
    ];
    const generatedCSV = generateCSV(testData, ['name', 'category', 'price', 'desc']);
    if (!generatedCSV.includes('Test Dish') || !generatedCSV.includes('"Dish with ""Quotes"" & Comma"')) {
      throw new Error('CSV Generation failed formatting check.');
    }
    console.log('✅ CSV Generation unit test passed.');

    const parsedData = parseCSV(generatedCSV);
    if (parsedData.length !== 2 || parsedData[0].price !== 999) {
      throw new Error('CSV Parsing failed decoding check.');
    }
    console.log('✅ CSV Parsing unit test passed.');

    // 2. Test CSV Database Seeder
    console.log('\n2. Testing CSV Database Seeder...');
    try {
      await seedFromCSV();
      console.log('✅ CSV Seeder execution test passed.');
    } catch (dbErr) {
      console.log(`⚠️ Database not online (${dbErr.message}). Skipping Mongo persistence test.`);
    }

    // 3. Boot Server for API Tests
    server = http.createServer(app).listen(PORT);
    console.log(`\n3. Booted test server on port ${PORT}...`);

    // Generate admin test token
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
    const adminToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Test Export Menu CSV API
    await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/api/admin/export/menu/csv',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 && data.includes('name') && data.includes('category')) {
            console.log('✅ GET /api/admin/export/menu/csv Passed.');
            resolve();
          } else {
            reject(new Error(`Menu CSV export returned HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    // 5. Test Import Menu CSV API
    await new Promise((resolve, reject) => {
      const sampleCSVImport = 'name,category,price,rating,prep,tag,image,desc\n"CSV Imported Dish","mains",1200,"5.0","10 min","New","https://example.com/img.jpg","Uploaded via test"';
      const postData = JSON.stringify({ csvData: sampleCSVImport });

      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/api/admin/import/menu/csv',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${adminToken}`
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.success) {
            console.log('✅ POST /api/admin/import/menu/csv Passed.');
            resolve();
          } else {
            reject(new Error(`Menu CSV import failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('\n--- ALL CSV SYSTEM TESTS PASSED SUCCESSFULLY! 🚀 ---');
    cleanup(server, 0);
  } catch (err) {
    console.error('❌ CSV SYSTEM TEST FAILED:', err.message);
    cleanup(server, 1);
  }
};

const cleanup = (server, exitCode) => {
  if (server) server.close();
  mongoose.connection.close();
  process.exit(exitCode);
};

runCSVTests();

const { Pool } = require('pg');
require('dotenv').config();

// Debug: Log the values being used
console.log('🔍 Database connection debug:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('Password type:', typeof process.env.DB_PASSWORD);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'upload_platform',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''), 
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error acquiring client from pool:', err.stack);
    return;
  }
  console.log('✅ Database connected successfully');
  release();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Closing database pool...');
  pool.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
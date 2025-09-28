const bcrypt = require('bcryptjs');
const db = require('../config/database');

const seedUsers = async () => {
  try {
    console.log('🌱 Seeding test users...');

    // Check if users already exist
    const existingUsers = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('👥 Users already exist, skipping seed');
      return;
    }

    // Hash passwords (10 rounds is good for development)
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const clientPasswordHash = await bcrypt.hash('client123', 10);

    // Insert test users
    const insertUsersQuery = `
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Admin User', 'admin@test.com', $1, 'admin'),
      ('John Doe', 'john@test.com', $2, 'client'),
      ('Jane Smith', 'jane@test.com', $3, 'client')
      RETURNING user_id, name, email, role
    `;

    const result = await db.query(insertUsersQuery, [
      adminPasswordHash,
      clientPasswordHash,
      clientPasswordHash
    ]);

    console.log('✅ Test users created:');
    result.rows.forEach(user => {
      const password = user.role === 'admin' ? 'admin123' : 'client123';
      console.log(`   ${user.role.toUpperCase()}: ${user.email} / ${password}`);
    });

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};

module.exports = seedUsers;
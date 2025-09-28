const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        user_id, 
        name, 
        email, 
        role, 
        created_at,
        -- Count files uploaded by this user
        (SELECT COUNT(*) FROM files WHERE uploader_id = users.user_id) as uploaded_files,
        -- Count files owned by this user (including received files)
        (SELECT COUNT(*) FROM files WHERE owner_id = users.user_id) as total_files
      FROM users 
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);

    res.json({
      users: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
});

// POST /api/users - Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!role || !['admin', 'client'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either admin or client' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, name, email, role, created_at
    `;

    const values = [name.trim(), email.toLowerCase().trim(), passwordHash, role];
    const result = await db.query(insertQuery, values);

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, role } = req.body;

    // Validate input
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    if (!['admin', 'client'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either admin or client' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    const emailCheck = await db.query('SELECT user_id FROM users WHERE email = $1 AND user_id != $2', [email.toLowerCase(), userId]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already taken by another user' });
    }

    // Update user
    const updateQuery = `
      UPDATE users 
      SET name = $1, email = $2, role = $3
      WHERE user_id = $4
      RETURNING user_id, name, email, role, created_at
    `;

    const result = await db.query(updateQuery, [name.trim(), email.toLowerCase().trim(), role, userId]);
    const updatedUser = result.rows[0];

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// POST /api/users/:id/reset-password - Reset user password (admin only)
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT user_id, name, email FROM users WHERE user_id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [passwordHash, userId]);

    res.json({
      message: 'Password reset successfully',
      user: userCheck.rows[0]
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent admin from deleting themselves
    if (userId === req.user.user_id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT user_id, name, email FROM users WHERE user_id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userToDelete = userCheck.rows[0];

    // Delete user (CASCADE will handle related files and notifications)
    await db.query('DELETE FROM users WHERE user_id = $1', [userId]);

    res.json({
      message: 'User deleted successfully',
      deleted_user: userToDelete
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// GET /api/users/stats - Get user statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'client' THEN 1 END) as client_count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month
      FROM users
    `;

    const result = await db.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      stats: {
        total_users: parseInt(stats.total_users),
        admin_count: parseInt(stats.admin_count),
        client_count: parseInt(stats.client_count),
        new_this_month: parseInt(stats.new_this_month)
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to get user statistics' });
  }
});

module.exports = router;
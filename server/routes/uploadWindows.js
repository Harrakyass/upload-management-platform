const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/upload-windows - Get all upload windows (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        uw.window_id,
        uw.client_id,
        u.name as client_name,
        u.email as client_email,
        uw.start_time,
        uw.end_time,
        uw.is_active,
        uw.created_at,
        uw.updated_at,
        uw.extended_by,
        ext_admin.name as extended_by_name,
        uw.extension_reason,
        CASE 
          WHEN NOT uw.is_active THEN 'inactive'
          WHEN NOW() < uw.start_time THEN 'upcoming'
          WHEN NOW() > uw.end_time THEN 'expired'
          ELSE 'active'
        END as status,
        -- Count files uploaded during this window
        (SELECT COUNT(*) FROM files f 
         WHERE f.owner_id = uw.client_id 
         AND f.uploader_id = f.owner_id
         AND f.uploaded_at BETWEEN uw.start_time AND uw.end_time) as files_uploaded
      FROM upload_windows uw
      JOIN users u ON uw.client_id = u.user_id
      LEFT JOIN users ext_admin ON uw.extended_by = ext_admin.user_id
      ORDER BY uw.created_at DESC
    `;

    const result = await db.query(query);

    res.json({
      windows: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get upload windows error:', error);
    res.status(500).json({ message: 'Failed to retrieve upload windows' });
  }
});

// GET /api/upload-windows/client/:clientId - Get upload windows for specific client
router.get('/client/:clientId', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);

    // Clients can only see their own windows, admins can see any
    if (req.user.role === 'client' && req.user.user_id !== clientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `
      SELECT 
        window_id,
        start_time,
        end_time,
        is_active,
        created_at,
        CASE 
          WHEN NOT is_active THEN 'inactive'
          WHEN NOW() < start_time THEN 'upcoming'
          WHEN NOW() > end_time THEN 'expired'
          ELSE 'active'
        END as status,
        (NOW() BETWEEN start_time AND end_time AND is_active) as can_upload
      FROM upload_windows 
      WHERE client_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [clientId]);

    res.json({
      windows: result.rows,
      current_window: result.rows.find(w => w.can_upload) || null
    });

  } catch (error) {
    console.error('Get client upload windows error:', error);
    res.status(500).json({ message: 'Failed to retrieve client upload windows' });
  }
});

// POST /api/upload-windows - Create new upload window (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { client_id, start_time, end_time } = req.body;

    // Validate input
    if (!client_id || !start_time || !end_time) {
      return res.status(400).json({ message: 'Client ID, start time, and end time are required' });
    }

    // Validate dates
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    
    if (startDate >= endDate) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check if client exists
    const clientCheck = await db.query('SELECT user_id, name FROM users WHERE user_id = $1 AND role = $2', [client_id, 'client']);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Deactivate any existing active window for this client
    await db.query('UPDATE upload_windows SET is_active = FALSE WHERE client_id = $1 AND is_active = TRUE', [client_id]);

    // Create new window
    const insertQuery = `
      INSERT INTO upload_windows (client_id, start_time, end_time, is_active)
      VALUES ($1, $2, $3, TRUE)
      RETURNING window_id, client_id, start_time, end_time, is_active, created_at
    `;

    const result = await db.query(insertQuery, [client_id, start_time, end_time]);
    const newWindow = result.rows[0];

    // Create notification for client
    const notificationQuery = `
      INSERT INTO notifications (user_id, message)
      VALUES ($1, $2)
    `;
    await db.query(notificationQuery, [
      client_id,
      `New upload window created: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
    ]);

    res.status(201).json({
      message: 'Upload window created successfully',
      window: newWindow,
      client: clientCheck.rows[0]
    });

  } catch (error) {
    console.error('Create upload window error:', error);
    res.status(500).json({ message: 'Failed to create upload window' });
  }
});

// PUT /api/upload-windows/:id/extend - Extend upload window deadline (admin only)
router.put('/:id/extend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const windowId = parseInt(req.params.id);
    const { new_end_time, extension_reason } = req.body;

    if (!new_end_time) {
      return res.status(400).json({ message: 'New end time is required' });
    }

    // Validate new end time
    const newEndDate = new Date(new_end_time);
    if (newEndDate <= new Date()) {
      return res.status(400).json({ message: 'New end time must be in the future' });
    }

    // Get current window
    const windowQuery = `
      SELECT uw.*, u.name as client_name 
      FROM upload_windows uw
      JOIN users u ON uw.client_id = u.user_id
      WHERE uw.window_id = $1
    `;
    const windowResult = await db.query(windowQuery, [windowId]);

    if (windowResult.rows.length === 0) {
      return res.status(404).json({ message: 'Upload window not found' });
    }

    const window = windowResult.rows[0];

    // Update window
    const updateQuery = `
      UPDATE upload_windows 
      SET end_time = $1, extended_by = $2, extension_reason = $3, updated_at = NOW()
      WHERE window_id = $4
      RETURNING *
    `;

    const result = await db.query(updateQuery, [new_end_time, req.user.user_id, extension_reason, windowId]);

    // Create notification for client
    const notificationQuery = `
      INSERT INTO notifications (user_id, message)
      VALUES ($1, $2)
    `;
    await db.query(notificationQuery, [
      window.client_id,
      `Upload deadline extended to ${newEndDate.toLocaleDateString()}${extension_reason ? `: ${extension_reason}` : ''}`
    ]);

    res.json({
      message: 'Upload window extended successfully',
      window: result.rows[0],
      client_name: window.client_name
    });

  } catch (error) {
    console.error('Extend upload window error:', error);
    res.status(500).json({ message: 'Failed to extend upload window' });
  }
});

// PUT /api/upload-windows/:id/deactivate - Deactivate upload window (admin only)
router.put('/:id/deactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const windowId = parseInt(req.params.id);

    const updateQuery = `
      UPDATE upload_windows 
      SET is_active = FALSE, updated_at = NOW()
      WHERE window_id = $1
      RETURNING *
    `;

    const result = await db.query(updateQuery, [windowId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Upload window not found' });
    }

    res.json({
      message: 'Upload window deactivated successfully',
      window: result.rows[0]
    });

  } catch (error) {
    console.error('Deactivate upload window error:', error);
    res.status(500).json({ message: 'Failed to deactivate upload window' });
  }
});

// GET /api/upload-windows/stats - Get upload window statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_windows,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_windows,
        COUNT(CASE WHEN is_active = TRUE AND NOW() BETWEEN start_time AND end_time THEN 1 END) as current_active,
        COUNT(CASE WHEN is_active = TRUE AND NOW() < start_time THEN 1 END) as upcoming_windows,
        COUNT(CASE WHEN is_active = TRUE AND NOW() > end_time THEN 1 END) as expired_windows,
        COUNT(CASE WHEN extended_by IS NOT NULL THEN 1 END) as extended_windows
      FROM upload_windows
    `;

    const result = await db.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      stats: {
        total_windows: parseInt(stats.total_windows),
        active_windows: parseInt(stats.active_windows),
        current_active: parseInt(stats.current_active),
        upcoming_windows: parseInt(stats.upcoming_windows),
        expired_windows: parseInt(stats.expired_windows),
        extended_windows: parseInt(stats.extended_windows)
      }
    });

  } catch (error) {
    console.error('Get upload window stats error:', error);
    res.status(500).json({ message: 'Failed to get upload window statistics' });
  }
});

module.exports = router;
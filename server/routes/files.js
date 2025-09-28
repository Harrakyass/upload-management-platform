const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp_originalname
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  // Allowed file types: PDF, Excel, Images, Word
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: PDF, Excel, Images, Word`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB default
  }
});

// POST /api/files/upload - Client uploads files 
router.post('/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    // Only clients can upload files to their own account
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can upload files' });
    }

    // Check if client has an active upload window
    const windowCheck = await db.query(`
      SELECT window_id, start_time, end_time 
      FROM upload_windows 
      WHERE client_id = $1 
      AND is_active = TRUE 
      AND NOW() BETWEEN start_time AND end_time
    `, [req.user.user_id]);

    if (windowCheck.rows.length === 0) {
      // Clean up uploaded files since upload is not allowed
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      return res.status(403).json({ 
        message: 'Upload not allowed: No active upload window or window has expired',
        code: 'UPLOAD_WINDOW_CLOSED'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    const uploadedFiles = [];
    const uploadWindow = windowCheck.rows[0];

    // Process each uploaded file
    for (const file of req.files) {
      const insertQuery = `
        INSERT INTO files (uploader_id, owner_id, file_name, file_path, file_size)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING file_id, file_name, file_size, uploaded_at
      `;

      const values = [
        req.user.user_id,
        req.user.user_id,
        file.originalname,
        file.path,
        file.size
      ];

      const result = await db.query(insertQuery, values);
      uploadedFiles.push(result.rows[0]);
    }

    // Create notification for admin
    const adminNotificationQuery = `
      INSERT INTO notifications (user_id, message)
      SELECT user_id, $1 
      FROM users 
      WHERE role = 'admin'
    `;
    await db.query(adminNotificationQuery, [
      `${req.user.name} uploaded ${uploadedFiles.length} file(s)`
    ]);

    res.json({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
      upload_window: {
        window_id: uploadWindow.window_id,
        deadline: uploadWindow.end_time
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ 
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/files/upload-to-client - Admin uploads files to a specific client
router.post('/upload-to-client/:clientId', authenticateToken, requireAdmin, upload.array('files', 10), async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);

    // Verify client exists
    const clientCheck = await db.query('SELECT user_id, name FROM users WHERE user_id = $1 AND role = $2', [clientId, 'client']);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    const uploadedFiles = [];

    // Process each uploaded file
    for (const file of req.files) {
      const insertQuery = `
        INSERT INTO files (uploader_id, owner_id, file_name, file_path, file_size)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING file_id, file_name, file_size, uploaded_at
      `;

      const values = [
        req.user.user_id,    // uploader_id (admin who uploaded)
        clientId,            // owner_id (client who receives the file)
        file.originalname,
        file.path,
        file.size
      ];

      const result = await db.query(insertQuery, values);
      uploadedFiles.push(result.rows[0]);
    }

    // TODO: Create notification for client
    const notificationQuery = `
      INSERT INTO notifications (user_id, message)
      VALUES ($1, $2)
    `;
    await db.query(notificationQuery, [
      clientId,
      `Admin uploaded ${uploadedFiles.length} new file(s) for you`
    ]);

    res.json({
      message: `Successfully uploaded ${uploadedFiles.length} file(s) to ${clientCheck.rows[0].name}`,
      files: uploadedFiles,
      client: clientCheck.rows[0]
    });

  } catch (error) {
    console.error('Admin file upload error:', error);
    
    // Clean up uploaded files if database insertion failed
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ 
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/files/my-uploads - Get files uploaded by current user
router.get('/my-uploads', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT f.file_id, f.file_name, f.file_size, f.uploaded_at,
             u.name as owner_name
      FROM files f
      JOIN users u ON f.owner_id = u.user_id
      WHERE f.uploader_id = $1
      ORDER BY f.uploaded_at DESC
    `;

    const result = await db.query(query, [req.user.user_id]);

    res.json({
      files: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({ message: 'Failed to retrieve uploads' });
  }
});

// GET /api/files/my-files - Get files owned by current user (including received files)
router.get('/my-files', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT f.file_id, f.file_name, f.file_size, f.uploaded_at,
             u.name as uploader_name,
             (f.uploader_id = f.owner_id) as is_own_upload
      FROM files f
      JOIN users u ON f.uploader_id = u.user_id
      WHERE f.owner_id = $1
      ORDER BY f.uploaded_at DESC
    `;

    const result = await db.query(query, [req.user.user_id]);

    res.json({
      files: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Failed to retrieve files' });
  }
});

// GET /api/files/download/:fileId - Download a file
router.get('/download/:fileId', authenticateToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);

    // Get file info from database
    const fileQuery = `
      SELECT f.*, u.name as uploader_name
      FROM files f
      JOIN users u ON f.uploader_id = u.user_id
      WHERE f.file_id = $1
    `;

    const fileResult = await db.query(fileQuery, [fileId]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = fileResult.rows[0];

    // Check permissions: user can only download files they own, or admin can download any file
    if (req.user.role !== 'admin' && file.owner_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

// GET /api/files/all-client-uploads - Admin gets ALL files uploaded by clients
router.get('/all-client-uploads', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT f.file_id, f.file_name, f.file_size, f.uploaded_at,
             u.user_id, u.name as client_name, u.email as client_email,
             (f.uploader_id = f.owner_id) as is_client_upload
      FROM files f
      JOIN users u ON f.owner_id = u.user_id
      WHERE u.role = 'client' AND f.uploader_id = f.owner_id
      ORDER BY f.uploaded_at DESC
    `;

    const result = await db.query(query);

    // Group files by client
    const filesByClient = result.rows.reduce((acc, file) => {
      const clientId = file.user_id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client_id: clientId,
          client_name: file.client_name,
          client_email: file.client_email,
          files: []
        };
      }
      acc[clientId].files.push(file);
      return acc;
    }, {});

    res.json({
      files_by_client: Object.values(filesByClient),
      total_files: result.rows.length,
      total_clients: Object.keys(filesByClient).length
    });

  } catch (error) {
    console.error('Get all client uploads error:', error);
    res.status(500).json({ message: 'Failed to retrieve client uploads' });
  }
});

module.exports = router;
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to verify JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header (format: "Bearer TOKEN")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data from database (in case user was deleted or changed)
    const userQuery = 'SELECT user_id, name, email, role FROM users WHERE user_id = $1';
    const userResult = await db.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user info to request object for use in other routes
    req.user = userResult.rows[0];
    next(); // Continue to the next middleware/route handler

  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Middleware to check if user has client role
const requireClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ message: 'Client access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireClient
};
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'rural-education-platform-secret-key-change-in-production';

const authMiddleware = {
  generateToken: (user) => {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  },

  verifyToken: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get fresh user data
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token. User not found.' });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token.' });
      }
      return res.status(500).json({ error: 'Token verification failed.' });
    }
  },

  requireRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      
      const userRoles = Array.isArray(roles) ? roles : [roles];
      if (!userRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions.' });
      }
      
      next();
    };
  },

  requireStudent: function(req, res, next) {
    return this.requireRole('student')(req, res, next);
  },

  requireTeacher: function(req, res, next) {
    return this.requireRole('teacher')(req, res, next);
  },

  requireTeacherOrAdmin: function(req, res, next) {
    return this.requireRole(['teacher', 'admin'])(req, res, next);
  },

  optionalAuth: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      }
      
      next();
    } catch (error) {
      // Token is optional, so continue even if invalid
      next();
    }
  }
};

module.exports = authMiddleware;
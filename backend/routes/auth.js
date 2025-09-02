const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Register endpoint
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('full_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters long'),
  body('role')
    .isIn(['student', 'teacher'])
    .withMessage('Role must be either student or teacher'),
  body('grade_level')
    .optional()
    .isInt({ min: 6, max: 12 })
    .withMessage('Grade level must be between 6 and 12'),
  body('school_name')
    .optional()
    .isLength({ max: 200 })
    .withMessage('School name must be less than 200 characters'),
  body('preferred_language')
    .optional()
    .isIn(['english', 'hindi', 'regional'])
    .withMessage('Preferred language must be english, hindi, or regional')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { username, email, password, role, full_name, grade_level, school_name, preferred_language } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user
    const userData = {
      username,
      email,
      password,
      role,
      full_name,
      grade_level: role === 'student' ? grade_level : null,
      school_name,
      preferred_language: preferred_language || 'english'
    };

    const user = await User.create(userData);
    
    // Generate token
    const token = generateToken(user);
    
    // Update last login
    await User.updateLastLogin(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        grade_level: user.grade_level,
        school_name: user.school_name,
        preferred_language: user.preferred_language
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login endpoint
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Validate password
    const isValidPassword = await User.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);
    
    // Update last login
    await User.updateLastLogin(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        grade_level: user.grade_level,
        school_name: user.school_name,
        preferred_language: user.preferred_language,
        avatar_url: user.avatar_url
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// Profile endpoint (requires authentication)
router.get('/profile', require('../middleware/auth').verifyToken, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        grade_level: user.grade_level,
        school_name: user.school_name,
        preferred_language: user.preferred_language,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile endpoint
router.put('/profile', [
  require('../middleware/auth').verifyToken,
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters long'),
  body('school_name')
    .optional()
    .isLength({ max: 200 })
    .withMessage('School name must be less than 200 characters'),
  body('preferred_language')
    .optional()
    .isIn(['english', 'hindi', 'regional'])
    .withMessage('Preferred language must be english, hindi, or regional'),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { full_name, school_name, preferred_language, avatar_url } = req.body;
    const userId = req.user.id;

    await User.updateProfile(userId, {
      full_name,
      school_name,
      preferred_language,
      avatar_url
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Token validation endpoint
router.get('/validate', require('../middleware/auth').verifyToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
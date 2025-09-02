const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken, requireStudent } = require('../middleware/auth');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Achievement = require('../models/Achievement');
const { getDatabase } = require('../database/init');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get student dashboard data
router.get('/dashboard', requireStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get overall progress
    const overallProgress = await Progress.getOverallProgress(studentId);
    
    // Get recent activity
    const recentActivity = await Progress.getRecentActivity(studentId, 5);
    
    // Get user points and level
    const db = getDatabase();
    const userPoints = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_points WHERE user_id = ?', [studentId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Get recent achievements
    const achievements = await Achievement.getUserAchievements(studentId);
    const recentAchievements = achievements.slice(0, 3);
    
    // Get leaderboard position
    const leaderboard = await User.getLeaderboard(100);
    const userPosition = leaderboard.findIndex(user => user.id === studentId) + 1;
    
    res.json({
      progress: overallProgress,
      recentActivity,
      userPoints: userPoints || { total_points: 0, current_level: 1, daily_streak: 0 },
      recentAchievements,
      leaderboardPosition: userPosition || null,
      totalStudents: leaderboard.length
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get subjects and progress
router.get('/subjects', requireStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const subjects = ['physics', 'chemistry', 'math', 'biology'];
    const subjectData = [];
    
    for (const subject of subjects) {
      const progress = await Progress.getSubjectProgress(studentId, subject);
      subjectData.push({
        name: subject,
        displayName: subject.charAt(0).toUpperCase() + subject.slice(1),
        progress: progress || {
          total_topics: 0,
          avg_completion: 0,
          avg_score: 0,
          total_time_spent: 0,
          completed_topics: 0
        }
      });
    }
    
    res.json({ subjects: subjectData });
  } catch (error) {
    console.error('Subjects error:', error);
    res.status(500).json({ error: 'Failed to get subjects data' });
  }
});

// Get specific subject progress with topics
router.get('/subjects/:subject', requireStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subject } = req.params;
    
    if (!['physics', 'chemistry', 'math', 'biology'].includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject' });
    }
    
    // Get subject progress
    const subjectProgress = await Progress.getSubjectProgress(studentId, subject);
    
    // Get detailed topic progress
    const topicProgress = await Progress.getStudentProgress(studentId, subject);
    
    // Define topics for each subject
    const subjectTopics = {
      physics: [
        'Mechanics', 'Heat and Thermodynamics', 'Waves and Sound', 'Light', 
        'Electricity', 'Magnetism', 'Modern Physics', 'Nuclear Physics'
      ],
      chemistry: [
        'Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'States of Matter',
        'Chemical Reactions', 'Acids and Bases', 'Metals and Non-metals', 'Organic Chemistry'
      ],
      math: [
        'Number Systems', 'Algebra', 'Geometry', 'Trigonometry',
        'Statistics', 'Probability', 'Coordinate Geometry', 'Mensuration'
      ],
      biology: [
        'Cell Structure', 'Human Body Systems', 'Genetics', 'Evolution',
        'Ecology', 'Plant Biology', 'Animal Biology', 'Biotechnology'
      ]
    };
    
    const topics = subjectTopics[subject].map(topicName => {
      const progress = topicProgress.find(p => p.topic === topicName);
      return {
        name: topicName,
        completion_percentage: progress ? progress.completion_percentage : 0,
        score: progress ? progress.score : 0,
        attempts: progress ? progress.attempts : 0,
        time_spent: progress ? progress.time_spent : 0,
        last_accessed: progress ? progress.last_accessed : null
      };
    });
    
    res.json({
      subject,
      progress: subjectProgress || {
        total_topics: 0,
        avg_completion: 0,
        avg_score: 0,
        total_time_spent: 0,
        completed_topics: 0
      },
      topics
    });
  } catch (error) {
    console.error('Subject detail error:', error);
    res.status(500).json({ error: 'Failed to get subject details' });
  }
});

// Update progress for a topic
router.post('/progress', [
  requireStudent,
  body('subject').isIn(['physics', 'chemistry', 'math', 'biology']),
  body('topic').isLength({ min: 1, max: 100 }),
  body('completion_percentage').isFloat({ min: 0, max: 100 }),
  body('score').optional().isInt({ min: 0, max: 100 }),
  body('time_spent').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const studentId = req.user.id;
    const { subject, topic, completion_percentage, score = 0, time_spent = 0 } = req.body;
    
    // Update progress
    const progressResult = await Progress.updateProgress(
      studentId, 
      subject, 
      topic, 
      completion_percentage, 
      score, 
      time_spent
    );
    
    // Calculate points earned
    let pointsEarned = 0;
    if (progressResult.created) {
      pointsEarned = Math.floor(completion_percentage / 10) + (score >= 80 ? 20 : score >= 60 ? 10 : 5);
    } else if (progressResult.updated) {
      // Bonus points for improvement
      pointsEarned = Math.floor((completion_percentage - 50) / 10) * 2;
    }
    
    // Update user points
    if (pointsEarned > 0) {
      await updateUserPoints(studentId, pointsEarned, subject);
    }
    
    // Check for new achievements
    const newAchievements = await Achievement.checkAndAwardAchievements(studentId);
    
    res.json({
      message: 'Progress updated successfully',
      progress: progressResult,
      pointsEarned,
      newAchievements
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get user achievements
router.get('/achievements', requireStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const achievementProgress = await Achievement.getAchievementProgress(studentId);
    
    const earnedCount = achievementProgress.filter(a => a.earned).length;
    const totalCount = achievementProgress.length;
    
    res.json({
      achievements: achievementProgress,
      summary: {
        earned: earnedCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { subject } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await User.getLeaderboard(limit, subject);
    
    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get user points and level
router.get('/points', requireStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const db = getDatabase();
    
    const userPoints = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_points WHERE user_id = ?', [studentId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!userPoints) {
      await User.initializeUserPoints(studentId);
      return res.json({
        total_points: 0,
        current_level: 1,
        subject_points: {},
        daily_streak: 0,
        next_level_points: 100
      });
    }
    
    // Calculate next level points
    const nextLevelPoints = userPoints.current_level * 100;
    
    res.json({
      ...userPoints,
      subject_points: JSON.parse(userPoints.subject_points || '{}'),
      next_level_points: nextLevelPoints
    });
  } catch (error) {
    console.error('Points error:', error);
    res.status(500).json({ error: 'Failed to get points data' });
  }
});

// Helper function to update user points
async function updateUserPoints(userId, pointsToAdd, subject) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Get current points
    db.get('SELECT * FROM user_points WHERE user_id = ?', [userId], (err, currentPoints) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!currentPoints) {
        // Initialize if doesn't exist
        User.initializeUserPoints(userId)
          .then(() => updateUserPoints(userId, pointsToAdd, subject))
          .then(resolve)
          .catch(reject);
        return;
      }
      
      const newTotalPoints = currentPoints.total_points + pointsToAdd;
      const newLevel = Math.floor(newTotalPoints / 100) + 1;
      
      // Update subject points
      const subjectPoints = JSON.parse(currentPoints.subject_points || '{}');
      subjectPoints[subject] = (subjectPoints[subject] || 0) + pointsToAdd;
      
      // Update daily streak
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = currentPoints.last_activity_date;
      let newStreak = currentPoints.daily_streak;
      
      if (lastActivity !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastActivity === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
      
      const stmt = db.prepare(`
        UPDATE user_points 
        SET total_points = ?, current_level = ?, subject_points = ?, daily_streak = ?, 
            last_activity_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);
      
      stmt.run([
        newTotalPoints, 
        newLevel, 
        JSON.stringify(subjectPoints), 
        newStreak, 
        today, 
        userId
      ], function(updateErr) {
        if (updateErr) {
          reject(updateErr);
          return;
        }
        resolve({
          total_points: newTotalPoints,
          current_level: newLevel,
          subject_points: subjectPoints,
          daily_streak: newStreak
        });
      });
      
      stmt.finalize();
    });
  });
}

module.exports = router;
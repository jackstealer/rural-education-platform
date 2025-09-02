const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken, requireTeacher } = require('../middleware/auth');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { getDatabase } = require('../database/init');

const router = express.Router();

// All routes require teacher authentication
router.use(verifyToken);
router.use(requireTeacher);

// Get teacher dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // Get teacher's classes
    const classes = await getTeacherClasses(teacherId);
    
    // Get students under this teacher
    const students = await User.getStudentsByTeacher(teacherId);
    
    // Get overall class progress
    const classProgress = await Progress.getClassProgress(teacherId);
    
    // Calculate summary statistics
    const totalStudents = students.length;
    const activeStudents = students.filter(s => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return new Date(s.last_login) > lastWeek;
    }).length;
    
    const avgCompletionBySubject = {};
    classProgress.forEach(progress => {
      if (!avgCompletionBySubject[progress.subject]) {
        avgCompletionBySubject[progress.subject] = {
          total: 0,
          count: 0,
          avg: 0
        };
      }
      if (progress.avg_completion) {
        avgCompletionBySubject[progress.subject].total += progress.avg_completion;
        avgCompletionBySubject[progress.subject].count += 1;
      }
    });
    
    Object.keys(avgCompletionBySubject).forEach(subject => {
      const data = avgCompletionBySubject[subject];
      data.avg = data.count > 0 ? Math.round(data.total / data.count) : 0;
    });
    
    res.json({
      summary: {
        totalStudents,
        activeStudents,
        totalClasses: classes.length,
        avgCompletionBySubject
      },
      classes,
      recentActivity: classProgress.slice(0, 10)
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get teacher's classes
router.get('/classes', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const classes = await getTeacherClasses(teacherId);
    
    res.json({ classes });
  } catch (error) {
    console.error('Classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

// Create a new class
router.post('/classes', [
  body('class_name').isLength({ min: 1, max: 100 }).withMessage('Class name is required'),
  body('grade_level').isInt({ min: 6, max: 12 }).withMessage('Grade level must be between 6 and 12'),
  body('subject').isIn(['physics', 'chemistry', 'math', 'biology']).withMessage('Invalid subject'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const teacherId = req.user.id;
    const { class_name, grade_level, subject, description } = req.body;
    
    const classData = await createClass(teacherId, class_name, grade_level, subject, description);
    
    res.status(201).json({
      message: 'Class created successfully',
      class: classData
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Get students in a specific class
router.get('/classes/:classId/students', async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    
    // Verify teacher owns this class
    const classData = await getClassById(classId);
    if (!classData || classData.teacher_id !== teacherId) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    const students = await getClassStudents(classId);
    
    res.json({ students });
  } catch (error) {
    console.error('Class students error:', error);
    res.status(500).json({ error: 'Failed to get class students' });
  }
});

// Get detailed analytics for students
router.get('/analytics/students', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { subject, timeframe = '30' } = req.query;
    
    const students = await User.getStudentsByTeacher(teacherId);
    const studentAnalytics = [];
    
    for (const student of students) {
      const progress = await Progress.getStudentProgress(student.id, subject);
      const overallProgress = await Progress.getOverallProgress(student.id);
      
      // Calculate engagement metrics
      const recentActivity = await Progress.getRecentActivity(student.id, parseInt(timeframe));
      
      studentAnalytics.push({
        student: {
          id: student.id,
          name: student.full_name,
          username: student.username,
          grade_level: student.grade_level,
          last_login: student.last_login
        },
        progress: overallProgress,
        recentActivity: recentActivity.length,
        totalTimeSpent: progress.reduce((sum, p) => sum + (p.time_spent || 0), 0),
        avgScore: progress.length > 0 ? 
          Math.round(progress.reduce((sum, p) => sum + (p.score || 0), 0) / progress.length) : 0,
        completedTopics: progress.filter(p => p.completion_percentage >= 100).length,
        totalTopics: progress.length
      });
    }
    
    res.json({ analytics: studentAnalytics });
  } catch (error) {
    console.error('Student analytics error:', error);
    res.status(500).json({ error: 'Failed to get student analytics' });
  }
});

// Get subject-wise analytics
router.get('/analytics/subjects', async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const subjects = ['physics', 'chemistry', 'math', 'biology'];
    const subjectAnalytics = [];
    
    for (const subject of subjects) {
      const classProgress = await Progress.getClassProgress(teacherId);
      const subjectProgress = classProgress.filter(p => p.subject === subject);
      
      if (subjectProgress.length > 0) {
        const avgCompletion = subjectProgress.reduce((sum, p) => sum + (p.avg_completion || 0), 0) / subjectProgress.length;
        const avgScore = subjectProgress.reduce((sum, p) => sum + (p.avg_score || 0), 0) / subjectProgress.length;
        const totalTimeSpent = subjectProgress.reduce((sum, p) => sum + (p.total_time_spent || 0), 0);
        const totalCompletedTopics = subjectProgress.reduce((sum, p) => sum + (p.completed_topics || 0), 0);
        const totalTopics = subjectProgress.reduce((sum, p) => sum + (p.total_topics || 0), 0);
        
        subjectAnalytics.push({
          subject,
          studentCount: subjectProgress.length,
          avgCompletion: Math.round(avgCompletion),
          avgScore: Math.round(avgScore),
          totalTimeSpent,
          completionRate: totalTopics > 0 ? Math.round((totalCompletedTopics / totalTopics) * 100) : 0
        });
      } else {
        subjectAnalytics.push({
          subject,
          studentCount: 0,
          avgCompletion: 0,
          avgScore: 0,
          totalTimeSpent: 0,
          completionRate: 0
        });
      }
    }
    
    res.json({ analytics: subjectAnalytics });
  } catch (error) {
    console.error('Subject analytics error:', error);
    res.status(500).json({ error: 'Failed to get subject analytics' });
  }
});

// Get engagement metrics
router.get('/analytics/engagement', async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { days = 30 } = req.query;
    
    const students = await User.getStudentsByTeacher(teacherId);
    
    // Calculate daily active users for the past N days
    const dailyActivity = [];
    const today = new Date();
    
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const activeStudents = await getActiveStudentsForDate(students.map(s => s.id), dateStr);
      
      dailyActivity.push({
        date: dateStr,
        activeStudents: activeStudents.length,
        totalStudents: students.length
      });
    }
    
    // Calculate time-based engagement
    const timeDistribution = await getTimeDistribution(students.map(s => s.id));
    
    res.json({
      dailyActivity,
      timeDistribution,
      totalStudents: students.length
    });
  } catch (error) {
    console.error('Engagement analytics error:', error);
    res.status(500).json({ error: 'Failed to get engagement analytics' });
  }
});

// Get individual student detailed progress
router.get('/students/:studentId/progress', async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;
    
    // Verify teacher has access to this student
    const students = await User.getStudentsByTeacher(teacherId);
    if (!students.find(s => s.id == studentId)) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = await User.findById(studentId);
    const overallProgress = await Progress.getOverallProgress(studentId);
    const recentActivity = await Progress.getRecentActivity(studentId, 20);
    
    res.json({
      student: {
        id: student.id,
        name: student.full_name,
        username: student.username,
        grade_level: student.grade_level,
        last_login: student.last_login
      },
      progress: overallProgress,
      recentActivity
    });
  } catch (error) {
    console.error('Student progress error:', error);
    res.status(500).json({ error: 'Failed to get student progress' });
  }
});

// Helper functions
async function getTeacherClasses(teacherId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const query = `
      SELECT c.*, COUNT(ce.student_id) as student_count
      FROM classes c
      LEFT JOIN class_enrollments ce ON c.id = ce.class_id
      WHERE c.teacher_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    
    db.all(query, [teacherId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function createClass(teacherId, className, gradeLevel, subject, description) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO classes (teacher_id, class_name, grade_level, subject, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run([teacherId, className, gradeLevel, subject, description], function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        id: this.lastID,
        teacher_id: teacherId,
        class_name: className,
        grade_level: gradeLevel,
        subject,
        description
      });
    });
    
    stmt.finalize();
  });
}

async function getClassById(classId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM classes WHERE id = ?', [classId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function getClassStudents(classId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const query = `
      SELECT u.*, up.total_points, up.current_level, ce.enrolled_at
      FROM users u
      JOIN class_enrollments ce ON u.id = ce.student_id
      LEFT JOIN user_points up ON u.id = up.user_id
      WHERE ce.class_id = ? AND u.role = 'student' AND u.is_active = 1
      ORDER BY u.full_name
    `;
    
    db.all(query, [classId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getActiveStudentsForDate(studentIds, date) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    if (studentIds.length === 0) {
      resolve([]);
      return;
    }
    
    const placeholders = studentIds.map(() => '?').join(',');
    const query = `
      SELECT DISTINCT student_id
      FROM student_progress
      WHERE student_id IN (${placeholders}) 
      AND DATE(last_accessed) = ?
    `;
    
    db.all(query, [...studentIds, date], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getTimeDistribution(studentIds) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    if (studentIds.length === 0) {
      resolve([]);
      return;
    }
    
    const placeholders = studentIds.map(() => '?').join(',');
    const query = `
      SELECT 
        CASE 
          WHEN time_spent < 300 THEN '0-5 min'
          WHEN time_spent < 900 THEN '5-15 min'
          WHEN time_spent < 1800 THEN '15-30 min'
          WHEN time_spent < 3600 THEN '30-60 min'
          ELSE '60+ min'
        END as time_range,
        COUNT(*) as count
      FROM student_progress
      WHERE student_id IN (${placeholders})
      GROUP BY time_range
      ORDER BY MIN(time_spent)
    `;
    
    db.all(query, studentIds, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = router;
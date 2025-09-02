const { getDatabase } = require('../database/init');

class Progress {
  static async updateProgress(studentId, subject, topic, completionPercentage, score = 0, timeSpent = 0) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      // First, try to get existing progress
      db.get(
        'SELECT * FROM student_progress WHERE student_id = ? AND subject = ? AND topic = ?',
        [studentId, subject, topic],
        (err, existingProgress) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (existingProgress) {
            // Update existing progress
            const newAttempts = existingProgress.attempts + 1;
            const newTimeSpent = existingProgress.time_spent + timeSpent;
            const newScore = Math.max(existingProgress.score, score); // Keep best score
            const newCompletion = Math.max(existingProgress.completion_percentage, completionPercentage);
            
            const stmt = db.prepare(`
              UPDATE student_progress 
              SET completion_percentage = ?, score = ?, time_spent = ?, attempts = ?, last_accessed = CURRENT_TIMESTAMP
              WHERE student_id = ? AND subject = ? AND topic = ?
            `);
            
            stmt.run([newCompletion, newScore, newTimeSpent, newAttempts, studentId, subject, topic], function(updateErr) {
              if (updateErr) {
                reject(updateErr);
                return;
              }
              resolve({ 
                updated: true, 
                completion_percentage: newCompletion, 
                score: newScore, 
                attempts: newAttempts 
              });
            });
            
            stmt.finalize();
          } else {
            // Create new progress record
            const stmt = db.prepare(`
              INSERT INTO student_progress (student_id, subject, topic, completion_percentage, score, time_spent, attempts)
              VALUES (?, ?, ?, ?, ?, ?, 1)
            `);
            
            stmt.run([studentId, subject, topic, completionPercentage, score, timeSpent], function(insertErr) {
              if (insertErr) {
                reject(insertErr);
                return;
              }
              resolve({ 
                created: true, 
                id: this.lastID, 
                completion_percentage: completionPercentage, 
                score: score,
                attempts: 1 
              });
            });
            
            stmt.finalize();
          }
        }
      );
    });
  }
  
  static async getStudentProgress(studentId, subject = null) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM student_progress WHERE student_id = ?';
      const params = [studentId];
      
      if (subject) {
        query += ' AND subject = ?';
        params.push(subject);
      }
      
      query += ' ORDER BY last_accessed DESC';
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
  
  static async getSubjectProgress(studentId, subject) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          subject,
          COUNT(*) as total_topics,
          AVG(completion_percentage) as avg_completion,
          AVG(score) as avg_score,
          SUM(time_spent) as total_time_spent,
          COUNT(CASE WHEN completion_percentage >= 100 THEN 1 END) as completed_topics
        FROM student_progress 
        WHERE student_id = ? AND subject = ?
        GROUP BY subject
      `;
      
      db.get(query, [studentId, subject], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }
  
  static async getOverallProgress(studentId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          subject,
          COUNT(*) as total_topics,
          AVG(completion_percentage) as avg_completion,
          AVG(score) as avg_score,
          SUM(time_spent) as total_time_spent,
          COUNT(CASE WHEN completion_percentage >= 100 THEN 1 END) as completed_topics
        FROM student_progress 
        WHERE student_id = ?
        GROUP BY subject
        ORDER BY subject
      `;
      
      db.all(query, [studentId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
  
  static async getClassProgress(teacherId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          u.id as student_id,
          u.full_name,
          sp.subject,
          COUNT(*) as total_topics,
          AVG(sp.completion_percentage) as avg_completion,
          AVG(sp.score) as avg_score,
          SUM(sp.time_spent) as total_time_spent,
          COUNT(CASE WHEN sp.completion_percentage >= 100 THEN 1 END) as completed_topics
        FROM users u
        JOIN class_enrollments ce ON u.id = ce.student_id
        JOIN classes c ON ce.class_id = c.id
        LEFT JOIN student_progress sp ON u.id = sp.student_id
        WHERE c.teacher_id = ? AND u.role = 'student' AND u.is_active = 1
        GROUP BY u.id, u.full_name, sp.subject
        ORDER BY u.full_name, sp.subject
      `;
      
      db.all(query, [teacherId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
  
  static async getTopicProgress(studentId, subject, topic) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM student_progress WHERE student_id = ? AND subject = ? AND topic = ?',
        [studentId, subject, topic],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  }
  
  static async getRecentActivity(studentId, limit = 10) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT subject, topic, completion_percentage, score, last_accessed
        FROM student_progress 
        WHERE student_id = ?
        ORDER BY last_accessed DESC
        LIMIT ?
      `;
      
      db.all(query, [studentId, limit], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
}

module.exports = Progress;
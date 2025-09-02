const { getDatabase } = require('../database/init');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const db = getDatabase();
    const { username, email, password, role, full_name, grade_level, school_name, preferred_language } = userData;
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO users (username, email, password_hash, role, full_name, grade_level, school_name, preferred_language)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([username, email, password_hash, role, full_name, grade_level, school_name, preferred_language || 'english'], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Initialize user points record for students
        if (role === 'student') {
          User.initializeUserPoints(this.lastID)
            .then(() => resolve({ id: this.lastID, ...userData, password: undefined }))
            .catch(reject);
        } else {
          resolve({ id: this.lastID, ...userData, password: undefined });
        }
      });
      
      stmt.finalize();
    });
  }
  
  static async findByEmail(email) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }
  
  static async findById(id) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ? AND is_active = 1', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }
  
  static async findByUsername(username) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }
  
  static async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  
  static async updateLastLogin(userId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });
  }
  
  static async updateProfile(userId, updateData) {
    const db = getDatabase();
    const { full_name, school_name, preferred_language, avatar_url } = updateData;
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE users 
        SET full_name = ?, school_name = ?, preferred_language = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run([full_name, school_name, preferred_language, avatar_url, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
      
      stmt.finalize();
    });
  }
  
  static async initializeUserPoints(userId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO user_points (user_id, total_points, current_level, subject_points, daily_streak, last_activity_date)
        VALUES (?, 0, 1, '{}', 0, date('now'))
      `);
      
      stmt.run([userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
      
      stmt.finalize();
    });
  }
  
  static async getStudentsByTeacher(teacherId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT u.*, up.total_points, up.current_level
        FROM users u
        JOIN class_enrollments ce ON u.id = ce.student_id
        JOIN classes c ON ce.class_id = c.id
        LEFT JOIN user_points up ON u.id = up.user_id
        WHERE c.teacher_id = ? AND u.role = 'student' AND u.is_active = 1
        ORDER BY u.full_name
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
  
  static async getLeaderboard(limit = 10, subject = null) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      let query = `
        SELECT u.id, u.username, u.full_name, u.avatar_url, up.total_points, up.current_level
        FROM users u
        JOIN user_points up ON u.id = up.user_id
        WHERE u.role = 'student' AND u.is_active = 1
      `;
      
      const params = [];
      
      if (subject) {
        query += ` AND JSON_EXTRACT(up.subject_points, '$.' || ?) > 0`;
        params.push(subject);
        query += ` ORDER BY JSON_EXTRACT(up.subject_points, '$.' || ?) DESC`;
        params.push(subject);
      } else {
        query += ` ORDER BY up.total_points DESC`;
      }
      
      query += ` LIMIT ?`;
      params.push(limit);
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
}

module.exports = User;
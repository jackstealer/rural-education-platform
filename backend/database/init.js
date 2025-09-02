const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rural_education.db');

let db;

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('📊 Connected to SQLite database');
      
      // Create tables
      createTables()
        .then(() => {
          console.log('✅ Database tables initialized');
          resolve();
        })
        .catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    const tables = [
      // Users table (students and teachers)
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
        full_name TEXT NOT NULL,
        grade_level INTEGER,
        school_name TEXT,
        preferred_language TEXT DEFAULT 'english',
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,
      
      // Student progress tracking
      `CREATE TABLE IF NOT EXISTS student_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        completion_percentage REAL DEFAULT 0,
        score INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Achievements and badges
      `CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        badge_icon TEXT,
        points_required INTEGER DEFAULT 0,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // User achievements
      `CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements (id) ON DELETE CASCADE,
        UNIQUE(user_id, achievement_id)
      )`,
      
      // Game scores and progress
      `CREATE TABLE IF NOT EXISTS game_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        score INTEGER NOT NULL,
        level_completed INTEGER DEFAULT 1,
        time_taken INTEGER,
        points_earned INTEGER DEFAULT 0,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // User points and levels
      `CREATE TABLE IF NOT EXISTS user_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_points INTEGER DEFAULT 0,
        current_level INTEGER DEFAULT 1,
        subject_points JSON,
        daily_streak INTEGER DEFAULT 0,
        last_activity_date DATE,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id)
      )`,
      
      // Classes for teacher management
      `CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        class_name TEXT NOT NULL,
        grade_level INTEGER,
        subject TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Class enrollment
      `CREATE TABLE IF NOT EXISTS class_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(class_id, student_id)
      )`,
      
      // Learning content
      `CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        grade_level INTEGER,
        content_type TEXT CHECK (content_type IN ('lesson', 'game', 'quiz', 'video', 'reading')),
        content_data JSON,
        language TEXT DEFAULT 'english',
        difficulty_level INTEGER DEFAULT 1,
        estimated_time INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    let completed = 0;
    
    tables.forEach((tableSQL, index) => {
      db.run(tableSQL, (err) => {
        if (err) {
          console.error(`Error creating table ${index + 1}:`, err.message);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === tables.length) {
          // Insert default achievements
          insertDefaultAchievements()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  });
};

const insertDefaultAchievements = () => {
  return new Promise((resolve, reject) => {
    const achievements = [
      { name: 'First Steps', description: 'Complete your first lesson', badge_icon: '🎯', points_required: 10, category: 'progress' },
      { name: 'Game Master', description: 'Complete 5 different games', badge_icon: '🎮', points_required: 100, category: 'gaming' },
      { name: 'Physics Explorer', description: 'Complete all physics lessons', badge_icon: '⚛️', points_required: 500, category: 'physics' },
      { name: 'Chemistry Wizard', description: 'Complete all chemistry experiments', badge_icon: '🧪', points_required: 500, category: 'chemistry' },
      { name: 'Math Genius', description: 'Solve 100 math problems', badge_icon: '🔢', points_required: 300, category: 'math' },
      { name: 'Biology Expert', description: 'Complete all biology modules', badge_icon: '🧬', points_required: 500, category: 'biology' },
      { name: 'Daily Learner', description: 'Login for 7 consecutive days', badge_icon: '📅', points_required: 50, category: 'streak' },
      { name: 'High Achiever', description: 'Score 90% or higher in 10 activities', badge_icon: '⭐', points_required: 200, category: 'performance' }
    ];

    const stmt = db.prepare(`INSERT OR IGNORE INTO achievements (name, description, badge_icon, points_required, category) VALUES (?, ?, ?, ?, ?)`);
    
    let inserted = 0;
    achievements.forEach((achievement) => {
      stmt.run([achievement.name, achievement.description, achievement.badge_icon, achievement.points_required, achievement.category], (err) => {
        if (err) {
          console.error('Error inserting achievement:', err.message);
        }
        inserted++;
        if (inserted === achievements.length) {
          stmt.finalize();
          resolve();
        }
      });
    });
  });
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
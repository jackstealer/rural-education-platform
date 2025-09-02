const { getDatabase } = require('../database/init');

class Achievement {
  static async getAllAchievements() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM achievements ORDER BY category, points_required', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
  
  static async getUserAchievements(userId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT a.*, ua.earned_at
        FROM achievements a
        JOIN user_achievements ua ON a.id = ua.achievement_id
        WHERE ua.user_id = ?
        ORDER BY ua.earned_at DESC
      `;
      
      db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
  
  static async checkAndAwardAchievements(userId) {
    const db = getDatabase();
    const newAchievements = [];
    
    try {
      // Get user's current achievements
      const earnedAchievements = await Achievement.getUserAchievements(userId);
      const earnedIds = earnedAchievements.map(a => a.id);
      
      // Get user's current points and progress
      const userStats = await Achievement.getUserStats(userId);
      
      // Get all achievements
      const allAchievements = await Achievement.getAllAchievements();
      
      // Check each achievement
      for (const achievement of allAchievements) {
        if (earnedIds.includes(achievement.id)) {
          continue; // Already earned
        }
        
        const shouldAward = await Achievement.checkAchievementCriteria(userId, achievement, userStats);
        
        if (shouldAward) {
          await Achievement.awardAchievement(userId, achievement.id);
          newAchievements.push(achievement);
        }
      }
      
      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }
  
  static async getUserStats(userId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const queries = [
        // Get user points
        'SELECT * FROM user_points WHERE user_id = ?',
        // Get progress stats
        `SELECT 
          COUNT(*) as total_activities,
          COUNT(CASE WHEN completion_percentage >= 100 THEN 1 END) as completed_activities,
          AVG(score) as avg_score,
          COUNT(CASE WHEN score >= 90 THEN 1 END) as high_score_count
        FROM student_progress WHERE student_id = ?`,
        // Get game stats
        `SELECT 
          COUNT(DISTINCT game_name) as unique_games_played,
          COUNT(*) as total_games_played,
          MAX(score) as highest_game_score
        FROM game_scores WHERE user_id = ?`,
        // Get subject completion
        `SELECT 
          subject,
          COUNT(*) as topic_count,
          COUNT(CASE WHEN completion_percentage >= 100 THEN 1 END) as completed_topics
        FROM student_progress WHERE student_id = ? GROUP BY subject`
      ];
      
      const stats = {};
      let completed = 0;
      
      db.get(queries[0], [userId], (err, userPoints) => {
        if (err) {
          reject(err);
          return;
        }
        stats.userPoints = userPoints || { total_points: 0, daily_streak: 0 };
        
        if (++completed === 4) resolve(stats);
      });
      
      db.get(queries[1], [userId], (err, progressStats) => {
        if (err) {
          reject(err);
          return;
        }
        stats.progressStats = progressStats || { total_activities: 0, completed_activities: 0, avg_score: 0, high_score_count: 0 };
        
        if (++completed === 4) resolve(stats);
      });
      
      db.get(queries[2], [userId], (err, gameStats) => {
        if (err) {
          reject(err);
          return;
        }
        stats.gameStats = gameStats || { unique_games_played: 0, total_games_played: 0, highest_game_score: 0 };
        
        if (++completed === 4) resolve(stats);
      });
      
      db.all(queries[3], [userId], (err, subjectProgress) => {
        if (err) {
          reject(err);
          return;
        }
        stats.subjectProgress = subjectProgress || [];
        
        if (++completed === 4) resolve(stats);
      });
    });
  }
  
  static async checkAchievementCriteria(userId, achievement, userStats) {
    const { userPoints, progressStats, gameStats, subjectProgress } = userStats;
    
    switch (achievement.name) {
      case 'First Steps':
        return progressStats.completed_activities >= 1;
        
      case 'Game Master':
        return gameStats.unique_games_played >= 5;
        
      case 'Physics Explorer':
        const physicsProgress = subjectProgress.find(s => s.subject === 'physics');
        return physicsProgress && physicsProgress.completed_topics >= 10; // Assuming 10+ topics for completion
        
      case 'Chemistry Wizard':
        const chemistryProgress = subjectProgress.find(s => s.subject === 'chemistry');
        return chemistryProgress && chemistryProgress.completed_topics >= 10;
        
      case 'Math Genius':
        const mathProgress = subjectProgress.find(s => s.subject === 'math');
        return mathProgress && mathProgress.completed_topics >= 20; // Math might have more topics
        
      case 'Biology Expert':
        const biologyProgress = subjectProgress.find(s => s.subject === 'biology');
        return biologyProgress && biologyProgress.completed_topics >= 10;
        
      case 'Daily Learner':
        return userPoints.daily_streak >= 7;
        
      case 'High Achiever':
        return progressStats.high_score_count >= 10;
        
      default:
        // Generic points-based achievement
        return userPoints.total_points >= achievement.points_required;
    }
  }
  
  static async awardAchievement(userId, achievementId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, earned_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([userId, achievementId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
      
      stmt.finalize();
    });
  }
  
  static async getAchievementProgress(userId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          a.*,
          CASE WHEN ua.achievement_id IS NOT NULL THEN 1 ELSE 0 END as earned,
          ua.earned_at
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
        ORDER BY earned DESC, a.category, a.points_required
      `;
      
      db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
  
  static async addCustomAchievement(achievementData) {
    const db = getDatabase();
    const { name, description, badge_icon, points_required, category } = achievementData;
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO achievements (name, description, badge_icon, points_required, category)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([name, description, badge_icon, points_required, category], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, ...achievementData });
      });
      
      stmt.finalize();
    });
  }
}

module.exports = Achievement;
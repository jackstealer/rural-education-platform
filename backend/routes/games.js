const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get available games
router.get('/', async (req, res) => {
  try {
    const { subject } = req.query;
    
    const games = {
      physics: [
        {
          id: 'projectile-motion',
          name: 'Projectile Motion Simulator',
          description: 'Learn about projectile motion by adjusting angles and velocities',
          difficulty: 2,
          estimatedTime: 15,
          icon: '🎯'
        },
        {
          id: 'circuit-builder',
          name: 'Circuit Builder',
          description: 'Build and test electrical circuits',
          difficulty: 3,
          estimatedTime: 20,
          icon: '⚡'
        },
        {
          id: 'wave-simulator',
          name: 'Wave Simulator',
          description: 'Explore wave properties and interference',
          difficulty: 2,
          estimatedTime: 12,
          icon: '🌊'
        }
      ],
      chemistry: [
        {
          id: 'periodic-table-explorer',
          name: 'Periodic Table Explorer',
          description: 'Interactive exploration of elements and their properties',
          difficulty: 1,
          estimatedTime: 10,
          icon: '🧪'
        },
        {
          id: 'virtual-lab',
          name: 'Virtual Chemistry Lab',
          description: 'Perform safe chemical experiments virtually',
          difficulty: 3,
          estimatedTime: 25,
          icon: '⚗️'
        },
        {
          id: 'molecule-builder',
          name: 'Molecule Builder',
          description: 'Build molecules and understand chemical bonding',
          difficulty: 2,
          estimatedTime: 15,
          icon: '🔬'
        }
      ],
      math: [
        {
          id: 'number-puzzles',
          name: 'Number Puzzles',
          description: 'Solve challenging number-based puzzles',
          difficulty: 2,
          estimatedTime: 10,
          icon: '🔢'
        },
        {
          id: 'geometry-visualizer',
          name: 'Geometry Visualizer',
          description: 'Explore geometric shapes and transformations',
          difficulty: 2,
          estimatedTime: 15,
          icon: '📐'
        },
        {
          id: 'algebra-adventure',
          name: 'Algebra Adventure',
          description: 'Solve algebraic equations in a game-like environment',
          difficulty: 3,
          estimatedTime: 20,
          icon: '🎲'
        }
      ],
      biology: [
        {
          id: 'cell-explorer',
          name: 'Cell Structure Explorer',
          description: 'Explore different types of cells and their components',
          difficulty: 1,
          estimatedTime: 12,
          icon: '🧬'
        },
        {
          id: 'ecosystem-simulation',
          name: 'Ecosystem Simulation',
          description: 'Manage an ecosystem and understand food chains',
          difficulty: 3,
          estimatedTime: 25,
          icon: '🌿'
        },
        {
          id: 'human-body-systems',
          name: 'Human Body Systems',
          description: 'Learn about different body systems interactively',
          difficulty: 2,
          estimatedTime: 18,
          icon: '🫀'
        }
      ]
    };
    
    if (subject && games[subject]) {
      res.json({ games: games[subject] });
    } else {
      res.json({ games });
    }
  } catch (error) {
    console.error('Games list error:', error);
    res.status(500).json({ error: 'Failed to get games list' });
  }
});

// Get specific game data
router.get('/:subject/:gameId', async (req, res) => {
  try {
    const { subject, gameId } = req.params;
    
    if (!['physics', 'chemistry', 'math', 'biology'].includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject' });
    }
    
    // Game configurations
    const gameConfigs = {
      'projectile-motion': {
        levels: [
          { target: { x: 50, y: 0 }, obstacles: [], maxVelocity: 30 },
          { target: { x: 75, y: 10 }, obstacles: [{ x: 40, y: 5, width: 10, height: 15 }], maxVelocity: 35 },
          { target: { x: 100, y: -10 }, obstacles: [{ x: 50, y: 0, width: 5, height: 20 }, { x: 80, y: -5, width: 8, height: 10 }], maxVelocity: 40 }
        ],
        instructions: "Adjust the angle and velocity to hit the target. Consider gravity and obstacles!",
        physics: {
          gravity: 9.81,
          airResistance: 0.1
        }
      },
      'circuit-builder': {
        components: ['battery', 'resistor', 'led', 'switch', 'wire'],
        levels: [
          { objective: 'Light the LED with a simple circuit', components: ['battery', 'led', 'wire'], maxComponents: 3 },
          { objective: 'Create a circuit with a switch', components: ['battery', 'led', 'switch', 'wire'], maxComponents: 4 },
          { objective: 'Build a circuit with resistance control', components: ['battery', 'led', 'resistor', 'wire'], maxComponents: 5 }
        ]
      },
      'periodic-table-explorer': {
        gameMode: 'quiz',
        questions: [
          { type: 'element-symbol', difficulty: 1 },
          { type: 'atomic-number', difficulty: 1 },
          { type: 'element-properties', difficulty: 2 },
          { type: 'periodic-trends', difficulty: 3 }
        ]
      },
      'cell-explorer': {
        cellTypes: ['plant', 'animal', 'bacteria'],
        organelles: ['nucleus', 'mitochondria', 'chloroplast', 'ribosome', 'vacuole', 'cell-wall', 'cell-membrane'],
        levels: [
          { cellType: 'animal', organellesToFind: ['nucleus', 'mitochondria', 'ribosome'] },
          { cellType: 'plant', organellesToFind: ['nucleus', 'chloroplast', 'vacuole', 'cell-wall'] },
          { cellType: 'bacteria', organellesToFind: ['ribosome', 'cell-membrane'] }
        ]
      }
    };
    
    const gameConfig = gameConfigs[gameId];
    if (!gameConfig) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Get user's previous scores for this game
    const userId = req.user.id;
    const previousScores = await getUserGameScores(userId, gameId);
    
    res.json({
      gameId,
      subject,
      config: gameConfig,
      previousScores,
      highScore: previousScores.length > 0 ? Math.max(...previousScores.map(s => s.score)) : 0
    });
  } catch (error) {
    console.error('Game config error:', error);
    res.status(500).json({ error: 'Failed to get game configuration' });
  }
});

// Submit game score
router.post('/:subject/:gameId/score', [
  body('score').isInt({ min: 0, max: 1000 }).withMessage('Score must be between 0 and 1000'),
  body('level_completed').optional().isInt({ min: 1, max: 10 }).withMessage('Level must be between 1 and 10'),
  body('time_taken').optional().isInt({ min: 1 }).withMessage('Time taken must be positive'),
  body('game_data').optional().isObject().withMessage('Game data must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { subject, gameId } = req.params;
    const { score, level_completed = 1, time_taken = 0, game_data = {} } = req.body;
    const userId = req.user.id;
    
    if (!['physics', 'chemistry', 'math', 'biology'].includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject' });
    }
    
    // Calculate points based on score and time
    let pointsEarned = Math.floor(score / 10); // Base points
    if (score >= 90) pointsEarned += 20; // Bonus for high score
    if (score >= 70) pointsEarned += 10; // Bonus for good score
    if (time_taken > 0 && time_taken < 300) pointsEarned += 5; // Speed bonus
    
    // Save game score
    await saveGameScore(userId, gameId, subject, score, level_completed, time_taken, pointsEarned, game_data);
    
    // Get user's best score for this game
    const userScores = await getUserGameScores(userId, gameId);
    const bestScore = Math.max(...userScores.map(s => s.score));
    const isNewRecord = score === bestScore;
    
    res.json({
      message: 'Score submitted successfully',
      score,
      pointsEarned,
      isNewRecord,
      bestScore,
      totalPlays: userScores.length
    });
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Get leaderboard for a specific game
router.get('/:subject/:gameId/leaderboard', async (req, res) => {
  try {
    const { subject, gameId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await getGameLeaderboard(gameId, subject, limit);
    
    res.json({ leaderboard });
  } catch (error) {
    console.error('Game leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get game leaderboard' });
  }
});

// Get user's game statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject } = req.query;
    
    const stats = await getUserGameStats(userId, subject);
    
    res.json({ stats });
  } catch (error) {
    console.error('Game stats error:', error);
    res.status(500).json({ error: 'Failed to get game statistics' });
  }
});

// Helper functions
async function getUserGameScores(userId, gameName) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM game_scores 
      WHERE user_id = ? AND game_name = ? 
      ORDER BY played_at DESC
    `;
    
    db.all(query, [userId, gameName], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function saveGameScore(userId, gameName, subject, score, levelCompleted, timeTaken, pointsEarned, gameData) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO game_scores (user_id, game_name, subject, score, level_completed, time_taken, points_earned, played_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run([userId, gameName, subject, score, levelCompleted, timeTaken, pointsEarned], function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, score, pointsEarned });
    });
    
    stmt.finalize();
  });
}

async function getGameLeaderboard(gameName, subject, limit) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        MAX(gs.score) as best_score,
        MAX(gs.level_completed) as highest_level,
        MIN(gs.time_taken) as best_time,
        COUNT(gs.id) as total_plays
      FROM game_scores gs
      JOIN users u ON gs.user_id = u.id
      WHERE gs.game_name = ? AND gs.subject = ? AND u.is_active = 1
      GROUP BY u.id, u.username, u.full_name, u.avatar_url
      ORDER BY best_score DESC, best_time ASC
      LIMIT ?
    `;
    
    db.all(query, [gameName, subject, limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getUserGameStats(userId, subject = null) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        subject,
        game_name,
        COUNT(*) as total_plays,
        MAX(score) as best_score,
        AVG(score) as avg_score,
        MAX(level_completed) as highest_level,
        MIN(time_taken) as best_time,
        SUM(points_earned) as total_points
      FROM game_scores 
      WHERE user_id = ?
    `;
    
    const params = [userId];
    
    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }
    
    query += ' GROUP BY subject, game_name ORDER BY subject, game_name';
    
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = router;
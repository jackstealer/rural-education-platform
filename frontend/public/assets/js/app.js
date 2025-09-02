// Rural Education Platform - Main Application
class RuralEducationApp {
  constructor() {
    this.currentUser = null;
    this.currentPage = 'dashboard';
    this.isOnline = navigator.onLine;
    this.authToken = localStorage.getItem('authToken');
    
    this.init();
  }
  
  async init() {
    // Show loading screen initially
    this.showLoading();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Check authentication
    if (this.authToken) {
      try {
        const isValid = await this.validateToken();
        if (isValid) {
          await this.loadUserData();
          this.showMainApp();
          this.loadPage(this.currentPage);
        } else {
          this.showAuth();
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        this.showAuth();
      }
    } else {
      this.showAuth();
    }
    
    // Setup offline detection
    this.setupOfflineDetection();
    
    // Initialize i18n
    await this.initializeI18n();
    
    this.hideLoading();
  }
  
  setupEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('.nav-link');
      if (navLink) {
        e.preventDefault();
        const page = navLink.getAttribute('href').substring(1);
        this.navigateTo(page);
      }
    });
    
    // Language switching
    const languageSwitch = document.getElementById('language-switch');
    if (languageSwitch) {
      languageSwitch.addEventListener('change', (e) => {
        this.changeLanguage(e.target.value);
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.navigateTo('dashboard');
            break;
          case '2':
            e.preventDefault();
            this.navigateTo('subjects');
            break;
          case '3':
            e.preventDefault();
            this.navigateTo('games');
            break;
          case '4':
            e.preventDefault();
            this.navigateTo('achievements');
            break;
        }
      }
    });
    
    // Handle back/forward browser navigation
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.loadPage(e.state.page, false);
      }
    });
  }
  
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.hideOfflineIndicator();
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineIndicator();
    });
    
    if (!this.isOnline) {
      this.showOfflineIndicator();
    }
  }
  
  async validateToken() {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.valid;
      }
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
  
  async loadUserData() {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.currentUser = data.user;
        
        // Set language preference
        if (this.currentUser.preferred_language) {
          this.changeLanguage(this.currentUser.preferred_language);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load user data:', error);
      return false;
    }
  }
  
  navigateTo(page) {
    // Update URL without page reload
    const url = new URL(window.location);
    url.hash = page;
    window.history.pushState({ page }, '', url);
    
    this.loadPage(page);
  }
  
  async loadPage(page, updateHistory = true) {
    this.currentPage = page;
    
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${page}`) {
        link.classList.add('active');
      }
    });
    
    // Load page content
    const contentArea = document.getElementById('content-area');
    
    try {
      let content = '';
      
      switch (page) {
        case 'dashboard':
          content = await this.loadDashboard();
          break;
        case 'subjects':
          content = await this.loadSubjects();
          break;
        case 'games':
          content = await this.loadGames();
          break;
        case 'achievements':
          content = await this.loadAchievements();
          break;
        case 'profile':
          content = await this.loadProfile();
          break;
        case 'analytics':
          if (this.currentUser.role === 'teacher') {
            content = await this.loadAnalytics();
          } else {
            content = await this.loadDashboard();
          }
          break;
        case 'students':
          if (this.currentUser.role === 'teacher') {
            content = await this.loadStudents();
          } else {
            content = await this.loadDashboard();
          }
          break;
        default:
          content = await this.loadDashboard();
      }
      
      contentArea.innerHTML = content;
      this.initializePageScripts(page);
      
    } catch (error) {
      console.error('Failed to load page:', error);
      this.showError('Failed to load page content');
    }
  }
  
  async loadDashboard() {
    if (this.currentUser.role === 'student') {
      return await this.loadStudentDashboard();
    } else if (this.currentUser.role === 'teacher') {
      return await this.loadTeacherDashboard();
    }
  }
  
  async loadStudentDashboard() {
    try {
      const response = await fetch('/api/students/dashboard', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return this.renderStudentDashboard(data);
      }
      throw new Error('Failed to load dashboard');
    } catch (error) {
      console.error('Dashboard error:', error);
      return this.renderOfflineDashboard();
    }
  }
  
  renderStudentDashboard(data) {
    const { progress, userPoints, recentAchievements, leaderboardPosition } = data;
    
    return `
      <div class="dashboard">
        <div class="dashboard-header">
          <h1>Welcome back, ${this.currentUser.full_name}! 🎓</h1>
          <p>Ready to continue your learning adventure?</p>
        </div>
        
        <div class="dashboard-stats grid grid-4">
          <div class="stat-card card">
            <div class="stat-icon">🏆</div>
            <div class="stat-number">${userPoints.total_points || 0}</div>
            <div class="stat-label">Total Points</div>
          </div>
          
          <div class="stat-card card">
            <div class="stat-icon">📈</div>
            <div class="stat-number">Level ${userPoints.current_level || 1}</div>
            <div class="stat-label">Current Level</div>
          </div>
          
          <div class="stat-card card">
            <div class="stat-icon">🔥</div>
            <div class="stat-number">${userPoints.daily_streak || 0}</div>
            <div class="stat-label">Day Streak</div>
          </div>
          
          <div class="stat-card card">
            <div class="stat-icon">📊</div>
            <div class="stat-number">${leaderboardPosition || 'N/A'}</div>
            <div class="stat-label">Rank</div>
          </div>
        </div>
        
        <div class="dashboard-content grid grid-2">
          <div class="progress-section">
            <h3>📚 Subject Progress</h3>
            <div class="progress-list">
              ${progress.map(p => `
                <div class="progress-item card">
                  <div class="progress-header">
                    <h4>${this.getSubjectIcon(p.subject)} ${this.capitalizeFirst(p.subject)}</h4>
                    <span class="progress-percentage">${Math.round(p.avg_completion || 0)}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${p.avg_completion || 0}%"></div>
                  </div>
                  <div class="progress-stats">
                    <span>📖 ${p.completed_topics || 0}/${p.total_topics || 0} topics</span>
                    <span>⭐ Avg Score: ${Math.round(p.avg_score || 0)}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="achievements-section">
            <h3>🏆 Recent Achievements</h3>
            <div class="achievements-list">
              ${recentAchievements.length > 0 ? recentAchievements.map(a => `
                <div class="achievement-item card">
                  <div class="achievement-icon">${a.badge_icon}</div>
                  <div class="achievement-info">
                    <h4>${a.name}</h4>
                    <p>${a.description}</p>
                    <small>Earned ${this.formatDate(a.earned_at)}</small>
                  </div>
                </div>
              `).join('') : '<p class="text-center">No achievements yet. Start learning to earn your first badge! 🎯</p>'}
            </div>
            <div class="text-center mt-2">
              <button class="btn btn-outline" onclick="app.navigateTo('achievements')">View All Achievements</button>
            </div>
          </div>
        </div>
        
        <div class="quick-actions">
          <h3>🚀 Quick Actions</h3>
          <div class="action-buttons grid grid-4">
            <button class="action-btn card" onclick="app.navigateTo('subjects')">
              <div class="action-icon">📚</div>
              <div class="action-label">Continue Learning</div>
            </button>
            <button class="action-btn card" onclick="app.navigateTo('games')">
              <div class="action-icon">🎮</div>
              <div class="action-label">Play Games</div>
            </button>
            <button class="action-btn card" onclick="app.navigateTo('achievements')">
              <div class="action-icon">🏆</div>
              <div class="action-label">View Achievements</div>
            </button>
            <button class="action-btn card" onclick="app.navigateTo('profile')">
              <div class="action-icon">👤</div>
              <div class="action-label">Edit Profile</div>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderOfflineDashboard() {
    return `
      <div class="offline-dashboard">
        <h1>📡 Offline Mode</h1>
        <p>You're currently offline, but you can still access cached content!</p>
        
        <div class="offline-actions grid grid-2">
          <div class="card">
            <h3>📚 Cached Lessons</h3>
            <p>Access previously downloaded lessons and continue learning offline.</p>
            <button class="btn btn-primary" onclick="app.loadOfflineContent()">View Offline Content</button>
          </div>
          
          <div class="card">
            <h3>🎮 Offline Games</h3>
            <p>Play interactive games that work without internet connection.</p>
            <button class="btn btn-secondary" onclick="app.navigateTo('games')">Play Games</button>
          </div>
        </div>
      </div>
    `;
  }
  
  initializePageScripts(page) {
    // Initialize page-specific functionality
    switch (page) {
      case 'dashboard':
        this.initializeDashboard();
        break;
      case 'subjects':
        this.initializeSubjects();
        break;
      case 'games':
        this.initializeGames();
        break;
      case 'achievements':
        this.initializeAchievements();
        break;
    }
  }
  
  initializeDashboard() {
    // Add click handlers for action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Visual feedback
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 150);
      });
    });
  }

  async loadSubjects() {
    try {
      const response = await fetch('/api/students/subjects', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return this.renderStudentSubjects(data);
      }
      throw new Error('Failed to load subjects');
    } catch (error) {
      console.error('Subjects error:', error);
      return this.renderOfflineSubjects();
    }
  }
  
  renderStudentSubjects(data) {
    const { subjects } = data;
    
    return `
      <div class="subjects-page">
        <div class="page-header">
          <h1>📚 STEM Subjects</h1>
          <p>Choose a subject to continue your learning journey</p>
        </div>
        
        <div class="subjects-grid grid grid-2">
          ${subjects.map(subject => `
            <div class="subject-card card" onclick="app.openSubject('${subject.name}')">
              <div class="subject-header">
                <div class="subject-icon">${this.getSubjectIcon(subject.name)}</div>
                <h3>${subject.displayName}</h3>
              </div>
              
              <div class="subject-progress">
                <div class="progress-info">
                  <span>Progress: ${Math.round(subject.progress.avg_completion || 0)}%</span>
                  <span>Topics: ${subject.progress.completed_topics || 0}/${subject.progress.total_topics || 0}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${subject.progress.avg_completion || 0}%"></div>
                </div>
              </div>
              
              <div class="subject-stats">
                <div class="stat">
                  <span class="stat-label">⭐ Avg Score</span>
                  <span class="stat-value">${Math.round(subject.progress.avg_score || 0)}%</span>
                </div>
                <div class="stat">
                  <span class="stat-label">⏱️ Time Spent</span>
                  <span class="stat-value">${this.formatTime(subject.progress.total_time_spent || 0)}</span>
                </div>
              </div>
              
              <div class="subject-actions">
                <button class="btn btn-primary">Continue Learning</button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="quick-games">
          <h2>🎮 Quick Games</h2>
          <p>Practice concepts with interactive games</p>
          <div class="games-preview grid grid-4">
            <button class="game-preview-btn card" onclick="app.openGame('physics', 'projectile-motion')">
              <div class="game-icon">🎯</div>
              <div class="game-name">Projectile Motion</div>
            </button>
            <button class="game-preview-btn card" onclick="app.openGame('chemistry', 'periodic-table-explorer')">
              <div class="game-icon">🧪</div>
              <div class="game-name">Periodic Table</div>
            </button>
            <button class="game-preview-btn card" onclick="app.openGame('math', 'geometry-visualizer')">
              <div class="game-icon">📐</div>
              <div class="game-name">Geometry</div>
            </button>
            <button class="game-preview-btn card" onclick="app.openGame('biology', 'cell-explorer')">
              <div class="game-icon">🧬</div>
              <div class="game-name">Cell Explorer</div>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderOfflineSubjects() {
    return `
      <div class="subjects-page">
        <div class="page-header">
          <h1>📚 STEM Subjects (Offline)</h1>
          <p>Access cached content while offline</p>
        </div>
        
        <div class="subjects-grid grid grid-2">
          <div class="subject-card card" onclick="app.openSubject('physics')">
            <div class="subject-header">
              <div class="subject-icon">⚛️</div>
              <h3>Physics</h3>
            </div>
            <div class="offline-badge">📱 Offline Ready</div>
            <p>Explore mechanics, energy, and motion</p>
            <button class="btn btn-primary">View Content</button>
          </div>
          
          <div class="subject-card card" onclick="app.openSubject('chemistry')">
            <div class="subject-header">
              <div class="subject-icon">🧪</div>
              <h3>Chemistry</h3>
            </div>
            <div class="offline-badge">📱 Offline Ready</div>
            <p>Discover elements, reactions, and compounds</p>
            <button class="btn btn-primary">View Content</button>
          </div>
          
          <div class="subject-card card" onclick="app.openSubject('math')">
            <div class="subject-header">
              <div class="subject-icon">🔢</div>
              <h3>Mathematics</h3>
            </div>
            <div class="offline-badge">📱 Offline Ready</div>
            <p>Solve problems and visualize concepts</p>
            <button class="btn btn-primary">View Content</button>
          </div>
          
          <div class="subject-card card" onclick="app.openSubject('biology')">
            <div class="subject-header">
              <div class="subject-icon">🧬</div>
              <h3>Biology</h3>
            </div>
            <div class="offline-badge">📱 Offline Ready</div>
            <p>Study life, cells, and ecosystems</p>
            <button class="btn btn-primary">View Content</button>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadGames() {
    try {
      const response = await fetch('/api/games', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return this.renderGames(data);
      }
      throw new Error('Failed to load games');
    } catch (error) {
      console.error('Games error:', error);
      return this.renderOfflineGames();
    }
  }
  
  renderGames(data) {
    const { games } = data;
    
    return `
      <div class="games-page">
        <div class="page-header">
          <h1>🎮 Interactive STEM Games</h1>
          <p>Learn through play with engaging educational games</p>
        </div>
        
        <div class="subject-filter">
          <button class="filter-btn active" data-subject="all">All Subjects</button>
          <button class="filter-btn" data-subject="physics">⚛️ Physics</button>
          <button class="filter-btn" data-subject="chemistry">🧪 Chemistry</button>
          <button class="filter-btn" data-subject="math">🔢 Math</button>
          <button class="filter-btn" data-subject="biology">🧬 Biology</button>
        </div>
        
        <div class="games-grid">
          ${Object.entries(games).map(([subject, subjectGames]) => 
            subjectGames.map(game => `
              <div class="game-card" data-subject="${subject}" onclick="app.openGame('${subject}', '${game.id}')">
                <div class="game-card-header">
                  <div class="game-card-icon">${game.icon}</div>
                  <div class="game-card-title">${game.name}</div>
                  <div class="game-card-description">${game.description}</div>
                </div>
                
                <div class="game-card-content">
                  <div class="game-card-meta">
                    <div class="difficulty">
                      ${Array.from({length: 3}, (_, i) => 
                        `<div class="difficulty-dot ${i < game.difficulty ? 'active' : ''}"></div>`
                      ).join('')}
                    </div>
                    <div class="estimated-time">⏱️ ${game.estimatedTime} min</div>
                  </div>
                  
                  <div class="game-card-actions">
                    <button class="btn-play">🎮 Play Now</button>
                  </div>
                </div>
              </div>
            `).join('')
          ).join('')}
        </div>
      </div>
    `;
  }
  
  renderOfflineGames() {
    const offlineGames = [
      { id: 'projectile-motion', subject: 'physics', name: 'Projectile Motion', icon: '🎯', description: 'Learn physics through projectile simulation' },
      { id: 'periodic-table-explorer', subject: 'chemistry', name: 'Periodic Table Explorer', icon: '🧪', description: 'Explore chemical elements interactively' },
      { id: 'geometry-visualizer', subject: 'math', name: 'Geometry Visualizer', icon: '📐', description: 'Visualize geometric shapes and concepts' },
      { id: 'cell-explorer', subject: 'biology', name: 'Cell Explorer', icon: '🧬', description: 'Discover the building blocks of life' }
    ];
    
    return `
      <div class="games-page">
        <div class="page-header">
          <h1>🎮 Offline Games</h1>
          <p>Educational games that work without internet connection</p>
        </div>
        
        <div class="games-grid">
          ${offlineGames.map(game => `
            <div class="game-card" onclick="app.openGame('${game.subject}', '${game.id}')">
              <div class="game-card-header">
                <div class="game-card-icon">${game.icon}</div>
                <div class="game-card-title">${game.name}</div>
                <div class="game-card-description">${game.description}</div>
              </div>
              
              <div class="game-card-content">
                <div class="offline-badge">📱 Works Offline</div>
                <div class="game-card-actions">
                  <button class="btn-play">🎮 Play Now</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  async loadAchievements() {
    try {
      const response = await fetch('/api/students/achievements', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return this.renderAchievements(data);
      }
      throw new Error('Failed to load achievements');
    } catch (error) {
      console.error('Achievements error:', error);
      return this.renderOfflineAchievements();
    }
  }
  
  renderAchievements(data) {
    const { achievements, summary } = data;
    
    return `
      <div class="achievements-page">
        <div class="page-header">
          <h1>🏆 Achievements</h1>
          <p>Track your learning milestones and unlock badges</p>
        </div>
        
        <div class="achievements-summary">
          <div class="summary-stats grid grid-3">
            <div class="stat-card card">
              <div class="stat-icon">🏆</div>
              <div class="stat-number">${summary.earned}</div>
              <div class="stat-label">Earned</div>
            </div>
            <div class="stat-card card">
              <div class="stat-icon">📊</div>
              <div class="stat-number">${summary.percentage}%</div>
              <div class="stat-label">Complete</div>
            </div>
            <div class="stat-card card">
              <div class="stat-icon">🎯</div>
              <div class="stat-number">${summary.total - summary.earned}</div>
              <div class="stat-label">Remaining</div>
            </div>
          </div>
        </div>
        
        <div class="achievements-grid">
          ${achievements.map(achievement => `
            <div class="achievement-card card ${achievement.earned ? 'earned' : 'locked'}">
              <div class="achievement-icon">${achievement.badge_icon}</div>
              <div class="achievement-info">
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                <div class="achievement-meta">
                  <span class="points">💰 ${achievement.points_required} points</span>
                  ${achievement.earned ? 
                    `<span class="earned-date">Earned ${this.formatDate(achievement.earned_at)}</span>` :
                    `<span class="locked">🔒 Locked</span>`
                  }
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderOfflineAchievements() {
    return `
      <div class="achievements-page">
        <div class="page-header">
          <h1>🏆 Achievements (Offline)</h1>
          <p>View cached achievements data</p>
        </div>
        
        <div class="offline-message card">
          <h3>📡 Limited Offline Access</h3>
          <p>Connect to the internet to sync your latest achievements and unlock new badges.</p>
        </div>
      </div>
    `;
  }
  
  async loadProfile() {
    return `
      <div class="profile-page">
        <div class="page-header">
          <h1>👤 Profile</h1>
          <p>Manage your account settings and preferences</p>
        </div>
        
        <div class="profile-content grid grid-2">
          <div class="profile-info card">
            <h3>Personal Information</h3>
            <div class="info-item">
              <label>Full Name:</label>
              <span>${this.currentUser.full_name}</span>
            </div>
            <div class="info-item">
              <label>Email:</label>
              <span>${this.currentUser.email}</span>
            </div>
            <div class="info-item">
              <label>Role:</label>
              <span>${this.capitalizeFirst(this.currentUser.role)}</span>
            </div>
            ${this.currentUser.grade_level ? `
              <div class="info-item">
                <label>Grade Level:</label>
                <span>Grade ${this.currentUser.grade_level}</span>
              </div>
            ` : ''}
            <div class="info-item">
              <label>School:</label>
              <span>${this.currentUser.school_name || 'Not specified'}</span>
            </div>
          </div>
          
          <div class="profile-settings card">
            <h3>Settings</h3>
            <div class="setting-item">
              <label>Language Preference:</label>
              <select id="profile-language">
                <option value="english" ${this.currentUser.preferred_language === 'english' ? 'selected' : ''}>English</option>
                <option value="hindi" ${this.currentUser.preferred_language === 'hindi' ? 'selected' : ''}>हिंदी (Hindi)</option>
                <option value="regional" ${this.currentUser.preferred_language === 'regional' ? 'selected' : ''}>Regional</option>
              </select>
            </div>
            <button class="btn btn-primary" onclick="app.saveProfile()">Save Changes</button>
          </div>
        </div>
      </div>
    `;
  }
  
  // Helper methods for opening subjects and games
  openSubject(subject) {
    // Navigate to subject detail page
    window.location.href = `/student/subjects.html?subject=${subject}`;
  }
  
  openGame(subject, gameId) {
    // Open game in new window or navigate
    window.location.href = `/games/${subject}/${gameId}.html`;
  }
  
  formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
  
  // Utility methods
  getSubjectIcon(subject) {
    const icons = {
      physics: '⚛️',
      chemistry: '🧪',
      math: '🔢',
      biology: '🧬'
    };
    return icons[subject] || '📖';
  }
  
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }
  
  showLoading() {
    document.getElementById('loading-screen').classList.remove('hidden');
  }
  
  hideLoading() {
    document.getElementById('loading-screen').classList.add('hidden');
  }
  
  showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
  }
  
  showMainApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    // Update navigation based on user role
    this.updateNavigation();
  }
  
  updateNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    
    if (this.currentUser.role === 'teacher') {
      // Add teacher-specific navigation items
      const analyticsLink = document.createElement('a');
      analyticsLink.href = '#analytics';
      analyticsLink.className = 'nav-link';
      analyticsLink.textContent = '📊 Analytics';
      
      const studentsLink = document.createElement('a');
      studentsLink.href = '#students';
      studentsLink.className = 'nav-link';
      studentsLink.textContent = '👥 Students';
      
      navMenu.insertBefore(analyticsLink, navMenu.lastElementChild);
      navMenu.insertBefore(studentsLink, navMenu.lastElementChild);
    }
  }
  
  showError(message) {
    const errorEl = document.getElementById('error-message');
    const textEl = errorEl.querySelector('.error-text');
    textEl.textContent = message;
    errorEl.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideError();
    }, 5000);
  }
  
  hideError() {
    document.getElementById('error-message').classList.add('hidden');
  }
  
  showSuccess(message) {
    const successEl = document.getElementById('success-message');
    const textEl = successEl.querySelector('.success-text');
    textEl.textContent = message;
    successEl.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideSuccess();
    }, 3000);
  }
  
  hideSuccess() {
    document.getElementById('success-message').classList.add('hidden');
  }
  
  showOfflineIndicator() {
    document.getElementById('offline-indicator').classList.remove('hidden');
  }
  
  hideOfflineIndicator() {
    document.getElementById('offline-indicator').classList.add('hidden');
  }
  
  async syncOfflineData() {
    // Sync offline progress and scores when coming back online
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_OFFLINE_DATA'
      });
    }
  }
  
  async initializeI18n() {
    // Initialize internationalization
    const lang = this.currentUser?.preferred_language || 'english';
    await window.i18n.setLanguage(lang);
  }
  
  async changeLanguage(language) {
    try {
      await window.i18n.setLanguage(language);
      
      // Update user preference if logged in
      if (this.currentUser) {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ preferred_language: language })
        });
        
        this.currentUser.preferred_language = language;
      }
      
      // Reload current page to apply translations
      this.loadPage(this.currentPage, false);
      
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }
}

// Global logout function
window.logout = function() {
  localStorage.removeItem('authToken');
  sessionStorage.clear();
  window.location.reload();
};

// Global error handlers
window.hideError = function() {
  window.app.hideError();
};

window.hideSuccess = function() {
  window.app.hideSuccess();
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new RuralEducationApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuralEducationApp;
}
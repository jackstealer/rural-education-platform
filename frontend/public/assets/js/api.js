// API Client for Rural Education Platform
class APIClient {
  constructor() {
    this.baseURL = '/api';
    this.authToken = localStorage.getItem('authToken');
  }
  
  // Set authentication token
  setAuthToken(token) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }
  
  // Get default headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (includeAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }
  
  // Generic request method with error handling and offline support
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.setAuthToken(null);
          throw new Error('Authentication required');
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      // Handle offline scenarios
      if (!navigator.onLine) {
        console.log('Offline - attempting to use cached data');
        return this.getCachedData(endpoint) || { error: 'Offline and no cached data available' };
      }
      
      throw error;
    }
  }
  
  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
  
  // Authentication endpoints
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password })
    });
    
    if (response.token) {
      this.setAuthToken(response.token);
    }
    
    return response;
  }
  
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(userData)
    });
    
    if (response.token) {
      this.setAuthToken(response.token);
    }
    
    return response;
  }
  
  async getProfile() {
    return this.get('/auth/profile');
  }
  
  async updateProfile(data) {
    return this.put('/auth/profile', data);
  }
  
  async validateToken() {
    return this.get('/auth/validate');
  }
  
  // Student endpoints
  async getStudentDashboard() {
    return this.get('/students/dashboard');
  }
  
  async getSubjects() {
    return this.get('/students/subjects');
  }
  
  async getSubjectDetails(subject) {
    return this.get(`/students/subjects/${subject}`);
  }
  
  async updateProgress(progressData) {
    // Store offline if not connected
    if (!navigator.onLine) {
      await this.storeOfflineProgress(progressData);
      return { message: 'Progress saved offline', offline: true };
    }
    
    return this.post('/students/progress', progressData);
  }
  
  async getAchievements() {
    return this.get('/students/achievements');
  }
  
  async getLeaderboard(subject = null, limit = 10) {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    params.append('limit', limit);
    
    return this.get(`/students/leaderboard?${params}`);
  }
  
  async getUserPoints() {
    return this.get('/students/points');
  }
  
  // Games endpoints
  async getGames(subject = null) {
    const params = subject ? `?subject=${subject}` : '';
    return this.get(`/games${params}`);
  }
  
  async getGameConfig(subject, gameId) {
    return this.get(`/games/${subject}/${gameId}`);
  }
  
  async submitGameScore(subject, gameId, scoreData) {
    // Store offline if not connected
    if (!navigator.onLine) {
      await this.storeOfflineScore(subject, gameId, scoreData);
      return { message: 'Score saved offline', offline: true };
    }
    
    return this.post(`/games/${subject}/${gameId}/score`, scoreData);
  }
  
  async getGameLeaderboard(subject, gameId, limit = 10) {
    return this.get(`/games/${subject}/${gameId}/leaderboard?limit=${limit}`);
  }
  
  async getGameStats(subject = null) {
    const params = subject ? `?subject=${subject}` : '';
    return this.get(`/games/stats${params}`);
  }
  
  // Teacher endpoints
  async getTeacherDashboard() {
    return this.get('/teachers/dashboard');
  }
  
  async getTeacherClasses() {
    return this.get('/teachers/classes');
  }
  
  async createClass(classData) {
    return this.post('/teachers/classes', classData);
  }
  
  async getClassStudents(classId) {
    return this.get(`/teachers/classes/${classId}/students`);
  }
  
  async getStudentAnalytics(subject = null, timeframe = 30) {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    params.append('timeframe', timeframe);
    
    return this.get(`/teachers/analytics/students?${params}`);
  }
  
  async getSubjectAnalytics() {
    return this.get('/teachers/analytics/subjects');
  }
  
  async getEngagementAnalytics(days = 30) {
    return this.get(`/teachers/analytics/engagement?days=${days}`);
  }
  
  async getStudentProgress(studentId) {
    return this.get(`/teachers/students/${studentId}/progress`);
  }
  
  // Offline data management
  async storeOfflineProgress(progressData) {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['offline_progress'], 'readwrite');
      const store = tx.objectStore('offline_progress');
      
      await store.add({
        progressData,
        token: this.authToken,
        timestamp: Date.now()
      });
      
      console.log('Progress stored offline');
    } catch (error) {
      console.error('Failed to store offline progress:', error);
    }
  }
  
  async storeOfflineScore(subject, gameId, scoreData) {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['offline_scores'], 'readwrite');
      const store = tx.objectStore('offline_scores');
      
      await store.add({
        subject,
        gameId,
        scoreData,
        token: this.authToken,
        timestamp: Date.now()
      });
      
      console.log('Score stored offline');
    } catch (error) {
      console.error('Failed to store offline score:', error);
    }
  }
  
  async getCachedData(endpoint) {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['content_cache'], 'readonly');
      const store = tx.objectStore('content_cache');
      
      const cached = await store.get(endpoint);
      if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
        return cached.data;
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
    }
    
    return null;
  }
  
  async cacheData(endpoint, data) {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['content_cache'], 'readwrite');
      const store = tx.objectStore('content_cache');
      
      await store.put({
        url: endpoint,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }
  
  async openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RuralEducationDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('offline_progress')) {
          const progressStore = db.createObjectStore('offline_progress', { keyPath: 'id', autoIncrement: true });
          progressStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('offline_scores')) {
          const scoresStore = db.createObjectStore('offline_scores', { keyPath: 'id', autoIncrement: true });
          scoresStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('user_data')) {
          const userStore = db.createObjectStore('user_data', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('content_cache')) {
          const contentStore = db.createObjectStore('content_cache', { keyPath: 'url' });
          contentStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  // Sync offline data when back online
  async syncOfflineData() {
    if (!navigator.onLine) return;
    
    try {
      const db = await this.openIndexedDB();
      
      // Sync progress data
      const progressTx = db.transaction(['offline_progress'], 'readwrite');
      const progressStore = progressTx.objectStore('offline_progress');
      const progressData = await progressStore.getAll();
      
      for (const item of progressData) {
        try {
          await this.post('/students/progress', item.progressData);
          await progressStore.delete(item.id);
          console.log('Synced offline progress');
        } catch (error) {
          console.error('Failed to sync progress:', error);
        }
      }
      
      // Sync score data
      const scoresTx = db.transaction(['offline_scores'], 'readwrite');
      const scoresStore = scoresTx.objectStore('offline_scores');
      const scoresData = await scoresStore.getAll();
      
      for (const item of scoresData) {
        try {
          await this.post(`/games/${item.subject}/${item.gameId}/score`, item.scoreData);
          await scoresStore.delete(item.id);
          console.log('Synced offline score');
        } catch (error) {
          console.error('Failed to sync score:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }
  
  // Content pre-loading for offline use
  async preloadContent() {
    try {
      // Pre-load essential data
      const endpoints = [
        '/students/subjects',
        '/students/achievements',
        '/games'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const data = await this.get(endpoint);
          await this.cacheData(endpoint, data);
          console.log(`Cached: ${endpoint}`);
        } catch (error) {
          console.error(`Failed to cache ${endpoint}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to preload content:', error);
    }
  }
}

// Create global API client instance
window.apiClient = new APIClient();

// Sync offline data when coming back online
window.addEventListener('online', () => {
  window.apiClient.syncOfflineData();
});

// Preload content when app loads
window.addEventListener('load', () => {
  if (window.apiClient.authToken) {
    window.apiClient.preloadContent();
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}
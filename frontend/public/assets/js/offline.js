// Offline functionality and service worker integration
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingSync = [];
    this.offlineQueue = [];
    
    this.init();
  }
  
  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleOnline();
    });
    
    window.addEventListener('offline', () => {
      this.handleOffline();
    });
    
    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
    
    // Setup background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.setupBackgroundSync();
    }
    
    // Setup periodic sync for cached content
    this.setupPeriodicSync();
  }
  
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration.scope);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateAvailable();
          }
        });
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  
  setupBackgroundSync() {
    // Register for background sync when data needs to be synced
    window.addEventListener('beforeunload', () => {
      if (this.pendingSync.length > 0) {
        navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('background-sync-progress');
          registration.sync.register('background-sync-scores');
        });
      }
    });
  }
  
  setupPeriodicSync() {
    // Sync data every 5 minutes when online
    setInterval(() => {
      if (this.isOnline) {
        this.syncPendingData();
      }
    }, 5 * 60 * 1000);
  }
  
  handleOnline() {
    console.log('Connection restored');
    this.isOnline = true;
    
    // Hide offline indicator
    this.hideOfflineIndicator();
    
    // Sync pending data
    this.syncPendingData();
    
    // Show success message
    this.showConnectionMessage('You are back online! 🌐', 'success');
  }
  
  handleOffline() {
    console.log('Connection lost');
    this.isOnline = false;
    
    // Show offline indicator
    this.showOfflineIndicator();
    
    // Show offline message
    this.showConnectionMessage('You are now offline. Some features may be limited. 📡', 'warning');
  }
  
  async syncPendingData() {
    if (!this.isOnline || !window.apiClient) return;
    
    try {
      // Sync API client offline data
      await window.apiClient.syncOfflineData();
      
      // Clear pending sync queue
      this.pendingSync = [];
      
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }
  
  // Queue action for offline execution
  queueOfflineAction(action) {
    this.offlineQueue.push({
      ...action,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });
    
    this.pendingSync.push(action.id);
    
    // Save to IndexedDB for persistence
    this.saveOfflineQueue();
  }
  
  async saveOfflineQueue() {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['offline_queue'], 'readwrite');
      const store = tx.objectStore('offline_queue');
      
      // Clear existing queue
      await store.clear();
      
      // Save current queue
      for (const action of this.offlineQueue) {
        await store.add(action);
      }
      
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }
  
  async loadOfflineQueue() {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['offline_queue'], 'readonly');
      const store = tx.objectStore('offline_queue');
      
      const queue = await store.getAll();
      this.offlineQueue = queue;
      this.pendingSync = queue.map(item => item.id);
      
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }
  
  // Download content for offline use
  async downloadContentForOffline(contentType, contentId) {
    try {
      let content = null;
      
      switch (contentType) {
        case 'subject':
          content = await window.apiClient.getSubjectDetails(contentId);
          break;
        case 'game':
          const [subject, gameId] = contentId.split('/');
          content = await window.apiClient.getGameConfig(subject, gameId);
          break;
        case 'achievements':
          content = await window.apiClient.getAchievements();
          break;
      }
      
      if (content) {
        await this.storeOfflineContent(contentType, contentId, content);
        this.showConnectionMessage(`${contentType} downloaded for offline use! 📱`, 'success');
        return true;
      }
      
    } catch (error) {
      console.error('Failed to download content:', error);
      this.showConnectionMessage('Failed to download content for offline use', 'error');
      return false;
    }
  }
  
  async storeOfflineContent(type, id, content) {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['offline_content'], 'readwrite');
      const store = tx.objectStore('offline_content');
      
      await store.put({
        type,
        id,
        content,
        downloadedAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
    } catch (error) {
      console.error('Failed to store offline content:', error);
    }
  }
  
  async getOfflineContent(type, id) {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['offline_content'], 'readonly');
      const store = tx.objectStore('offline_content');
      
      const item = await store.get(`${type}:${id}`);
      
      if (item && item.expiresAt > Date.now()) {
        return item.content;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get offline content:', error);
      return null;
    }
  }
  
  async getAvailableOfflineContent() {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['offline_content'], 'readonly');
      const store = tx.objectStore('offline_content');
      
      const allContent = await store.getAll();
      
      // Filter out expired content
      const validContent = allContent.filter(item => item.expiresAt > Date.now());
      
      return validContent.map(item => ({
        type: item.type,
        id: item.id,
        downloadedAt: item.downloadedAt
      }));
      
    } catch (error) {
      console.error('Failed to get available offline content:', error);
      return [];
    }
  }
  
  // Cleanup expired offline content
  async cleanupOfflineContent() {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction(['offline_content'], 'readwrite');
      const store = tx.objectStore('offline_content');
      
      const allContent = await store.getAll();
      const now = Date.now();
      
      for (const item of allContent) {
        if (item.expiresAt <= now) {
          await store.delete(item.id);
        }
      }
      
      console.log('Offline content cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup offline content:', error);
    }
  }
  
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RuralEducationOfflineDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('offline_content')) {
          const contentStore = db.createObjectStore('offline_content', { keyPath: 'id' });
          contentStore.createIndex('type', 'type', { unique: false });
          contentStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('cached_responses')) {
          const responseStore = db.createObjectStore('cached_responses', { keyPath: 'url' });
          responseStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  showOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.classList.remove('hidden');
    }
  }
  
  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.classList.add('hidden');
    }
  }
  
  showConnectionMessage(message, type = 'info') {
    if (window.app) {
      if (type === 'success') {
        window.app.showSuccess(message);
      } else if (type === 'error') {
        window.app.showError(message);
      } else {
        // For info/warning, use a temporary notification
        this.showTemporaryMessage(message, type);
      }
    }
  }
  
  showTemporaryMessage(message, type) {
    const notification = document.createElement('div');
    notification.className = `connection-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'warning' ? '#ff9800' : '#2196f3'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1001;
      animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease forwards';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
  
  showUpdateAvailable() {
    const updateBanner = document.createElement('div');
    updateBanner.id = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <span>📱 A new version of the app is available!</span>
        <button onclick="offlineManager.applyUpdate()">Update Now</button>
        <button onclick="offlineManager.dismissUpdate()">Later</button>
      </div>
    `;
    updateBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #4caf50;
      color: white;
      padding: 12px;
      z-index: 1002;
      text-align: center;
    `;
    
    document.body.prepend(updateBanner);
  }
  
  async applyUpdate() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }
  
  dismissUpdate() {
    const banner = document.getElementById('update-banner');
    if (banner) {
      banner.remove();
    }
  }
  
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.url);
        break;
      case 'OFFLINE_READY':
        this.showConnectionMessage('App is ready for offline use! 📱', 'success');
        break;
      case 'SYNC_COMPLETE':
        console.log('Background sync completed');
        break;
    }
  }
  
  // Get offline status
  isOffline() {
    return !this.isOnline;
  }
  
  // Get pending sync count
  getPendingSyncCount() {
    return this.pendingSync.length;
  }
}

// Create global offline manager instance
window.offlineManager = new OfflineManager();

// Load offline queue on startup
document.addEventListener('DOMContentLoaded', () => {
  window.offlineManager.loadOfflineQueue();
  
  // Cleanup old content periodically
  setTimeout(() => {
    window.offlineManager.cleanupOfflineContent();
  }, 5000);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineManager;
}
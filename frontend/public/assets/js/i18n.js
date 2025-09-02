// Internationalization (i18n) System
class I18nManager {
  constructor() {
    this.currentLanguage = 'english';
    this.translations = {};
    this.fallbackLanguage = 'english';
    
    this.loadTranslations();
  }
  
  async loadTranslations() {
    // Default English translations
    this.translations.english = {
      // Navigation
      dashboard: 'Dashboard',
      subjects: 'Subjects',
      games: 'Games',
      achievements: 'Achievements',
      profile: 'Profile',
      analytics: 'Analytics',
      students: 'Students',
      logout: 'Logout',
      
      // Common UI
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      close: 'Close',
      next: 'Next',
      previous: 'Previous',
      continue: 'Continue',
      finish: 'Finish',
      
      // Authentication
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      fullName: 'Full Name',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      rememberMe: 'Remember Me',
      welcomeBack: 'Welcome Back!',
      joinAdventure: 'Join the Adventure!',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      
      // Roles and User Info
      student: 'Student',
      teacher: 'Teacher',
      admin: 'Admin',
      gradeLevel: 'Grade Level',
      schoolName: 'School Name',
      preferredLanguage: 'Preferred Language',
      
      // Subjects
      physics: 'Physics',
      chemistry: 'Chemistry',
      mathematics: 'Mathematics',
      math: 'Math',
      biology: 'Biology',
      
      // Dashboard
      totalPoints: 'Total Points',
      currentLevel: 'Current Level',
      dayStreak: 'Day Streak',
      rank: 'Rank',
      subjectProgress: 'Subject Progress',
      recentAchievements: 'Recent Achievements',
      quickActions: 'Quick Actions',
      continuelearning: 'Continue Learning',
      playGames: 'Play Games',
      viewAchievements: 'View Achievements',
      editProfile: 'Edit Profile',
      
      // Progress and Stats
      completed: 'Completed',
      inProgress: 'In Progress',
      notStarted: 'Not Started',
      score: 'Score',
      timeSpent: 'Time Spent',
      attempts: 'Attempts',
      averageScore: 'Average Score',
      completion: 'Completion',
      
      // Games
      play: 'Play',
      playAgain: 'Play Again',
      gameOver: 'Game Over',
      youWin: 'You Win!',
      youLose: 'You Lose!',
      highScore: 'High Score',
      bestTime: 'Best Time',
      level: 'Level',
      points: 'Points',
      
      // Achievements
      earned: 'Earned',
      notEarned: 'Not Earned',
      newAchievement: 'New Achievement!',
      congratulations: 'Congratulations!',
      keepGoing: 'Keep going!',
      
      // Messages
      success: 'Success!',
      error: 'Error!',
      warning: 'Warning!',
      info: 'Info',
      offline: 'Offline',
      online: 'Online',
      connecting: 'Connecting...',
      syncingData: 'Syncing data...',
      
      // Offline messages
      offlineMode: 'Offline Mode',
      workingOffline: "You're working offline",
      dataWillSync: 'Your data will sync when you reconnect',
      offlineContentAvailable: 'Offline content is available',
      noOfflineContent: 'No offline content available',
      
      // Time units
      seconds: 'seconds',
      minutes: 'minutes',
      hours: 'hours',
      days: 'days',
      weeks: 'weeks',
      months: 'months',
      
      // Numbers
      thousand: 'K',
      million: 'M',
      billion: 'B',
      
      // Common phrases
      loading_adventure: 'Loading your learning adventure...',
      welcome_message: 'Welcome to Rural Education Platform',
      offline_learning: 'Learn even when offline',
      interactive_games: 'Interactive STEM games',
      track_progress: 'Track your progress',
      earn_achievements: 'Earn achievements and badges'
    };
    
    // Hindi translations
    this.translations.hindi = {
      // Navigation
      dashboard: 'डैशबोर्ड',
      subjects: 'विषय',
      games: 'खेल',
      achievements: 'उपलब्धियां',
      profile: 'प्रोफ़ाइल',
      analytics: 'विश्लेषण',
      students: 'छात्र',
      logout: 'लॉगआउट',
      
      // Common UI
      loading: 'लोड हो रहा है...',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      edit: 'संपादित करें',
      delete: 'हटाएं',
      confirm: 'पुष्टि करें',
      yes: 'हां',
      no: 'नहीं',
      ok: 'ठीक',
      close: 'बंद करें',
      next: 'अगला',
      previous: 'पिछला',
      continue: 'जारी रखें',
      finish: 'समाप्त',
      
      // Authentication
      login: 'लॉगिन',
      register: 'पंजीकरण',
      email: 'ईमेल',
      password: 'पासवर्ड',
      username: 'उपयोगकर्ता नाम',
      fullName: 'पूरा नाम',
      confirmPassword: 'पासवर्ड की पुष्टि करें',
      forgotPassword: 'पासवर्ड भूल गए?',
      rememberMe: 'मुझे याद रखें',
      welcomeBack: 'वापसी पर स्वागत है!',
      joinAdventure: 'साहसिक यात्रा में शामिल हों!',
      createAccount: 'खाता बनाएं',
      
      // Roles and User Info
      student: 'छात्र',
      teacher: 'शिक्षक',
      admin: 'प्रशासक',
      gradeLevel: 'कक्षा स्तर',
      schoolName: 'स्कूल का नाम',
      preferredLanguage: 'पसंदीदा भाषा',
      
      // Subjects
      physics: 'भौतिक विज्ञान',
      chemistry: 'रसायन विज्ञान',
      mathematics: 'गणित',
      math: 'गणित',
      biology: 'जीव विज्ञान',
      
      // Dashboard
      totalPoints: 'कुल अंक',
      currentLevel: 'वर्तमान स्तर',
      dayStreak: 'दिन की लकीर',
      rank: 'श्रेणी',
      subjectProgress: 'विषय प्रगति',
      recentAchievements: 'हाल की उपलब्धियां',
      quickActions: 'त्वरित कार्य',
      continuelearning: 'सीखना जारी रखें',
      playGames: 'खेल खेलें',
      viewAchievements: 'उपलब्धियां देखें',
      editProfile: 'प्रोफ़ाइल संपादित करें',
      
      // Messages
      success: 'सफलता!',
      error: 'त्रुटि!',
      warning: 'चेतावनी!',
      info: 'जानकारी',
      offline: 'ऑफ़लाइन',
      online: 'ऑनलाइन',
      
      // Common phrases
      loading_adventure: 'आपका शिक्षण साहसिक यात्रा लोड हो रहा है...',
      welcome_message: 'ग्रामीण शिक्षा मंच में आपका स्वागत है',
      offline_learning: 'ऑफ़लाइन होकर भी सीखें',
      interactive_games: 'इंटरैक्टिव STEM खेल',
      track_progress: 'अपनी प्रगति ट्रैक करें',
      earn_achievements: 'उपलब्धियां और बैज अर्जित करें'
    };
    
    // Regional language (example: can be customized for specific regions)
    this.translations.regional = {
      // This would be customized based on the specific regional language
      // For now, using English as placeholder
      ...this.translations.english,
      
      // Add region-specific terms
      welcome_message: 'स्थानीय शिक्षा मंच में आपका स्वागत है',
      // More regional translations would be added here
    };
  }
  
  // Set the current language
  async setLanguage(language) {
    if (!this.translations[language]) {
      console.warn(`Language ${language} not found, falling back to ${this.fallbackLanguage}`);
      language = this.fallbackLanguage;
    }
    
    this.currentLanguage = language;
    
    // Update HTML lang attribute
    document.documentElement.lang = this.getLanguageCode(language);
    
    // Update direction for RTL languages if needed
    document.documentElement.dir = this.getTextDirection(language);
    
    // Store language preference
    localStorage.setItem('preferredLanguage', language);
    
    // Translate the page
    this.translatePage();
    
    // Update language selector
    this.updateLanguageSelector();
    
    return true;
  }
  
  // Get translation for a key
  t(key, params = {}) {
    const translation = this.translations[this.currentLanguage]?.[key] 
      || this.translations[this.fallbackLanguage]?.[key] 
      || key;
    
    // Replace parameters in translation
    return this.interpolate(translation, params);
  }
  
  // Interpolate parameters into translation string
  interpolate(text, params) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }
  
  // Get language code for HTML lang attribute
  getLanguageCode(language) {
    const codes = {
      english: 'en',
      hindi: 'hi',
      regional: 'en' // Default to English, would be customized
    };
    return codes[language] || 'en';
  }
  
  // Get text direction
  getTextDirection(language) {
    // Most Indian languages are LTR, but this can be customized
    const rtlLanguages = ['arabic', 'urdu']; // Add RTL languages as needed
    return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
  }
  
  // Translate the entire page
  translatePage() {
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
        element.value = translation;
      } else if (element.hasAttribute('placeholder')) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    // Translate elements with data-i18n-html attribute (for HTML content)
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      const translation = this.t(key);
      element.innerHTML = translation;
    });
    
    // Translate title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = this.t(key);
      element.title = translation;
    });
  }
  
  // Update language selector to reflect current language
  updateLanguageSelector() {
    const selector = document.getElementById('language-switch');
    if (selector) {
      selector.value = this.currentLanguage;
    }
  }
  
  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  // Get available languages
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }
  
  // Format numbers according to language/locale
  formatNumber(number, options = {}) {
    const locales = {
      english: 'en-US',
      hindi: 'hi-IN',
      regional: 'hi-IN' // Default to Indian format
    };
    
    const locale = locales[this.currentLanguage] || 'en-US';
    
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      console.warn('Number formatting failed:', error);
      return number.toString();
    }
  }
  
  // Format dates according to language/locale
  formatDate(date, options = {}) {
    const locales = {
      english: 'en-US',
      hindi: 'hi-IN',
      regional: 'hi-IN'
    };
    
    const locale = locales[this.currentLanguage] || 'en-US';
    
    try {
      return new Intl.DateTimeFormat(locale, options).format(new Date(date));
    } catch (error) {
      console.warn('Date formatting failed:', error);
      return new Date(date).toLocaleDateString();
    }
  }
  
  // Format relative time (e.g., "2 days ago")
  formatRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return this.t('today');
    } else if (diffDays === 1) {
      return this.t('yesterday');
    } else if (diffDays < 7) {
      return this.t('daysAgo', { count: diffDays });
    } else {
      return this.formatDate(date);
    }
  }
  
  // Add new translations dynamically
  addTranslations(language, translations) {
    if (!this.translations[language]) {
      this.translations[language] = {};
    }
    
    Object.assign(this.translations[language], translations);
  }
  
  // Load language from user preference or browser
  loadUserLanguage() {
    // Try to load from localStorage first
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && this.translations[savedLanguage]) {
      return savedLanguage;
    }
    
    // Try to detect from browser language
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('hi')) {
      return 'hindi';
    }
    
    // Default to English
    return 'english';
  }
}

// Create global i18n instance
window.i18n = new I18nManager();

// Initialize with user's preferred language
document.addEventListener('DOMContentLoaded', () => {
  const userLanguage = window.i18n.loadUserLanguage();
  window.i18n.setLanguage(userLanguage);
});

// Helper function for easy translation access
window.t = function(key, params) {
  return window.i18n.t(key, params);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nManager;
}
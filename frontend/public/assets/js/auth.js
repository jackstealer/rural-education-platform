// Authentication functionality
class AuthManager {
  constructor() {
    this.setupAuthEventListeners();
  }
  
  setupAuthEventListeners() {
    // Tab switching
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('auth-tab')) {
        this.switchAuthTab(e.target.dataset.tab);
      }
    });
    
    // Form submissions
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin(e.target);
      });
    }
    
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister(e.target);
      });
      
      // Role change handler
      const roleSelect = document.getElementById('register-role');
      if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
          this.toggleGradeLevel(e.target.value);
        });
      }
    }
  }
  
  switchAuthTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.add('hidden');
    });
    document.getElementById(`${tab}-form`).classList.remove('hidden');
  }
  
  toggleGradeLevel(role) {
    const gradeGroup = document.getElementById('grade-level-group');
    const gradeSelect = document.getElementById('register-grade');
    
    if (role === 'student') {
      gradeGroup.classList.remove('hidden');
      gradeSelect.required = true;
    } else {
      gradeGroup.classList.add('hidden');
      gradeSelect.required = false;
      gradeSelect.value = '';
    }
  }
  
  async handleLogin(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
      this.setFormLoading(form, true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Store token
        localStorage.setItem('authToken', result.token);
        
        // Show success message
        window.app.showSuccess('Login successful! Welcome back!');
        
        // Load user data and show main app
        window.app.authToken = result.token;
        window.app.currentUser = result.user;
        
        // Hide auth screen and show main app
        setTimeout(() => {
          window.app.showMainApp();
          window.app.loadPage('dashboard');
        }, 1000);
        
      } else {
        this.showFormError(form, result.error || 'Login failed');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      this.showFormError(form, 'Network error. Please check your connection.');
    } finally {
      this.setFormLoading(form, false);
    }
  }
  
  async handleRegister(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate form
    const validation = this.validateRegistrationForm(data);
    if (!validation.valid) {
      this.showFormError(form, validation.message);
      return;
    }
    
    try {
      this.setFormLoading(form, true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Store token
        localStorage.setItem('authToken', result.token);
        
        // Show success message
        window.app.showSuccess('Registration successful! Welcome to Rural Education Platform!');
        
        // Load user data and show main app
        window.app.authToken = result.token;
        window.app.currentUser = result.user;
        
        // Hide auth screen and show main app
        setTimeout(() => {
          window.app.showMainApp();
          window.app.loadPage('dashboard');
        }, 1000);
        
      } else {
        if (result.details && Array.isArray(result.details)) {
          const errorMessage = result.details.map(d => d.msg).join(', ');
          this.showFormError(form, errorMessage);
        } else {
          this.showFormError(form, result.error || 'Registration failed');
        }
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      this.showFormError(form, 'Network error. Please check your connection.');
    } finally {
      this.setFormLoading(form, false);
    }
  }
  
  validateRegistrationForm(data) {
    if (!data.role) {
      return { valid: false, message: 'Please select your role (Student or Teacher)' };
    }
    
    if (!data.full_name || data.full_name.length < 2) {
      return { valid: false, message: 'Full name must be at least 2 characters long' };
    }
    
    if (!data.username || data.username.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters long' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    
    if (!data.email || !this.isValidEmail(data.email)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    
    if (!data.password || data.password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    
    if (data.role === 'student' && !data.grade_level) {
      return { valid: false, message: 'Please select your grade level' };
    }
    
    return { valid: true };
  }
  
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  setFormLoading(form, loading) {
    if (loading) {
      form.classList.add('loading');
      form.querySelector('button[type="submit"]').disabled = true;
    } else {
      form.classList.remove('loading');
      form.querySelector('button[type="submit"]').disabled = false;
    }
  }
  
  showFormError(form, message) {
    // Remove existing error
    const existingError = form.querySelector('.error-text');
    if (existingError) {
      existingError.remove();
    }
    
    // Add new error
    const errorEl = document.createElement('div');
    errorEl.className = 'error-text';
    errorEl.textContent = message;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(errorEl, submitBtn);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorEl.remove();
    }, 5000);
  }
}

// Demo account filling
window.fillDemo = function(type) {
  if (type === 'student') {
    document.getElementById('login-email').value = 'student@demo.com';
    document.getElementById('login-password').value = 'demo123';
  } else if (type === 'teacher') {
    document.getElementById('login-email').value = 'teacher@demo.com';
    document.getElementById('login-password').value = 'demo123';
  }
};

// Auto-create demo accounts function (for development)
window.createDemoAccounts = async function() {
  const demoAccounts = [
    {
      username: 'student_demo',
      email: 'student@demo.com',
      password: 'demo123',
      role: 'student',
      full_name: 'Demo Student',
      grade_level: 10,
      school_name: 'Demo Rural School',
      preferred_language: 'english'
    },
    {
      username: 'teacher_demo',
      email: 'teacher@demo.com',
      password: 'demo123',
      role: 'teacher',
      full_name: 'Demo Teacher',
      school_name: 'Demo Rural School',
      preferred_language: 'english'
    }
  ];
  
  for (const account of demoAccounts) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(account)
      });
      
      if (response.ok) {
        console.log(`Demo account created: ${account.email}`);
      } else {
        const error = await response.json();
        console.log(`Demo account exists or error: ${account.email}`, error.error);
      }
    } catch (error) {
      console.error('Error creating demo account:', error);
    }
  }
};

// Password strength checker
function checkPasswordStrength(password) {
  let strength = 0;
  let feedback = [];
  
  if (password.length >= 8) strength++;
  else feedback.push('At least 8 characters');
  
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  else feedback.push('Mix of uppercase and lowercase');
  
  if (/\d/.test(password)) strength++;
  else feedback.push('At least one number');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  else feedback.push('At least one special character');
  
  const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return {
    level: levels[strength] || 'Very Weak',
    score: strength,
    feedback: feedback
  };
}

// Add password strength indicator
document.addEventListener('DOMContentLoaded', () => {
  const authManager = new AuthManager();
  
  const passwordInput = document.getElementById('register-password');
  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      const strength = checkPasswordStrength(e.target.value);
      
      // Remove existing strength indicator
      let indicator = document.getElementById('password-strength');
      if (indicator) {
        indicator.remove();
      }
      
      if (e.target.value.length > 0) {
        // Create strength indicator
        indicator = document.createElement('div');
        indicator.id = 'password-strength';
        indicator.className = `password-strength strength-${strength.score}`;
        indicator.innerHTML = `
          <div class="strength-bar">
            <div class="strength-fill" style="width: ${(strength.score / 4) * 100}%"></div>
          </div>
          <div class="strength-text">Password strength: ${strength.level}</div>
        `;
        
        // Add CSS for strength indicator
        if (!document.getElementById('password-strength-css')) {
          const style = document.createElement('style');
          style.id = 'password-strength-css';
          style.textContent = `
            .password-strength {
              margin-top: 0.5rem;
              font-size: 0.8rem;
            }
            .strength-bar {
              height: 4px;
              background-color: #e0e0e0;
              border-radius: 2px;
              overflow: hidden;
              margin-bottom: 0.25rem;
            }
            .strength-fill {
              height: 100%;
              transition: width 0.3s ease, background-color 0.3s ease;
            }
            .strength-0 .strength-fill { background-color: #f44336; }
            .strength-1 .strength-fill { background-color: #ff9800; }
            .strength-2 .strength-fill { background-color: #ffc107; }
            .strength-3 .strength-fill { background-color: #8bc34a; }
            .strength-4 .strength-fill { background-color: #4caf50; }
            .strength-text {
              color: var(--text-secondary);
            }
          `;
          document.head.appendChild(style);
        }
        
        passwordInput.parentNode.appendChild(indicator);
      }
    });
  }
  
  // Create demo accounts automatically in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => {
      window.createDemoAccounts();
    }, 2000);
  }
});
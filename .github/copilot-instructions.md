# Rural Education Platform - GitHub Copilot Instructions

**Rural Education Platform** is a gamified learning platform designed for rural education environments. This repository is currently in its initial state and requires bootstrapping from scratch.

**CRITICAL:** Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the information here.

## Repository State

**IMPORTANT:** This repository is currently minimal, containing only a README.md file. The codebase needs to be built from scratch.

## Technology Stack Recommendations

For a rural education platform, consider these validated technology stacks:

### Option 1: React/Node.js Web Application (Recommended)
- **Frontend:** React with TypeScript, Tailwind CSS for responsive design
- **Backend:** Node.js with Express.js, MongoDB or PostgreSQL
- **Real-time features:** Socket.io for collaborative learning
- **PWA capabilities:** For offline access in rural areas with poor connectivity

### Option 2: Python/Django Education Platform  
- **Backend:** Django with PostgreSQL
- **Frontend:** Django templates with Alpine.js or React
- **Learning Management:** Django CMS or custom content management

### Option 3: Full-Stack JavaScript with Next.js
- **Framework:** Next.js for SSR/SSG capabilities
- **Database:** Prisma with PostgreSQL or MongoDB
- **Authentication:** NextAuth.js
- **Deployment:** Vercel or self-hosted

## Bootstrapping Instructions

### Prerequisites Installation
Run these commands to set up your development environment:

```bash
# Install Node.js (Required for most web development)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and pip (for Django option)
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv

# Install Docker (for containerized development)
sudo apt-get install -y docker.io docker-compose

# Verify installations
node --version
npm --version
python3 --version
docker --version
```

### Project Initialization Commands

**NEVER CANCEL any build or installation commands - they may take 10-45 minutes to complete.**

#### For React/Node.js Stack:
```bash
# Initialize React frontend (Frontend setup - takes 2-3 minutes)
npx create-react-app frontend --template typescript
cd frontend
npm install @types/react @types/react-dom tailwindcss
npm install axios socket.io-client
# Build takes 8-15 seconds on first run. NEVER CANCEL. Set timeout to 5+ minutes.
npm run build

# Initialize Node.js backend
cd ..
mkdir backend
cd backend
npm init -y
npm install express mongoose socket.io cors dotenv
npm install -D nodemon @types/node typescript ts-node
# Installation takes 1-2 minutes. NEVER CANCEL.
```

**VALIDATED TIMINGS (React/CRA):**
- Project initialization: ~2 minutes
- Build time: ~8 seconds  
- Test execution: ~1 second
- **NOTE:** create-react-app is deprecated but still functional

#### For Django Stack:
```bash
# Create Python virtual environment (takes 1-2 seconds)
python3 -m venv venv
source venv/bin/activate
# Install Django and dependencies (takes 4-8 seconds. NEVER CANCEL)
pip install django djangorestframework django-cors-headers
pip install psycopg2-binary python-decouple
# Create Django project (takes <1 second)
django-admin startproject rural_education .
```

**VALIDATED TIMINGS (Django):**
- Virtual environment creation: ~1 second
- Dependencies installation: ~4 seconds
- Project creation: <1 second
- Database migrations: ~1 second

#### For Next.js Stack:
```bash
# Initialize Next.js project (takes 15-20 seconds. NEVER CANCEL. Set timeout to 5+ minutes)
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install prisma @prisma/client next-auth
npm install @types/node
# Build may fail due to network restrictions (Google Fonts). Set timeout to 10+ minutes.
npm run build
```

**VALIDATED TIMINGS (Next.js):**
- Project initialization: ~16 seconds
- Additional dependencies: ~17 seconds
- Build time: May fail due to external font loading in restricted environments
- **NOTE:** Build failures due to Google Fonts are expected in sandboxed environments

## Development Workflow

### Building and Running

**TIMING EXPECTATIONS:** 
- **Initial npm install:** 1-3 minutes. NEVER CANCEL. Set timeout to 10+ minutes.
- **First build (React):** 8-15 seconds. Set timeout to 5+ minutes.
- **First build (Next.js):** May fail due to network restrictions. Set timeout to 10+ minutes.
- **Django setup:** Under 10 seconds total. Set timeout to 2+ minutes.
- **Test runs:** 1-5 seconds to 2 minutes. NEVER CANCEL. Set timeout to 10+ minutes.

#### React/Node.js Development:
```bash
# Start backend server (from backend directory)
cd backend
npm run dev  # or node server.js

# Start frontend development server (from frontend directory)  
cd ../frontend
npm start  # Takes 30-60 seconds to start. Runs on http://localhost:3000

# Build production version (takes 8-15 seconds. NEVER CANCEL)
npm run build
```

#### Django Development:
```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations (takes 1-2 seconds on first run)
python manage.py migrate

# Start development server (starts immediately)
python manage.py runserver  # Runs on http://localhost:8000
```

#### Next.js Development:
```bash
# Development server (takes 30-60 seconds to start)
npm run dev  # Runs on http://localhost:3000

# Production build (takes 3-8 minutes. NEVER CANCEL. Set timeout to 20+ minutes)
npm run build
npm start
```

### Testing and Validation

#### Testing Commands:
```bash
# React testing (takes 1-2 seconds. NEVER CANCEL. Set timeout to 5+ minutes)
npm test -- --watchAll=false

# Django testing (takes <1 second for empty project. NEVER CANCEL. Set timeout to 5+ minutes)
python manage.py test

# Next.js testing (if Jest is configured)
npm run test
```

**VALIDATED TIMINGS:**
- **React tests:** ~1.4 seconds for default test suite
- **Django tests:** ~0.3 seconds (no tests found in fresh project)
- **Test output:** Both frameworks provide clear pass/fail feedback

#### Linting and Code Quality:
```bash
# React projects - ESLint not included by default in create-react-app
# Install ESLint manually if needed:
npm install --save-dev eslint

# Django projects - Use Python linting tools:
pip install black flake8
black .  # Auto-format Python code
flake8 .  # Check code style

# Next.js projects - ESLint included by default:
npm run lint
```

**NOTE:** create-react-app does not include a lint script by default. Available scripts are: start, test, build, eject.

## Manual Validation Scenarios

**CRITICAL:** Always perform these validation steps after making changes:

### Basic Application Functionality:
1. **Start the application** using the appropriate development server command
2. **Access the homepage** at http://localhost:3000 or http://localhost:8000
3. **Take a screenshot** to verify the application loads correctly
4. **Check browser console** for any JavaScript errors
5. **Test responsive design** by resizing the browser window

**VALIDATED SCENARIO - Django Default Page:**
- Django development server starts immediately 
- Default page shows "The install worked successfully! Congratulations!" with rocket icon
- Page loads at http://localhost:8000 without errors
- Screenshot validation confirms proper Django installation

### Education Platform Specific Tests:
1. **User Registration/Login Flow:**
   - Create a new user account
   - Log in with the test account
   - Verify authentication state
2. **Content Management:**
   - Create a sample lesson or course
   - Upload educational content (text/images)
   - Verify content displays correctly
3. **Interactive Features:**
   - Test any gamification elements (points, badges, progress tracking)
   - Verify real-time features if implemented
   - Test offline capabilities if PWA features are included

### Database Validation:
```bash
# For MongoDB (if using)
mongosh
show dbs
use rural_education
show collections

# For PostgreSQL (if using)
sudo -u postgres psql
\l
\c rural_education
\dt
```

## Common Development Tasks

### Database Setup:
```bash
# MongoDB installation (takes 3-5 minutes. NEVER CANCEL)
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

# PostgreSQL installation (takes 5-8 minutes. NEVER CANCEL)
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Environment Configuration:
Create a `.env` file in your project root:
```env
# Database
DATABASE_URL="your_database_connection_string"

# Authentication
JWT_SECRET="your_jwt_secret"
SESSION_SECRET="your_session_secret"

# API Keys (for external services)
CLOUDINARY_API_KEY="your_cloudinary_key"
SENDGRID_API_KEY="your_sendgrid_key"
```

### Deployment Preparation:
```bash
# Docker containerization (build takes 5-10 minutes. NEVER CANCEL. Set timeout to 20+ minutes)
docker build -t rural-education-platform .
docker run -p 3000:3000 rural-education-platform

# Production optimizations
npm run build  # NEVER CANCEL. Set timeout to 20+ minutes
npm run start
```

## Troubleshooting

### Common Issues:
- **Port conflicts:** Change ports in package.json or environment variables
- **Dependency conflicts:** Delete node_modules and package-lock.json, run npm install
- **Database connection issues:** Verify database service is running and credentials are correct
- **Build failures:** Ensure all dependencies are installed and Node.js version is compatible

### Known Issues in Sandboxed Environments:
- **Next.js Google Fonts errors:** Build may fail with "Failed to fetch `Geist` from Google Fonts" due to network restrictions
- **External CDN access:** Some external resources may be blocked in restricted environments
- **Font loading issues:** Use local fonts or configure offline font alternatives

### Workarounds for Network-Restricted Environments:
```bash
# For Next.js font issues, replace Google Fonts with local alternatives
# Edit next.config.js to disable external font optimization:
module.exports = {
  optimizeFonts: false,
}

# Use system fonts instead of Google Fonts in globals.css
```

### Performance Considerations for Rural Areas:
- Implement Progressive Web App (PWA) features for offline access
- Optimize images and assets for slow internet connections
- Use CDN for static assets
- Implement data caching strategies
- Consider SMS-based features for areas with limited internet

## File Structure (Once Bootstrapped)

```
rural-education-platform/
├── README.md
├── package.json
├── .env
├── .gitignore
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── styles/
├── backend/ (if separate backend)
├── docs/
└── tests/
```

## Current Repository State

**Repository Contents (at time of instruction creation):**
```bash
# Repository root:
.
├── .git/                    # Git repository data
├── .github/
│   └── copilot-instructions.md  # This file
└── README.md                # Basic project description

# README.md contents:
# rural-education-platform
Gamified Learning Platform for Rural Education - Hackathon Project
```

**Key Points:**
- Repository is in initial state with minimal content
- No existing codebase, build system, or dependencies
- Instructions provide bootstrapping guidance for multiple technology stacks
- All timing estimates are based on validated testing of the recommended setup commands

## Validation Checklist

Before committing changes, always:
- [ ] Run tests: `npm test -- --watchAll=false` or `python manage.py test` (NEVER CANCEL - takes 1-5 seconds to 2 minutes)
- [ ] Build the application: `npm run build` (NEVER CANCEL - React: ~8 seconds, Next.js: may fail due to network)
- [ ] Start the application and verify it loads without errors
- [ ] Test core user workflows (registration, login, content access)
- [ ] Take a screenshot of any UI changes
- [ ] Check responsive design on different screen sizes
- [ ] Verify offline functionality if PWA features are implemented
- [ ] Install linting tools manually if needed: `npm install --save-dev eslint` (React) or use built-in `npm run lint` (Next.js)

**React Projects:** No lint script by default - install ESLint manually if needed
**Django Projects:** Use `black .` and `flake8 .` for code quality
**Next.js Projects:** Use built-in `npm run lint`

## Important Notes

- **NEVER CANCEL long-running commands** - builds and tests may take 15-45 minutes
- **Always set timeouts of 30+ minutes** for build commands and 15+ minutes for test commands
- **Rural education considerations:** Prioritize offline capabilities, low bandwidth optimization, and mobile-first design
- **Accessibility:** Ensure platform works with screen readers and keyboard navigation
- **Multilingual support:** Consider internationalization for diverse rural communities
- **Content delivery:** Optimize for areas with limited internet connectivity

## Repository-Specific Commands Summary

Since this is a new repository, common commands will be:

### Validated Command Sequences (Choose one technology stack):

#### React/TypeScript Setup (VALIDATED - Works):
```bash
# Initial setup (~2 minutes total)
npx create-react-app . --template typescript  
npm install axios socket.io-client tailwindcss

# Development workflow
npm start     # ~30-60 seconds to start
npm test -- --watchAll=false  # ~1-2 seconds
npm run build # ~8 seconds
```

#### Django Setup (VALIDATED - Works):
```bash
# Initial setup (~10 seconds total)
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework django-cors-headers
django-admin startproject rural_education .

# Development workflow  
python manage.py migrate  # ~1 second
python manage.py runserver  # Starts immediately
python manage.py test      # ~0.3 seconds (empty project)
```

#### Next.js Setup (VALIDATED - Partial):
```bash
# Initial setup (~30 seconds total)
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install prisma @prisma/client next-auth

# Development workflow
npm run dev   # ~30-60 seconds to start  
npm run build # May fail due to Google Fonts in restricted environments
```

### Pre-validated System Requirements:
- Node.js v20.19.4 ✓
- npm v10.8.2 ✓  
- Python 3.12.3 ✓
- Docker v28.0.4 ✓

**Remember:** This platform serves rural communities - prioritize accessibility, offline functionality, and performance optimization for low-bandwidth environments.
# Development Guide

Complete guide for setting up and developing the Sidekick platform locally.

## 🚀 Quick Start

Get the entire stack running in 5 minutes:

### Prerequisites

- Python 3.8+
- Node.js 16+
- Git
- Expo CLI (`npm install -g @expo/cli`)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
cd ../mobile

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update API URL in .env (use your local IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api

# Start Expo development server
npm start
```

### Validation

Run the setup validation script:

```bash
bash validate-setup.sh
```

## 🏗️ Project Structure

### Backend (Django)

```
backend/
├── config/               # Django settings
│   ├── settings.py      # Main configuration
│   ├── urls.py          # URL routing
│   └── wsgi.py          # WSGI application
├── api/                 # Authentication app
│   ├── views.py         # Auth endpoints
│   ├── serializers.py   # JWT serializers
│   └── urls.py          # Auth routes
├── transactions/        # Main business logic
│   ├── models.py        # Data models
│   ├── views.py         # API endpoints
│   ├── serializers.py   # Data serialization
│   └── urls.py          # API routes
├── manage.py            # Django CLI
├── requirements.txt     # Python dependencies
└── .env.example         # Environment template
```

### Frontend (React Native)

```
mobile/
├── app/                 # Expo Router pages
│   ├── _layout.jsx      # Root layout
│   ├── index.jsx        # Auth routing
│   ├── auth.jsx         # Login/Register
│   └── (tabs)/          # Protected routes
├── components/          # Reusable components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── services/            # API services
├── constants/           # App constants
├── package.json         # Dependencies
└── .env.example         # Environment template
```

## 🔧 Development Workflow

### 1. Branching Strategy

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ...

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push branch
git push origin feature/new-feature

# Create pull request
```

### 2. Code Standards

#### Python (Backend)

- **Black**: Code formatting
- **isort**: Import sorting
- **flake8**: Linting
- **mypy**: Type checking (optional)

```bash
# Format code
black .

# Sort imports
isort .

# Lint code
flake8 .
```

#### JavaScript (Frontend)

- **Prettier**: Code formatting
- **ESLint**: Linting

```bash
# Format code
npx prettier --write .

# Lint code
npx eslint .
```

### 3. Testing

#### Backend Testing

```bash
cd backend

# Run all tests
python manage.py test

# Run specific app tests
python manage.py test transactions

# Run with coverage
coverage run manage.py test
coverage report
```

#### Frontend Testing

```bash
cd mobile

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### 4. Database Management

#### Development Database

```bash
cd backend

# Reset database
python manage.py reset_db

# Load sample data
python manage.py loaddata sample_data.json

# Create migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

#### Database Schema Changes

```bash
# When changing models
python manage.py makemigrations transactions
python manage.py migrate

# Check SQL before applying
python manage.py sqlmigrate transactions 0001
```

## 🔐 Environment Configuration

### Backend Environment Variables

Create `backend/.env`:

```bash
# Django settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (development)
DATABASE_URL=sqlite:///db.sqlite3

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:8081

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Frontend Environment Variables

Create `mobile/.env`:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:8000/api

# Development
EXPO_PUBLIC_ENV=development
```

## 🐛 Debugging

### Backend Debugging

```bash
# Run with debug logging
python manage.py runserver --verbosity=2

# Use Django Debug Toolbar (install first)
pip install django-debug-toolbar

# Check logs
tail -f django.log
```

### Frontend Debugging

```bash
# Start with clear cache
npm start --clear

# Use React DevTools
# Install from Chrome Web Store

# Debug network requests
# Use Expo DevTools in browser
```

### Common Issues

#### Backend Issues

**Migration Errors:**
```bash
# Reset migrations
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
python manage.py makemigrations
python manage.py migrate
```

**CORS Errors:**
- Check `CORS_ALLOWED_ORIGINS` in settings
- For development, temporarily set `CORS_ALLOW_ALL_ORIGINS=True`

#### Frontend Issues

**Metro Bundler Issues:**
```bash
# Clear cache
npm start --clear

# Reset node_modules
rm -rf node_modules
npm install
```

**API Connection Issues:**
- Verify API URL in `.env`
- Check if backend is running
- Test API endpoint directly with curl

## 🚀 Deployment

### Local Testing

Before deploying, test the full flow:

1. **Backend**: Run `python manage.py test`
2. **Frontend**: Build development version
3. **Integration**: Test API calls from mobile app

### Staging Deployment

1. **Backend**: Deploy to Railway/Render staging
2. **Frontend**: Build preview version with EAS
3. **Testing**: Test with staging API

### Production Deployment

See [Deployment Guide](deployment.md) for complete instructions.

## 📚 Learning Resources

### Backend (Django)

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [Simple JWT Guide](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django Security Best Practices](https://docs.djangoproject.com/en/stable/topics/security/)

### Frontend (React Native)

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Query Documentation](https://tanstack.com/query/latest)

### General

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [REST API Design Best Practices](https://restfulapi.net/)

## 🤝 Contributing

See [Contributing Guide](contributing.md) for detailed contribution guidelines.

## 📞 Support

- **Issues**: Create GitHub issue with detailed description
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: All changes require review before merge

## 🔄 Development Commands Cheat Sheet

### Backend
```bash
# Setup
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate

# Development
python manage.py runserver
python manage.py test
python manage.py createsuperuser

# Database
python manage.py makemigrations
python manage.py migrate
python manage.py dbshell
```

### Frontend
```bash
# Setup
npm install
cp .env.example .env

# Development
npm start
npm run ios
npm run android

# Testing
npm test
npm run lint
```

### Git
```bash
# Workflow
git checkout -b feature/name
git add .
git commit -m "type: description"
git push origin feature/name
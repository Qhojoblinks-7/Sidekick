# Deployment Guide

Complete guide for deploying Sidekick to production environments.

## 🎯 Deployment Overview

Sidekick uses a multi-environment deployment strategy:

- **Backend**: Django REST API on Railway/Render
- **Database**: PostgreSQL (managed)
- **Frontend**: React Native app via EAS Build
- **CDN**: Static assets served via deployment platforms

## 🚀 Backend Deployment

### Environment Variables

Create production `.env` file:

```bash
# Security
SECRET_KEY=your-50-character-random-secret-key
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings

# Database
DATABASE_URL=postgresql://user:password@host:5432/sidekick_db

# CORS
CORS_ALLOWED_ORIGINS=https://your-app.expo.dev,https://your-domain.com

# HTTPS
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Email (for password reset)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Railway Deployment

1. **Connect Repository**
   - Go to [Railway.app](https://railway.app)
   - Connect GitHub repository
   - Select `backend/` as root directory

2. **Environment Variables**
   - Add all variables from `.env`
   - Generate new `SECRET_KEY`

3. **Database Setup**
   - Add PostgreSQL plugin
   - Railway auto-configures `DATABASE_URL`

4. **Deploy**
   - Push to main branch triggers deployment
   - Check build logs for errors

### Render Deployment

1. **Create Web Service**
   - Connect GitHub repo
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `python manage.py migrate && python manage.py runserver 0.0.0.0:$PORT`

2. **Environment Variables**
   - Add production variables
   - Set `RENDER_EXTERNAL_URL` for CORS

3. **Database**
   - Use Render PostgreSQL
   - Configure `DATABASE_URL`

## 📱 Frontend Deployment

### EAS Build Setup

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/cli
   eas login
   ```

2. **Configure Project**
   ```bash
   cd mobile
   eas build:configure
   ```

3. **Environment Variables**
   Create `mobile/.env.production`:
   ```bash
   EXPO_PUBLIC_API_URL=https://your-api.railway.app/api
   ```

### Production Build

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Both platforms
eas build --platform all --profile production
```

### EAS Build Profiles

Update `mobile/eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "bundleIdentifier": "com.yourcompany.sidekick"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-api.railway.app/api"
      }
    }
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: railway deploy
        working-directory: backend

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install EAS CLI
        run: npm install -g @expo/cli
      - name: Build and submit
        run: eas build --platform all --profile production
        working-directory: mobile
```

## 🛡️ Production Security

### Pre-Deployment Checklist

- [ ] `DEBUG=False`
- [ ] Strong `SECRET_KEY` (50+ characters)
- [ ] `ALLOWED_HOSTS` configured
- [ ] HTTPS enabled
- [ ] Database backups configured
- [ ] Environment variables secured
- [ ] CORS restricted to your domain

### Security Headers

Django settings for production:

```python
# Security Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # ... other middleware
]

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
```

### Monitoring

```python
# Sentry for error tracking
import sentry_sdk
sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)
```

## 📊 Database Migration

### Production Database Setup

```bash
# Connect to production DB
railway connect

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data (optional)
python manage.py loaddata initial_data.json
```

### Backup Strategy

- **Railway**: Automatic daily backups
- **Render**: Manual backups via dashboard
- **Local**: `pg_dump` for custom backups

## 🌐 Domain Configuration

### Custom Domain (Railway)

1. Go to Railway project settings
2. Add custom domain
3. Configure DNS records
4. Update CORS settings

### SSL Certificate

- **Railway**: Automatic Let's Encrypt
- **Render**: Automatic SSL
- **Custom**: Use Certbot for manual certificates

## 📱 App Store Deployment

### Android (Google Play)

1. **Build AAB**
   ```bash
   eas build --platform android --profile production
   ```

2. **Create Play Console Account**
   - Upload AAB file
   - Configure store listing
   - Set pricing and distribution

3. **Internal Testing**
   - Create internal test track
   - Add tester emails
   - Distribute test builds

### iOS (App Store)

1. **Build IPA**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Apple Developer Account**
   - Configure App ID
   - Create provisioning profiles
   - Set up TestFlight

3. **TestFlight Distribution**
   - Upload build to TestFlight
   - Add internal testers
   - Collect feedback

## 🔍 Monitoring & Maintenance

### Health Checks

Create `/api/health/` endpoint:

```python
# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def health_check(request):
    return Response({"status": "healthy"})
```

### Logging

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': 'django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

### Performance Monitoring

- **Railway**: Built-in metrics
- **Render**: Dashboard metrics
- **Sentry**: Error tracking and performance
- **New Relic**: Application performance monitoring

## 🚨 Rollback Strategy

### Backend Rollback

```bash
# Railway
railway rollback

# Git rollback
git revert HEAD~1
git push origin main
```

### Frontend Rollback

```bash
# EAS Build
eas build:cancel

# App Store
# Submit new version with fixes
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance tested
- [ ] Documentation updated

### Deployment
- [ ] Environment variables set
- [ ] Database migrated
- [ ] SSL configured
- [ ] Domain configured

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Team notified

## 🆘 Troubleshooting

### Common Issues

**Build Failures:**
- Check build logs
- Verify environment variables
- Test locally first

**Runtime Errors:**
- Check application logs
- Verify database connectivity
- Test API endpoints

**Performance Issues:**
- Check database queries
- Monitor memory usage
- Optimize static assets

### Support

- **Railway**: [Railway Docs](https://docs.railway.app/)
- **Render**: [Render Docs](https://docs.render.com/)
- **EAS**: [Expo Docs](https://docs.expo.dev/)
- **Django**: [Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
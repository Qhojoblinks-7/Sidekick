# Sidekick SaaS - Complete Setup Guide

## 🚀 Quick Start (Development)

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (includes user table)
python manage.py migrate

# Create superuser for admin
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup
```bash
cd ../mobile

# Create .env file
cp .env.example .env

# Update .env with your API URL (for local development)
# EXPO_PUBLIC_API_URL=http://10.177.119.107:8000/api/auth

# Install dependencies
npm install

# Start Expo
npm start
```

---

## 🔐 Security Flow

### User Registration
1. Driver enters email and password
2. Frontend sends to `POST /api/auth/register/`
3. Django hashes password with Argon2
4. User created in database

### User Login
1. Driver enters credentials
2. Frontend sends to `POST /api/auth/login/`
3. Django returns `access_token` (15 min) + `refresh_token` (7 days)
4. Frontend stores both in **SecureStore** (hardware-encrypted)

### Authenticated Requests
1. Frontend attaches JWT to all requests: `Authorization: Bearer {token}`
2. Backend validates token in `IsAuthenticated` permission
3. ViewSets filter data by `request.user`
4. User sees only their transactions

### Token Refresh
1. When access token expires (15 min):
   - Frontend gets 401 response
   - Auto-sends refresh token to `POST /api/auth/refresh/`
   - Gets new access token
   - Retries original request

### Logout
1. Frontend deletes tokens from SecureStore
2. Sets `isAuthenticated = false` in AuthContext
3. User redirected to login screen

---

## 📁 File Structure

### Key Frontend Files
- `app/_layout.jsx` - Root with AuthProvider
- `app/index.jsx` - Auth routing logic
- `app/auth.jsx` - Login/Register UI
- `services/apiService.js` - JWT token management + auto-refresh
- `contexts/AuthContext.js` - Auth state management
- `hooks/useAuth.js` - Hook to access auth context
- `hooks/useSecureData.js` - React Query hooks for protected endpoints

### Key Backend Files
- `backend/api/` - New authentication app
- `backend/api/serializers.py` - UserRegister + CustomTokenPair
- `backend/api/views.py` - Register + Login endpoints
- `backend/api/urls.py` - Auth routes
- `backend/config/settings.py` - JWT + DRF config
- `backend/transactions/models.py` - User ForeignKey on Transaction/Expense
- `backend/transactions/views.py` - User-filtered ViewSets

---

## 🧪 Testing Authentication

### Test Register
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "username": "driver@example.com",
    "password": "SecurePass123",
    "password2": "SecurePass123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "driver@example.com",
    "password": "SecurePass123"
  }'

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer {access_token}"

# Without token:
curl -X GET http://localhost:8000/api/transactions/
# Response: {"detail":"Authentication credentials were not provided."}
```

---

## 🛡️ Production Deployment

### Environment Variables (Backend)
Create a `.env` file in `backend/`:
```
SECRET_KEY=your-super-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:password@host:5432/sidekick_db
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Email (for password reset)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Environment Variables (Frontend)
Create a `.env` file in `mobile/`:
```
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/auth
```

### Deployment Platforms

#### Backend (Django)
1. **Railway** (Recommended)
   - Free tier: 5GB storage + 512MB RAM
   - 1-click PostgreSQL setup
   - Auto-HTTPS

2. **Render**
   - Free tier: 0.5GB RAM
   - GitHub integration
   - Auto-deploys

3. **Heroku**
   - Paid only ($7/month minimum)
   - Still solid option

#### Frontend (Expo)
1. **EAS Build** (Official Expo)
   - Android: ~$1 per build
   - iOS: ~$1 per build
   - Easiest option

2. **Play Store** / **App Store**
   - Manual APK/IPA upload
   - After testing with EAS

---

## ✅ Pre-Production Checklist

- [ ] Create PostgreSQL database
- [ ] Set `DEBUG=False` in Django settings
- [ ] Generate strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set `SECURE_HSTS_SECONDS` in Django
- [ ] Configure CORS for your domain (not `*`)
- [ ] Test token refresh flow end-to-end
- [ ] Test user data isolation (User A ≠ User B)
- [ ] Setup error logging (Sentry)
- [ ] Setup database backups
- [ ] Test logout clears tokens
- [ ] Test expired token handling

---

## 🔄 Common Issues & Solutions

### "Authentication credentials were not provided"
- Frontend didn't attach JWT token
- Check: `apiService.js` is being used
- Check: Token is in SecureStore

### "Invalid token" / "Token is invalid or expired"
- Token expired but refresh failed
- Check: Refresh token still in SecureStore
- Check: Backend can reach refresh endpoint

### "User data isolation not working"
- Check: Transaction model has `user` field
- Check: ViewSet has `get_queryset()` filtering by user
- Run: `python manage.py makemigrations && python manage.py migrate`

### CORS errors
- Backend denying frontend requests
- Check: `CORS_ALLOWED_ORIGINS` includes frontend URL
- Development: Set `CORS_ALLOW_ALL_ORIGINS=True` (temporarily)

---

## 📚 Next Features to Add

1. **Email Verification** - Confirm email on registration
2. **Password Reset** - "Forgot password" flow
3. **Two-Factor Auth** - SMS or TOTP verification
4. **Invite Codes** - Referral system for drivers
5. **Admin Dashboard** - View all drivers' stats
6. **API Rate Limiting** - Prevent abuse
7. **Audit Logging** - Track all actions for compliance
8. **Push Notifications** - Alerts when payment received
9. **Geolocation Tracking** - Track driver location
10. **Export Data** - GDPR compliance

---

## 🆘 Support

For issues:
1. Check `SECURITY_IMPLEMENTATION.md`
2. Review Django error logs: `django.log`
3. Check Expo console: `npm start` output
4. Test with provided curl commands
5. Enable `DEBUG=True` temporarily (development only)

# Sidekick

A secure, multi-tenant SaaS platform for ride-sharing drivers to track transactions and expenses with enterprise-grade authentication and complete data isolation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React Native](https://img.shields.io/badge/react%20native-0.70+-blue.svg)](https://reactnative.dev/)

## 🚀 Quick Start

Get the full stack running in 5 minutes:

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd mobile
npm install
cp .env.example .env  # Update EXPO_PUBLIC_API_URL
npm start
```

### Validation
```bash
bash validate-setup.sh
```

## 📖 Documentation

Complete documentation is available in the [docs/](docs/) directory:

- **[📋 Overview](docs/index.md)** - Project overview and documentation guide
- **[🏗️ Architecture](docs/architecture.md)** - System design and data flow
- **[🔌 API Reference](docs/api.md)** - Complete REST API documentation
- **[💻 Development](docs/development.md)** - Setup, coding standards, and workflows
- **[🚀 Deployment](docs/deployment.md)** - Production deployment guides
- **[🤝 Contributing](docs/contributing.md)** - Contribution guidelines

## 🎯 Features

- **🔐 Enterprise Security**: JWT authentication with hardware-encrypted tokens
- **🛡️ Data Isolation**: Complete separation between driver accounts
- **📱 Cross-Platform**: Native iOS and Android apps
- **⚡ Real-time Sync**: Live data synchronization
- **📊 Analytics**: Comprehensive financial tracking
- **🔄 Auto Token Refresh**: Seamless authentication experience

## 🏛️ Technology Stack

- **Backend**: Django REST Framework + PostgreSQL
- **Frontend**: React Native + Expo
- **Authentication**: JWT with automatic refresh
- **Security**: Argon2 password hashing, HTTPS, CORS
- **Deployment**: Railway/Render (backend), EAS Build (mobile)

## 🧪 Testing

Test the authentication and data isolation:

```bash
# Register a driver
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "driver@example.com", "username": "driver@example.com", "password": "SecurePass123", "password2": "SecurePass123"}'

# Login and get tokens
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "driver@example.com", "password": "SecurePass123"}'

# Access protected data
curl -X GET http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🚢 Deployment

- **Backend**: Railway, Render, or Heroku
- **Database**: PostgreSQL (managed)
- **Frontend**: EAS Build → App Store & Play Store
- **CDN**: Automatic static asset optimization

## ⚠️ Known Issues & Pitfalls

### High-Risk Issues

1. **SMS Processing State Gap**
   - SMS service creates transactions in backend but doesn't update Redux store
   - **Impact**: Users see stale data until manual sync or app restart
   - **Fix**: Update Redux store on SMS processing success

2. **Settings Loading Race Condition**
   - Critical features (SMS checker) use default settings until settings screen loads
   - **Impact**: SMS processing disabled on app restart even if user enabled it
   - **Fix**: Load settings at app startup, not screen visit

3. **Broad Redux Selectors Performance**
   - Components re-render on any state change due to selecting entire slices
   - **Impact**: Unnecessary re-renders, battery drain, poor performance
   - **Fix**: Use specific selectors (e.g., `state.data.summary` instead of `state.data`)

4. **SMS Duplicate Transactions** ✅ **FIXED**
   - **Was**: No uniqueness checking before API submission
   - **Impact**: Same SMS processed multiple times creates duplicate transactions
   - **Fix**: Added `tx_id` uniqueness checking before API calls using Redux store lookup

5. **Silent Error Handling** ✅ **FIXED**
   - **Was**: Some API failures are caught but not reported to user
   - **Impact**: Users unaware of failed operations, data loss
   - **Fix**: Added toast notifications for SMS processing failures with user-friendly messages

6. **Permission Cache Invalidation** ✅ **FIXED**
   - **Was**: Cached permission status never re-validated after initial grant
   - **Impact**: App thinks it has permission even after user revokes in Android settings
   - **Fix**: Added permission re-validation using `PermissionsAndroid.check()` before relying on cache

7. **Summary Calculation Inconsistencies**
   - Local Redux summary not updated on edits/deletes, only React Query
   - **Impact**: Dashboard shows wrong totals until data refresh
   - **Fix**: Update Redux summary on all mutations

8. **No Offline Conflict Resolution**
   - No strategy for handling backend changes while app offline
   - **Impact**: Data conflicts on sync, potential overwrites
   - **Fix**: Implement conflict resolution and merge strategies

### Medium-Risk Issues

9. **Token Refresh Without Rotation**
   - Refresh tokens not updated when new ones issued
   - **Impact**: Potential reuse of expired refresh tokens
   - **Fix**: Store new refresh tokens on refresh

10. **Inefficient SMS Reading** ✅ **FIXED**
    - **Was**: Always reads 50 SMS regardless of what's new
    - **Impact**: Performance impact, battery drain
    - **Fix**: Implemented incremental SMS processing using timestamp filtering

### Security Issues

11. **SMS Bridge Security** ✅ **FIXED**
    - **Was**: Unauthenticated POST endpoint for SMS data
    - **Impact**: Potential for malicious SMS injection
    - **Fix**: Removed SMS bridge; all processing now occurs securely within authenticated mobile app

12. **No Rate Limiting**
    - No protection against brute force on auth endpoints
    - **Impact**: Vulnerable to automated attacks
    - **Fix**: Implement rate limiting (Django Ratelimit or similar)

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](docs/contributing.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **[Documentation](docs/)** - Complete guides and API reference
- 🐛 [Issues](https://github.com/your-repo/issues) - Bug reports and feature requests
- 💬 [Discussions](https://github.com/your-repo/discussions) - Q&A and general discussion

---

**Ready to help drivers take control of their earnings?** 🚗💰

*Built with ❤️ for ride-sharing drivers worldwide*

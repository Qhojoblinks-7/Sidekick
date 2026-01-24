# System Architecture

This document describes the architecture of the Sidekick platform, including system components, data flow, and design decisions.

## 🏗️ System Overview

Sidekick is a multi-tenant SaaS platform built with a mobile-first approach, consisting of:

- **Mobile Application**: React Native app for iOS/Android
- **Backend API**: Django REST Framework API server
- **Database**: PostgreSQL for data persistence
- **Authentication**: JWT-based authentication system

## 📱 High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API   │    │   Database      │
│  (React Native) │◄──►│  (Django REST)  │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • Auth Context  │    │ • JWT Auth      │    │ • Users         │
│ • API Service   │    │ • ViewSets      │    │ • Transactions  │
│ • UI Components │    │ • Serializers   │    │ • Expenses      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
                    ┌─────────────────┐
                    │   Deployment    │
                    │   Platforms     │
                    │                 │
                    │ • Railway       │
                    │ • EAS Build     │
                    │ • PostgreSQL    │
                    └─────────────────┘
```

## 🏛️ Component Architecture

### Mobile Application (React Native + Expo)

```
mobile/
├── app/                    # Expo Router pages
│   ├── _layout.jsx        # Root layout with AuthProvider
│   ├── index.jsx          # Auth routing logic
│   ├── auth.jsx           # Login/Register UI
│   └── (tabs)/            # Protected tab navigation
│       ├── index.jsx      # Dashboard
│       ├── history.jsx    # Transaction history
│       ├── expenses.jsx   # Expense tracking
│       └── settings.jsx   # User settings
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── ...               # Feature components
├── contexts/             # React contexts
│   ├── AuthContext.js    # Authentication state
│   └── ThemeContext.js   # Theme management
├── hooks/                # Custom React hooks
│   ├── useAuth.js        # Auth operations
│   ├── useTransactions.jsx # Transaction data
│   └── useSecureData.js  # API data fetching
├── services/             # External service integrations
│   └── apiService.js     # API client with JWT
└── constants/            # App constants
    ├── API.js           # API endpoints
    ├── Colors.js        # Theme colors
    └── Layout.js        # Layout constants
```

### Backend API (Django REST Framework)

```
backend/
├── config/               # Django project settings
│   ├── settings.py      # Main settings with JWT config
│   ├── urls.py          # Root URL configuration
│   └── wsgi.py          # WSGI application
├── api/                 # Authentication app
│   ├── views.py         # Register/Login endpoints
│   ├── serializers.py   # JWT token serializers
│   └── urls.py          # Auth URL patterns
├── transactions/        # Main business logic app
│   ├── models.py        # Transaction/Expense models
│   ├── views.py         # API ViewSets
│   ├── serializers.py   # Model serializers
│   ├── urls.py          # API URL patterns
│   └── admin.py         # Django admin config
├── core/                # Shared utilities (optional)
└── manage.py            # Django management script
```

## 🔐 Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant A as API Server
    participant D as Database

    U->>M: Enter credentials
    M->>A: POST /api/auth/login/
    A->>D: Validate user
    D-->>A: User data
    A-->>M: access_token + refresh_token
    M->>M: Store in SecureStore
    M->>A: API request + Bearer token
    A->>A: Validate JWT
    A->>D: Query user data
    D-->>A: Filtered results
    A-->>M: User data only
```

### Data Isolation Strategy

- **Database Level**: All models include `user` ForeignKey
- **API Level**: ViewSets filter by `request.user`
- **Result**: Complete data isolation between tenants

```python
# Example: Transaction ViewSet
class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

## 📊 Data Model Architecture

### Core Entities

```mermaid
erDiagram
    User ||--o{ Transaction : owns
    User ||--o{ Expense : owns

    Transaction {
        int id PK
        int user_id FK
        string tx_id
        decimal amount_received
        decimal rider_profit
        decimal platform_debt
        string platform
        boolean is_tip
        datetime created_at
    }

    Expense {
        int id PK
        int user_id FK
        decimal amount
        string category
        string description
        datetime created_at
    }

    User {
        int id PK
        string username UK
        string email UK
        string password_hash
    }
```

### Data Flow Patterns

1. **Create Operations**: User → API → Database (with user auto-assignment)
2. **Read Operations**: User → API → Database (filtered by user)
3. **Update/Delete**: Only allowed for user's own records

## 🚀 Deployment Architecture

### Development Environment

```
Local Development
├── Backend: Django dev server (localhost:8000)
├── Frontend: Expo dev client (localhost:8081)
├── Database: SQLite (development.db)
└── Networking: Localhost with CORS
```

### Production Environment

```
Production Deployment
├── Backend: Railway/Render (api.yourdomain.com)
├── Frontend: EAS Build → App Store/Play Store
├── Database: PostgreSQL (managed)
├── CDN: Static assets via Railway/Render
└── Security: HTTPS, CORS, environment variables
```

## 🔄 API Architecture

### RESTful Design

- **Resource-Based URLs**: `/api/transactions/`, `/api/expenses/`
- **HTTP Methods**: GET (list/retrieve), POST (create), PUT/PATCH (update), DELETE
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauth), 403 (forbidden), 404 (not found)

### Authentication Headers

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

### Error Response Format

```json
{
  "detail": "Authentication credentials were not provided."
}
```

## 📱 Mobile Architecture Patterns

### State Management

- **Authentication**: Context API with SecureStore persistence
- **Data Fetching**: React Query for caching and background updates
- **UI State**: Local component state with hooks

### Navigation Flow

```
App Launch
├── Check stored tokens
├── If valid → Dashboard
└── If invalid → Login screen

Authenticated Flow
├── Tab Navigation
│   ├── Dashboard (summary)
│   ├── History (transactions)
│   ├── Expenses (tracking)
│   └── Settings (logout)
└── Token refresh on 401 responses
```

## 🧪 Testing Architecture

### API Testing Strategy

- **Unit Tests**: Model and serializer validation
- **Integration Tests**: API endpoint testing
- **Authentication Tests**: Token validation and refresh
- **Isolation Tests**: Multi-user data separation

### Mobile Testing Strategy

- **Component Tests**: UI component rendering
- **Integration Tests**: API service interactions
- **E2E Tests**: User flow validation

## 🔧 Technology Choices Rationale

| Technology | Choice Reason |
|------------|---------------|
| React Native | Cross-platform mobile development |
| Expo | Simplified React Native development |
| Django REST | Rapid API development with security |
| PostgreSQL | Production-ready relational database |
| JWT | Stateless authentication for scalability |
| SecureStore | Hardware-encrypted token storage |
| React Query | Efficient data fetching and caching |

## 📈 Scalability Considerations

### Horizontal Scaling

- **Stateless API**: Easy to scale backend instances
- **Database Indexing**: Optimize queries on user_id
- **CDN**: Static assets and API responses
- **Rate Limiting**: Prevent abuse (future feature)

### Performance Optimizations

- **Database Queries**: Select related fields, avoid N+1 queries
- **API Responses**: Pagination for large datasets
- **Mobile Caching**: React Query reduces API calls
- **Image Optimization**: Compress and cache images

## 🔒 Security Considerations

### Data Protection

- **Encryption**: Passwords hashed with Argon2
- **Transport**: HTTPS for all communications
- **Storage**: Sensitive data encrypted on device
- **Access Control**: Row-level security in database

### Threat Mitigation

- **CORS**: Restrict API access to authorized domains
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Prevent brute force attacks
- **Audit Logging**: Track all data access (future)

This architecture provides a solid foundation for a scalable, secure SaaS platform while maintaining simplicity for development and maintenance.
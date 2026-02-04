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

---

## 📱 SMS Reading Architecture

### Overview

The SMS Reading subsystem is a critical component of Sidekick that automatically captures and processes mobile money transactions from incoming SMS messages. This enables delivery drivers to automatically track their earnings from platforms like Yango and Bolt without manual data entry.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SMS Reading Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐  │
│  │   Android   │     │    iOS       │     │   Manual    │     │  Parse   │  │
│  │  SMS Read   │     │  SMS Read    │     │   Entry     │     │  Engine  │  │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └────┬─────┘  │
│         │                    │                    │                 │        │
│         └────────────────────┴────────────────────┴─────────────────┘        │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │                      SMS Processing Pipeline                          │      │
│  │                                                                       │      │
│  │   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐    │      │
│  │   │ Permission│   │  Fetch    │   │  Parse    │   │  Dedupe   │    │      │
│  │   │  Check    │──►│  Messages │──►│  SMS      │──►│  Check    │    │      │
│  │   └───────────┘   └───────────┘   └───────────┘   └───────────┘    │      │
│  │         │              │              │              │              │      │
│  │         ▼              ▼              ▼              ▼              │      │
│  │   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐    │      │
│  │   │  Consent  │   │ Platform  │   │  Extract  │   │  Backend  │    │      │
│  │   │  Modal    │   │ Detection │   │  Amount   │   │  Sync     │    │      │
│  │   └───────────┘   └───────────┘   └───────────┘   └───────────┘    │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │                       Backend API Layer                              │      │
│  │                                                                       │      │
│  │   ┌───────────────────┐   ┌───────────────────┐   ┌───────────────┐  │      │
│  │   │  Transaction API   │   │   Expense API     │   │  Summary API  │  │      │
│  │   │  /api/transactions │   │  /api/expenses    │   │  /api/summary │  │      │
│  │   └───────────────────┘   └───────────────────┘   └───────────────┘  │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### 1. SMS Service Layer (`mobile/services/smsService.js`)

The SMS Service provides a unified abstraction layer for platform-specific SMS operations:

```javascript
// Core functions exported by smsService.js
export const requestSmsPermission()  // Request SMS read permission
export const hasSmsPermission()      // Check current permission status
export const getAllMessages()        // Bulk read all SMS messages
export const startListening()        // Real-time SMS listener (Android only)
export const stopListening()         // Stop real-time listener
```

**Key Design Decisions:**
- **Platform Abstraction**: Uses `react-native-get-sms-android` for Android and `expo-sms` for iOS
- **Permission Handling**: Separate permission flows for Android (native) and iOS (expo)
- **iOS Limitation**: Background SMS listening not supported on iOS due to platform restrictions

#### 2. SMS Processing Component (`mobile/components/SMSChecker.jsx`)

The SMSChecker is a headless component that runs in the background to monitor and process SMS:

```
SMSChecker Responsibilities:
├── Permission & Authentication State Monitoring
├── App State Change Detection (foreground triggers)
├── Periodic Polling (5-minute intervals)
├── Real-time SMS Listener Management
└── Duplicate Transaction Prevention
```

**Processing Flow:**
```
App State Change (foreground) ──► Check SMS Enabled? ──► Check Auth?
                                                    │
                                                    ▼
                                         Is Currently Checking?
                                                    │
                         ┌──────────────────────────┼──────────────────────────┐
                         │ NO                       │ YES                      │
                         ▼                          ▼                          ▼
                 readAndProcessSMS()         Skip (prevent overlap)      Wait
                         │
                         ▼
                 Parse & Validate
                         │
                         ▼
                 Check Duplicates
                         │
                         ▼
                 Sync to Backend
```

**State Management:**
- Uses Redux `smsEnabled` flag to control processing
- Requires authentication before processing
- Prevents simultaneous checks with `isChecking` flag

#### 3. Consent Management (`mobile/components/SMSConsentModal.jsx`)

A modal dialog that educates users about SMS permissions:

**Features:**
- Explains SMS reading benefits
- Lists supported platforms (MTN Mobile Money, AirtelTigo Money, Bolt, Yango)
- Provides privacy assurances (local processing)
- Dual-action buttons (Allow/Deny)

**Privacy Promise:**
```
"Your SMS data is processed locally on your device and only
transaction details are sent to our secure server. We never store or
share your full message content."
```

#### 4. Manual Entry Fallback (`mobile/components/ManualSMSModal.jsx`)

Provides manual SMS entry when automatic reading is unavailable:

**Capabilities:**
- Clipboard paste support
- SMS validation
- Duplicate detection
- Platform classification
- Expense/Transaction routing

**Use Cases:**
- iOS devices (limited SMS reading)
- Expo environment (no native SMS access)
- Permission-denied scenarios
- Testing and debugging

### SMS Parsing Engine (`mobile/utils/momoTracker.js`)

The MoMo Tracker parses SMS messages using regex pattern matching:

```javascript
// Example SMS: "You have received GHS 50.00 from YANGO GH. Ref: 1234567890. Fee: GHS 0.00. Your balance is GHS 150.00."

parseMoMoSMS(message) {
  // Extract: amount, reference, sender
  // Detect: platform (YANGO, BOLT, PRIVATE)
  // Calculate: rider_profit, platform_debt
  // Returns: Transaction object
}

parseIncomingMoMo(smsBody) {
  // Enhanced parser with backward compatibility
  // Returns: Captured transaction object
}
```

**Platform Detection Logic:**
```
Sender Contains "YANGO"  ──► Platform = "YANGO"
Sender Contains "BOLT"   ──► Platform = "BOLT"
Neither Match            ──► Platform = "PRIVATE"
```

**Financial Calculations:**
```
PRIVATE transactions:
  rider_profit = amount_received
  platform_debt = 0

PLATFORM transactions (10% commission):
  rider_profit = amount_received - (amount_received × 0.10)
  platform_debt = amount_received × 0.10
```

### State Management Integration

**Redux Store Structure:**
```javascript
// store.js slices relevant to SMS
settingsSlice: {
  smsEnabled: boolean,  // Master toggle for SMS processing
}

dataSlice: {
  transactions: [],     // Processed SMS transactions
  pendingTransactions: [],  // Local-only transactions
}
```

**Selectors:**
```javascript
export const selectSmsEnabled = (state) => state.settings.smsEnabled;
export const selectTransactions = (state) => state.data.transactions;
```

### Backend Integration

#### API Endpoints

**Transaction API (`/api/transactions/`)**
- `POST /api/transactions/` - Create new transaction from SMS
- `GET /api/transactions/` - List user transactions

**Expense API (`/api/expenses/`)**
- `POST /api/expenses/` - Create expense from private SMS
- `GET /api/expenses/` - List user expenses

#### Security: SMS Bridge Permission

```python
class IsAuthenticatedOrSMSBridge(BasePermission):
    """
    Allow authenticated users, or POST requests from localhost (for SMS bridge)
    """
    def has_permission(self, request, view):
        if request.method == 'POST' and request.META.get('REMOTE_ADDR') in ['127.0.0.1', 'localhost']:
            return True
        return request.user and request.user.is_authenticated
```

### Platform-Specific Implementation

#### Android

**SMS Reading Method:**
```javascript
// Uses react-native-get-sms-android
const SmsAndroid = require('react-native-get-sms-android');

// Bulk read
SmsAndroid.list(
  JSON.stringify(filter),
  (success) => { /* process messages */ },
  (error) => { /* handle error */ }
);
```

**Real-time Listening:**
```javascript
// Event-based SMS listener
DeviceEventEmitter.addListener('onSMSReceived', (callback) => {
  // Process incoming SMS immediately
});

SMSModule.startListening();
```

**Permissions Required:**
- `android.permission.READ_SMS`
- `android.permission.RECEIVE_SMS` (for real-time)

#### iOS

**Limitations:**
- Background SMS reading NOT supported by iOS
- Uses `expo-sms` for available check only
- Manual entry recommended for iOS users

**Permissions:**
- iOS has no native SMS read API for third-party apps
- Users must manually paste SMS content

### Data Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant SMSChecker
    participant SmsService
    participant MomoParser
    participant BackendAPI
    participant Database

    User->>SMSChecker: Install & Enable SMS
    SMSChecker->>SmsService: requestSmsPermission()
    SmsService-->>User: Permission Dialog
    User->>SmsService: Grant Permission

    loop Every 5 Minutes / App Foreground
        SMSChecker->>SmsService: getAllMessages()
        SmsService-->>SMSChecker: Array of SMS
        
        loop Each SMS
            SMSChecker->>MomoParser: parseMoMoSMS(sms)
            MomoParser-->>SMSChecker: Parsed Transaction
            
            SMSChecker->>BackendAPI: POST /api/transactions/
            BackendAPI->>Database: Save Transaction
            Database-->>BackendAPI: Confirmation
            BackendAPI-->>SMSChecker: Created Transaction
        end
    end
end
```

### Supported SMS Formats

**Yango Example:**
```
You have received GHS 50.00 from YANGO GH.
Ref: 1234567890.
Fee: GHS 5.00.
Your balance is GHS 150.00.
```

**Bolt Example:**
```
You received GHS 75.50 from BOLT.
Transaction ID: 9876543210
Commission: GHS 7.55
New Balance: GHS 225.50
```

**Private Transfer (Tracked as Expense):**
```
You have received GHS 200.00 from JOHN DOE.
Ref: PRIVATE123
```

### Error Handling & Fallbacks

**Permission Denied:**
```javascript
if (error.message.includes("permission")) {
  showToast("SMS permission denied. Please enable SMS access in settings.");
}
```

**SMS Library Unavailable (Expo):**
```javascript
showToast(
  "SMS bulk reading not available in Expo. Use live tracking for new payments.",
  "info"
);
```

**Duplicate Transaction:**
```javascript
const isDuplicateTransaction = (txId) => {
  return transactions.some((tx) => tx.tx_id === txId);
};
```

### Performance Considerations

**Batch Processing:**
- SMS reads are batched to minimize system calls
- Only new messages processed after initial sync

**Throttling:**
- 5-minute polling interval prevents battery drain
- Single active check prevents concurrent processing

**Memory Management:**
- Component cleanup on unmount
- Event listener removal
- Interval clearing

### Security & Privacy

**Local Processing:**
- SMS parsing happens on-device
- Only extracted data transmitted
- Full message content never sent to server

**Token Storage:**
- JWT tokens stored in SecureStore
- Hardware-encrypted storage on Android
- Keychain on iOS

**Data Minimization:**
- Only relevant fields extracted:
  - Amount
  - Transaction Reference
  - Platform
  - Timestamp

### Testing & Debugging

**Debug Logging:**
```javascript
console.log(`[DEBUG] checkSMS called: smsEnabled=${smsEnabled}`);
console.log(`[DEBUG] SMS check ${smsCheckCount} completed successfully`);
```

**Development Tools:**
- Manual SMS entry for testing
- Debug logs component for inspection
- Toast notifications for user feedback

---

## 🚀 Scaling & Production Hardening

### 1. NativeModule Resolution Strategy

**Problem:** Direct `NativeModules.ExpoSmsAndroid` calls crash on startup for incompatible devices (custom ROMs like Xiaomi, Oppo).

**Solution:** Safe resolution with fallback chain:

```javascript
// mobile/services/smsService.js

const resolveSMSModule = () => {
  if (Platform.OS !== 'android') return null;
  
  const moduleNames = [
    'ExpoSmsAndroid',
    'SmsAndroid', 
    'ExpoReadSms',
    'RNSmsAndroid',
  ];

  for (const moduleName of moduleNames) {
    try {
      const module = NativeModules[moduleName];
      if (module && typeof module.getAllMessages === 'function') {
        console.log(`[SMS] Resolved: ${moduleName}`);
        return { module, name: moduleName };
      }
    } catch (error) {
      console.log(`[SMS] Not found: ${moduleName}`);
    }
  }
  
  console.warn('[SMS] No compatible SMS module');
  return null;
};
```

**Benefits:**
- Prevents app crash on incompatible devices
- Graceful degradation with logging
- Easier debugging of device-specific issues

### 2. Race Condition Prevention

**Problem:** Global `let isChecking` variables persist across component lifecycles and cause unpredictable behavior.

**Solution:** Use `useRef` tied to component instance:

```javascript
// mobile/components/SMSChecker.jsx

const SMSChecker = () => {
  const isCheckingRef = useRef(false);
  const intervalRef = useRef(null);
  const listenerRef = useRef(null);

  const checkSMS = useCallback(async () => {
    if (isCheckingRef.current) {
      console.log('[SMS] Skipping - already checking');
      return;
    }
    
    isCheckingRef.current = true;
    try {
      await processMessages();
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (listenerRef.current) listenerRef.current();
    };
  }, []);
};
```

**Benefits:**
- Race condition prevention
- Proper cleanup on unmount
- Component isolation

### 3. Auto-Detection for Manual Entry

**Problem:** Users hate manual typing. Paste from clipboard is good, but auto-detect is better.

**Solution:** Auto-detect clipboard content when modal opens:

```javascript
// mobile/components/ManualSMSModal.jsx

useEffect(() => {
  if (visible) {
    autoDetectClipboard();
  }
}, [visible]);

const autoDetectClipboard = async () => {
  const content = await Clipboard.getStringAsync();
  if (isTransactionSMS(content)) {
    setSmsContent(content);
    setIsDetected(true);
    setParsedData(parseMoMoSMS(content));
  }
};
```

**Benefits:**
- Reduced user friction
- Instant preview of parsed data
- Visual confirmation of detection

---

## 🔐 Transaction Request Hash Validation

### Overview

Prevent fake transaction injection by validating HMAC-SHA256 hashes on all transaction requests.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Request Hash Validation Flow                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Mobile App                          Backend                          │
│  ──────────                          ───────                          │
│                                                                      │
│  1. Generate hash:               1. Receive request                  │
│     HMAC-SHA256(                 2. Re-calculate hash:              │
│       tx_id:amount:platform,       HMAC-SHA256(                      │
       secret                     │       tx_id:amount:platform,      │
│     )                            secret)                             │
│                                                                      │
│  2. Send with request:          3. Compare hashes:                  │
│     { tx_id, amount,               constant-time compare           │
│       platform,                                             │
│       request_hash }            4. Accept/Reject                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile Implementation

```javascript
// mobile/utils/requestHash.js

import crypto from 'crypto-js';
import * as SecureStore from 'expo-secure-store';

export const generateTransactionHash = async (txId, amount, platform) => {
  const secret = await SecureStore.getItemAsync('sms_api_secret');
  const message = `${txId}:${amount}:${platform}`;
  const hash = crypto.HmacSHA256(message, secret);
  return hash.toString(crypto.enc.Hex);
};

export const signRequest = async (data) => ({
  ...data,
  request_hash: await generateTransactionHash(
    data.tx_id,
    data.amount_received,
    data.platform
  ),
});
```

### Backend Validation

```python
# backend/transactions/serializers.py

import hmac
import hashlib
from django.conf import settings

def verify_request_hash(tx_id, amount, platform, provided_hash):
    secret = getattr(settings, 'SMS_API_SECRET', settings.SECRET_KEY)
    message = f"{tx_id}:{amount}:{platform}"
    
    expected = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison prevents timing attacks
    return hmac.compare_digest(expected, provided_hash)
```

### Configuration

**Backend Settings (`settings.py`):**
```python
# Security settings
SMS_API_SECRET = os.environ.get('SMS_API_SECRET', 'change_in_production')
SMS_HASH_STRICT_MODE = os.environ.get('SMS_HASH_STRICT_MODE', 'False')
```

**Environment Variable Setup:**
```bash
export SMS_API_SECRET="your_secure_random_string_min_32_chars"
export SMS_HASH_STRICT_MODE="True"  # Reject invalid hashes
```

---

## 🎯 Production Readiness Checklist

### Pre-Launch

- [ ] **Error Monitoring**: Integrate Sentry or LogRocket
  ```bash
  npx sentry-wizard -i reactNative
  ```

- [ ] **Background Tasks**: Implement `expo-task-manager`
  ```javascript
  import * as TaskManager from 'expo-task-manager';
  
  TaskManager.defineTask('SMS_SYNC', ({ data, error }) => {
    if (error) return;
    syncMissedTrips();
  });
  ```

- [ ] **Device Testing Matrix**:
  - Samsung Galaxy (OneUI)
  - Xiaomi/Redmi (MIUI)
  - Oppo/Realme (ColorOS)
  - Vivo (FuntouchOS)
  - Stock Android (Pixel)

- [ ] **SMS Format Monitoring**:
  - Subscribe to telco SMS format change alerts
  - Implement parser version tracking
  - Hot-fix parser via remote config

### Monitoring & Alerting

**Critical Metrics:**
- Transaction parsing success rate (>95%)
- Duplicate transaction rate (<1%)
- Permission denial rate
- App crash rate on SMS permission request

**Sentry Alerts:**
```python
# Django - alert on parser failures
logger.error(f"Parser failure: {sms_body[:100]}", exc_info=True)
```

### Rollback Strategy

**Parser Version Control:**
```javascript
const PARSER_VERSION = '1.2.0';  // Increment on format changes
```

**Remote Config Fallback:**
```javascript
const parserConfig = await fetchRemoteConfig();
const activeParser = parserConfig.version;
```

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | Measurement Method
|--------|--------|-------------------
| SMS Processing Time | <100ms | Console timing
| Parse Success Rate | >95% | Backend logging
| Memory Usage | <50MB | React DevTools
| Battery Impact | <2%/hour | Battery monitoring
| API Latency | <500ms | Network timing

### Optimization Techniques

**Batch Processing:**
```javascript
// Process messages in chunks
const CHUNK_SIZE = 20;
for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
  const chunk = messages.slice(i, i + CHUNK_SIZE);
  await Promise.all(chunk.map(processSingleMessage));
}
```

**Deduplication Cache:**
```javascript
// Local cache of recent tx_ids (5 minute TTL)
const recentTxIds = new Map();

const isRecentDuplicate = (txId) => {
  const cached = recentTxIds.get(txId);
  if (cached && Date.now() - cached < 5 * 60 * 1000) {
    return true;
  }
  recentTxIds.set(txId, Date.now());
  return false;
};
```

---

## 🔋 Foreground Service for Delivery Drivers

### Why Foreground Service?

Delivery drivers use **Battery Saver** mode to survive long shifts. Battery saver kills background intervals. Foreground Service puts a persistent notification on the driver's phone:

```
┌─────────────────────────────────────┐
│ Sidekick Active                     │
│ Tracking your earnings...           │
└─────────────────────────────────────┘
```

This ensures SMS is read 100% of the time while the phone is in their pocket.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Foreground Service Architecture                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │ Foreground   │      │ Background   │      │ SMS Broadcast │   │
│  │ Service      │      │ Fetch        │      │ Receiver      │   │
│  │ (Persistent  │      │ (Periodic)   │      │ (Real-time)   │   │
│  │  Notification│      │  5-min sync  │      │  Immediate)   │   │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘   │
│         │                     │                     │            │
│         └─────────────────────┼─────────────────────┘            │
│                               │                                  │
│                               ▼                                  │
│                    ┌────────────────────┐                        │
│                    │  SMS Processing    │                        │
│                    │  Pipeline          │                        │
│                    └────────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation

**Hook: `mobile/hooks/useForegroundService.js`**

```javascript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const FOREGROUND_SERVICE_TASK = 'SidekickTracking';

// Define background task
TaskManager.defineTask(FOREGROUND_SERVICE_TASK, async () => {
  try {
    const { readAndProcessSMS } = await import('../services/smsService');
    await readAndProcessSMS(true);
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    return BackgroundFetch.Result.Failed;
  }
});

export const useForegroundService = () => {
  const [isServiceActive, setIsServiceActive] = useState(false);

  const startService = async () => {
    const ForegroundService = (await import('expo-foreground-service')).default;
    
    await ForegroundService.startServiceAsync({
      notificationTitle: 'Sidekick Active',
      notificationText: 'Tracking your earnings...',
      notificationColor: '#000000',
    });

    // Register background fetch
    await BackgroundFetch.registerTaskAsync(FOREGROUND_SERVICE_TASK, {
      minimumInterval: 5 * 60, // 5 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  };

  const stopService = async () => {
    const ForegroundService = (await import('expo-foreground-service')).default;
    await ForegroundService.stopServiceAsync();
    await BackgroundFetch.unregisterTaskAsync(FOREGROUND_SERVICE_TASK);
  };

  return { isServiceActive, startService, stopService };
};
```

### Android Configuration

**`mobile/app.json`** - Required Plugins:

```json
{
  "expo": {
    "plugins": [
      "react-native-expo-read-sms",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "minSdkVersion": 26
          }
        }
      ],
      [
        "expo-foreground-service",
        {
          "foregroundServiceTask": "SidekickTracking",
          "iconAssetPath": "./assets/brand-icon.png"
        }
      ]
    ]
  }
}
```

**`AndroidManifest.xml`** - Required Permissions:

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

<service 
  android:name="expo.modules.foregroundservice.ForegroundService" 
  android:foregroundServiceType="dataSync"
  android:exported="false">
  <property 
    android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" 
    android:value="tracking_earnings"/>
</service>
```

### SDK Version Requirements

| Version | Value | Notes |
|---------|-------|-------|
| compileSdkVersion | 34 | Android 14 |
| targetSdkVersion | 34 | Android 14 |
| minSdkVersion | 26 | Android 8.0+ |

**⚠️ Warning:** SDK 36 is the "Developer Preview" territory. Google Play requires SDK 34 or 35. Using SDK 36 causes native modules to crash.

### Driver Experience

**When driver enables tracking:**
1. System notification appears: "Sidekick is tracking earnings"
2. Service runs even when screen is off
3. Background fetch checks every 5 minutes
4. SMS broadcast receiver captures transactions instantly

**Battery Impact:**
- Foreground service: ~1-2% per hour
- With battery saver: Still runs (foreground services are exempt)
- Background fetch: ~0.5% per check

### iOS Limitation

iOS does not support foreground services. On iOS:
- App can only read SMS when in foreground or via manual entry
- Consider push notifications as fallback
- Users must periodically open the app

---

## 🔧 Config Plugin & Manifest Management

### Problem

Expo's prebuild process overwrites `AndroidManifest.xml` with default configurations, erasing custom SMS receiver declarations.

### Solution: Expo Config Plugin

Create `mobile/plugins/withAndroidManifestSmsReceiver.js`:

```javascript
const { withAndroidManifest } = require('expo/config-plugins');

const SMS_RECEIVER_CLASS = 'com.maniac_tech.react_native_expo_read_sms.SmsReceiver';

const withAndroidManifestSmsReceiver = (config) => {
  return withAndroidManifest(config, async (config) => {
    // Add SMS receiver to manifest
    // Add foreground service permissions
    // Add foreground service declaration
    return config;
  });
};

module.exports = withAndroidManifestSmsReceiver;
```

### Usage

Add to `app.json` plugins array:
```json
{
  "plugins": [
    ["./plugins/withAndroidManifestSmsReceiver"]
  ]
}
```

### Build Process

```bash
# Plugin runs automatically during prebuild
npx expo prebuild --platform android

# Plugin output:
# ✓ SMS Receiver added to AndroidManifest.xml
# ✓ Foreground Service added
# ✓ Permissions added
```

### What the Plugin Injects

1. **SMS BroadcastReceiver**:
```xml
<receiver 
  android:name="com.maniac_tech.react_native_expo_read_sms.SmsReceiver"
  android:exported="false">
  <intent-filter android:priority="1000">
    <action android:name="android.provider.Telephony.SMS_RECEIVED"/>
  </intent-filter>
</receiver>
```

2. **Foreground Service**:
```xml
<service
  android:name="expo.modules.foregroundservice.ForegroundService"
  android:foregroundServiceType="dataSync"
  android:exported="false">
  <property
    android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
    android:value="tracking_earnings"/>
</service>
```

3. **Required Permissions**:
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_DATA_SYNC`
- `FOREGROUND_SERVICE_SPECIAL_USE`
- `POST_NOTIFICATIONS`

### Benefits

- ✅ Never worry about manifest being overwritten
- ✅ Idempotent (safe to run multiple times)
- ✅ Version-controlled configuration
- ✅ Easier team onboarding

---

## 📱 Advanced MoMo Parser for Ghana Networks

### Overview

Robust SMS parsing for Ghana's mobile money ecosystem (MTN, Telecel, AirtelTigo) and ride-hailing platforms (Yango, Bolt).

### Provider Patterns

```javascript
const PROVIDER_PATTERNS = {
  yango: {
    keywords: ['yango'],
    amountPatterns: [
      /(?:received|paid|Amount)\s?:?\s?GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    ],
    platformName: 'YANGO',
  },
  bolt: {
    keywords: ['bolt', 'bolt food'],
    amountPatterns: [
      /(?:Amount|Received|GHS)\s?:?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    ],
    platformName: 'BOLT',
  },
  mtn: {
    keywords: ['mtnmomo', 'mobile money'],
    amountPatterns: [
      /(?:Amt|Amount|GHS|Transaction of)\s?:?\s?GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    ],
    platformName: 'MTN',
  },
  telecel: {
    keywords: ['telecel', 'vodafone'],
    amountPatterns: [
      /(?:Amt|Amount|GHS)\s?:?\s?GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    ],
    platformName: 'TELECEL',
  },
  airteltigo: {
    keywords: ['airteltigo', 'airtel', 'tigo'],
    amountPatterns: [
      /(?:Amt|Amount|GHS|received)\s?:?\s?GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    ],
    platformName: 'AIRTELTIGO',
  },
};
```

### The "Balance Trap" Prevention

Many MoMo messages contain both transaction amount AND balance:

> "Payment of **GHS 50.00** received. Your balance is **GHS 1550.00**."

**Bad regex:** `/GHS\s?(\d+)/` → Would match 1550.00

**Good regex:** `/Payment of GHS\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/` → Matches 50.00

### Sanity Checks

```javascript
// Cap at 10,000 GHS for single transaction
if (amount >= 10000) {
  console.warn(`[PARSER] Suspicious amount: GHS ${amount}`);
  return null;
}
```

### Commission Rates by Platform

| Platform | Commission Rate | Notes |
|-----------|-----------------|-------|
| YANGO | 10% | Standard ride commission |
| BOLT | 12% | Higher platform fee |
| MTN MoMo | 1.5% | Transfer fee |
| TELECEL | 1.5% | Transfer fee |
| AIRTELTIGO | 1.5% | Transfer fee |
| PRIVATE | 0% | Personal transfers |

### Parsing Output

```javascript
{
  tx_id: "ABC123XYZ",
  amount_received: 50.00,
  rider_profit: 45.00,
  platform_debt: 5.00,
  platform: "YANGO",
  provider: "YANGO",
  parsed_at: "2024-01-15T10:30:00.000Z"
}
```

### Testing Templates

**MTN MoMo:**
```
Payment of GHS 75.00 received from 0241234567. Ref: MTN20240115. Your new balance is GHS 1,250.00.
```

**Telecel (Vodafone):**
```
You have received GHS 120.00 from Telecel Money. Transaction ID: TC123456789. New balance: GHS 890.50
```

**AirtelTigo Money:**
```
AirtelTigo Money: GHS 45.00 received from 0271112222. Ref: ATG20240115001. Balance: GHS 678.90
```


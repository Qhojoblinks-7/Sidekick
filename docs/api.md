# API Reference

Complete REST API documentation for the Sidekick backend, including authentication, endpoints, and examples.

## 🔐 Authentication

All API requests require authentication except for registration and login endpoints.

### JWT Token Format

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Token Lifetimes

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

### Token Refresh

When access token expires (401 response), use refresh token to get new access token:

```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "your_refresh_token"}'
```

## 📋 API Endpoints

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register/
```

**Request Body:**
```json
{
  "email": "driver@example.com",
  "username": "driver@example.com",
  "password": "SecurePass123",
  "password2": "SecurePass123"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "driver@example.com",
  "email": "driver@example.com"
}
```

**Error Response (400):**
```json
{
  "email": ["This field is required."],
  "password": ["Password must be at least 8 characters."]
}
```

#### Login User

```http
POST /api/auth/login/
```

**Request Body:**
```json
{
  "username": "driver@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Refresh Token

```http
POST /api/auth/refresh/
```

**Request Body:**
```json
{
  "refresh": "your_refresh_token_here"
}
```

**Response (200):**
```json
{
  "access": "new_access_token_here"
}
```

### Transaction Endpoints

#### List Transactions

```http
GET /api/transactions/
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (int): Page number for pagination
- `page_size` (int): Items per page (default: 20)
- `platform` (string): Filter by platform (YANGO, BOLT, PRIVATE)
- `is_tip` (boolean): Filter tips only

**Response (200):**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/transactions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "tx_id": "TXN_001",
      "amount_received": "25.50",
      "rider_profit": "20.00",
      "platform_debt": "5.50",
      "platform": "YANGO",
      "is_tip": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Transaction

```http
POST /api/transactions/
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "tx_id": "TXN_002",
  "amount_received": "30.00",
  "rider_profit": "24.00",
  "platform_debt": "6.00",
  "platform": "BOLT",
  "is_tip": false
}
```

**Response (201):**
```json
{
  "id": 2,
  "tx_id": "TXN_002",
  "amount_received": "30.00",
  "rider_profit": "24.00",
  "platform_debt": "6.00",
  "platform": "BOLT",
  "is_tip": false,
  "created_at": "2024-01-15T11:00:00Z"
}
```

#### Get Transaction Detail

```http
GET /api/transactions/{id}/
```

**Response (200):** Same as individual transaction object above.

#### Update Transaction

```http
PUT /api/transactions/{id}/
PATCH /api/transactions/{id}/
```

**Request Body:** Same as create, all fields optional for PATCH.

#### Delete Transaction

```http
DELETE /api/transactions/{id}/
```

**Response (204):** No content.

### Expense Endpoints

#### List Expenses

```http
GET /api/expenses/
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (int): Page number
- `page_size` (int): Items per page
- `category` (string): Filter by category (FUEL, DATA, FOOD, REPAIR)

**Response (200):**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "amount": "50.00",
      "category": "FUEL",
      "description": "Gas station fill-up",
      "created_at": "2024-01-15T09:00:00Z"
    }
  ]
}
```

#### Create Expense

```http
POST /api/expenses/
```

**Request Body:**
```json
{
  "amount": "25.00",
  "category": "FOOD",
  "description": "Lunch with colleagues"
}
```

#### Update/Delete Expense

Same pattern as transactions: `PUT/PATCH/DELETE /api/expenses/{id}/`

### Summary Endpoints

#### Daily Summary

```http
GET /api/summary/daily/
```

**Query Parameters:**
- `date` (string): Date in YYYY-MM-DD format (default: today)

**Response (200):**
```json
{
  "date": "2024-01-15",
  "total_earnings": "125.50",
  "total_expenses": "75.00",
  "net_income": "50.50",
  "transaction_count": 5,
  "expense_count": 3
}
```

## 🧪 Testing

### Authentication Testing

#### 1. Register a Test User

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "test@example.com",
    "password": "TestPass123",
    "password2": "TestPass123"
  }'
```

#### 2. Login and Get Tokens

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "TestPass123"
  }'
```

Save the `access` token for subsequent requests.

#### 3. Test Protected Endpoints

```bash
# Should work with valid token
curl -X GET http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Should fail without token
curl -X GET http://localhost:8000/api/transactions/
# Response: {"detail":"Authentication credentials were not provided."}
```

### Data Isolation Testing

#### 1. Create User A and User B

Register two separate users and get their tokens.

#### 2. Create Transaction as User A

```bash
curl -X POST http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tx_id": "TXN_A_001",
    "amount_received": "25.00",
    "rider_profit": "20.00",
    "platform_debt": "5.00",
    "platform": "YANGO",
    "is_tip": false
  }'
```

#### 3. Verify User B Cannot See It

```bash
curl -X GET http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer USER_B_TOKEN"
# Should return empty results array
```

### Complete Test Script

Create a file `test_api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api"

echo "🧪 Testing Sidekick API"
echo "========================"

# Test 1: Register User A
echo "1. Registering User A..."
REGISTER_A=$(curl -s -X POST $BASE_URL/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usera@example.com",
    "username": "usera@example.com",
    "password": "TestPass123",
    "password2": "TestPass123"
  }')

echo "User A registered: $REGISTER_A"

# Test 2: Login User A
echo "2. Logging in User A..."
LOGIN_A=$(curl -s -X POST $BASE_URL/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usera@example.com",
    "password": "TestPass123"
  }')

TOKEN_A=$(echo $LOGIN_A | jq -r '.access')
echo "User A token: ${TOKEN_A:0:20}..."

# Test 3: Create transaction for User A
echo "3. Creating transaction for User A..."
TX_A=$(curl -s -X POST $BASE_URL/transactions/ \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "tx_id": "TXN_A_001",
    "amount_received": "25.00",
    "rider_profit": "20.00",
    "platform_debt": "5.00",
    "platform": "YANGO",
    "is_tip": false
  }')

echo "Transaction created: $TX_A"

# Test 4: Register and login User B
echo "4. Registering User B..."
curl -s -X POST $BASE_URL/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "userb@example.com",
    "username": "userb@example.com",
    "password": "TestPass123",
    "password2": "TestPass123"
  }' > /dev/null

LOGIN_B=$(curl -s -X POST $BASE_URL/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "userb@example.com",
    "password": "TestPass123"
  }')

TOKEN_B=$(echo $LOGIN_B | jq -r '.access')

# Test 5: Verify data isolation
echo "5. Checking data isolation..."
USER_A_DATA=$(curl -s -X GET $BASE_URL/transactions/ \
  -H "Authorization: Bearer $TOKEN_A")

USER_B_DATA=$(curl -s -X GET $BASE_URL/transactions/ \
  -H "Authorization: Bearer $TOKEN_B")

echo "User A transactions: $(echo $USER_A_DATA | jq '.count')"
echo "User B transactions: $(echo $USER_B_DATA | jq '.count')"

if [ "$(echo $USER_A_DATA | jq '.count')" = "1" ] && [ "$(echo $USER_B_DATA | jq '.count')" = "0" ]; then
  echo "✅ Data isolation test PASSED"
else
  echo "❌ Data isolation test FAILED"
fi

echo "🎉 API testing complete!"
```

Make executable and run:

```bash
chmod +x test_api.sh
./test_api.sh
```

## 📊 Data Models

### Transaction Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tx_id` | string | Yes | Unique transaction identifier |
| `amount_received` | decimal | Yes | Total amount received |
| `rider_profit` | decimal | Yes | Driver's profit after fees |
| `platform_debt` | decimal | Yes | Platform fees owed |
| `platform` | string | Yes | YANGO, BOLT, or PRIVATE |
| `is_tip` | boolean | No | Whether this is a tip |

### Expense Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | decimal | Yes | Expense amount |
| `category` | string | Yes | FUEL, DATA, FOOD, REPAIR |
| `description` | string | No | Expense description |

### User Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Unique username |
| `email` | string | Yes | Unique email address |
| `password` | string | Yes | Hashed password |

## 🚨 Error Responses

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Resource deleted successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Access denied (though shouldn't happen with proper auth)
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "detail": "Error message here"
}
```

Or for validation errors:

```json
{
  "field_name": ["Error message 1", "Error message 2"]
}
```

## 🔧 Rate Limiting

Currently no rate limiting is implemented, but consider adding for production:

- Authentication endpoints: 5 attempts per minute
- API endpoints: 100 requests per minute per user

## 📝 API Versioning

Current API version: v1

All endpoints are prefixed with `/api/`. Future versions will use `/api/v2/`, etc.

## 🔒 Security Notes

- All endpoints validate JWT tokens
- Data is automatically filtered by authenticated user
- Passwords are hashed with Argon2
- HTTPS required in production
- CORS configured for mobile clients
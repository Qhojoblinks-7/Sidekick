# Sidekick SaaS - API Testing Guide

## Prerequisites

Make sure your Django server is running:
```bash
cd backend
python manage.py runserver
```

---

## 1️⃣ Register a New Driver

**Endpoint:** `POST /api/auth/register/`

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver1@example.com",
    "username": "driver1@example.com",
    "password": "SecurePassword123",
    "password2": "SecurePassword123"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Driver registered successfully"
}
```

---

## 2️⃣ Login and Get Tokens

**Endpoint:** `POST /api/auth/login/`

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "driver1@example.com",
    "password": "SecurePassword123"
  }'
```

**Expected Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Save these tokens for the next steps:**
```bash
ACCESS_TOKEN="your_access_token_here"
REFRESH_TOKEN="your_refresh_token_here"
```

---

## 3️⃣ Test User Data Isolation - Create Transaction

**Endpoint:** `POST /api/transactions/`

This endpoint requires authentication.

```bash
curl -X POST http://localhost:8000/api/transactions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "tx_id": "TXN001",
    "amount_received": 50.00,
    "rider_profit": 45.00,
    "platform_debt": 5.00,
    "platform": "YANGO",
    "is_tip": false
  }'
```

**Expected Response (201):**
```json
{
  "id": 1,
  "username": "driver1@example.com",
  "tx_id": "TXN001",
  "amount_received": "50.00",
  "rider_profit": "45.00",
  "platform_debt": "5.00",
  "platform": "YANGO",
  "is_tip": false,
  "created_at": "2026-01-21T10:30:00Z"
}
```

---

## 4️⃣ Test User Data Isolation - View Own Transactions

**Endpoint:** `GET /api/transactions/`

```bash
curl -X GET http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "username": "driver1@example.com",
    "tx_id": "TXN001",
    "amount_received": "50.00",
    "rider_profit": "45.00",
    "platform_debt": "5.00",
    "platform": "YANGO",
    "is_tip": false,
    "created_at": "2026-01-21T10:30:00Z"
  }
]
```

---

## 5️⃣ Test Unauthorized Access (No Token)

```bash
curl -X GET http://localhost:8000/api/transactions/
```

**Expected Response (401):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 6️⃣ Test Invalid Token

```bash
curl -X GET http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected Response (401):**
```json
{
  "detail": "Given token not valid for any token type"
}
```

---

## 7️⃣ Create Expense

**Endpoint:** `POST /api/expenses/`

```bash
curl -X POST http://localhost:8000/api/expenses/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "category": "FUEL",
    "amount": 20.00,
    "description": "Filled up diesel"
  }'
```

**Expected Response (201):**
```json
{
  "id": 1,
  "username": "driver1@example.com",
  "category": "FUEL",
  "amount": "20.00",
  "description": "Filled up diesel",
  "created_at": "2026-01-21T10:35:00Z"
}
```

---

## 8️⃣ Get Daily Summary

**Endpoint:** `GET /api/summary/daily/`

```bash
curl -X GET http://localhost:8000/api/summary/daily/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "net_profit": 25.00,
  "total_profit": 45.00,
  "total_expenses": 20.00,
  "total_debt": 5.00
}
```

---

## 9️⃣ Refresh Access Token

**Endpoint:** `POST /api/auth/refresh/`

When your access token expires, use the refresh token:

```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "'$REFRESH_TOKEN'"
  }'
```

**Expected Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## 🔟 Test User Isolation - Register 2nd Driver

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver2@example.com",
    "username": "driver2@example.com",
    "password": "SecurePassword123",
    "password2": "SecurePassword123"
  }'
```

Login as driver2:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "driver2@example.com",
    "password": "SecurePassword123"
  }'
```

Save the new `ACCESS_TOKEN` for driver2.

**Test: Driver2 should NOT see Driver1's transactions:**

```bash
curl -X GET http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer $DRIVER2_ACCESS_TOKEN"
```

**Expected Response (200):**
```json
[]  # Empty list - driver2 has no transactions
```

---

## ✅ Security Test Checklist

Run these in order to validate your SaaS security:

- [ ] Register without token → 400 Bad Request (missing fields)
- [ ] Login with wrong password → 401 Unauthorized
- [ ] Access transaction without token → 401 Unauthorized
- [ ] Access transaction with invalid token → 401 Unauthorized
- [ ] Create transaction without auth → 401 Unauthorized
- [ ] Driver1 cannot see Driver2's data
- [ ] Driver2 cannot see Driver1's data
- [ ] Refresh token generates new access token
- [ ] Old access token fails after refresh
- [ ] Get daily summary returns only current user's data

---

## 🧪 Automated Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:8000/api"
EMAIL="test-$(date +%s)@example.com"
PASSWORD="TestPass123"

echo "=== Sidekick SaaS API Test ==="
echo ""

# 1. Register
echo "1. Registering driver..."
REG_RESPONSE=$(curl -s -X POST "$API_URL/auth/register/" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"username\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"password2\":\"$PASSWORD\"}")
echo $REG_RESPONSE
echo ""

# 2. Login
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login/" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access":"[^"]*' | cut -d'"' -f4)
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# 3. Create transaction
echo "3. Creating transaction..."
curl -s -X POST "$API_URL/transactions/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"tx_id":"TEST001","amount_received":50,"rider_profit":45,"platform_debt":5,"platform":"YANGO"}'
echo ""
echo ""

# 4. Get transactions
echo "4. Fetching transactions..."
curl -s -X GET "$API_URL/transactions/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# 5. Test isolation (no token)
echo "5. Testing isolation (no token)..."
curl -s -X GET "$API_URL/transactions/" | jq '.'
echo ""

echo "=== All tests complete ==="
```

Run with: `bash test-api.sh`

---

## 📊 Expected JWT Token Structure

Decode your JWT at [jwt.io](https://jwt.io/):

**Access Token Payload:**
```json
{
  "token_type": "access",
  "exp": 1674052200,
  "iat": 1674048600,
  "jti": "abc123def456",
  "user_id": 1,
  "username": "driver1@example.com",
  "email": "driver1@example.com"
}
```

**Refresh Token Payload:**
```json
{
  "token_type": "refresh",
  "exp": 1674653400,
  "iat": 1674048600,
  "jti": "xyz789uvw012",
  "user_id": 1
}
```

---

## 🐛 Troubleshooting

### "Port 8000 already in use"
```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

### "No module named 'rest_framework_simplejwt'"
```bash
pip install djangorestframework-simplejwt
```

### "Invalid token"
- Make sure you copied the full access token
- Check token hasn't expired (exp field in JWT)
- Try refreshing: `POST /api/auth/refresh/` with refresh token

### "User data not isolated"
- Check `backend/transactions/views.py` has `.filter(user=self.request.user)`
- Run migrations: `python manage.py migrate`
- Check user field exists: `python manage.py sqlmigrate transactions 0002`

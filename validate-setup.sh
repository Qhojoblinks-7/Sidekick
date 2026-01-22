#!/bin/bash

# Sidekick SaaS - Setup Validation Script

echo "=== Sidekick Security Setup Validator ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1 (MISSING)"
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/"
  else
    echo -e "${RED}✗${NC} $1/ (MISSING)"
  fi
}

# Backend checks
echo "Backend Files:"
check_file "backend/config/settings.py"
check_file "backend/config/urls.py"
check_file "backend/api/__init__.py"
check_file "backend/api/serializers.py"
check_file "backend/api/views.py"
check_file "backend/api/urls.py"
check_file "backend/transactions/models.py"
check_file "backend/transactions/serializers.py"
check_file "backend/transactions/views.py"
check_file "backend/transactions/urls.py"
check_file "backend/transactions/migrations/0002_add_user_field.py"
check_file "backend/requirements.txt"
check_file "backend/.env.example"

echo ""
echo "Frontend Files:"
check_file "mobile/app/_layout.jsx"
check_file "mobile/app/index.jsx"
check_file "mobile/app/auth.jsx"
check_file "mobile/services/apiService.js"
check_file "mobile/contexts/AuthContext.js"
check_file "mobile/hooks/useAuth.js"
check_file "mobile/hooks/useSecureData.js"
check_file "mobile/app/(tabs)/settings.jsx"
check_file "mobile/package.json"
check_file "mobile/.env.example"

echo ""
echo "Documentation:"
check_file "SETUP_GUIDE.md"
check_file "SECURITY_IMPLEMENTATION.md"

echo ""
echo "=== Dependency Check ==="

# Check Python packages (if venv is active)
if command -v pip &> /dev/null; then
  echo "Required Python packages:"
  pip list 2>/dev/null | grep -E "djangorestframework-simplejwt|argon2" || echo -e "${YELLOW}ℹ${NC} Run: pip install -r requirements.txt"
fi

# Check Node packages
if [ -f "mobile/package.json" ]; then
  echo ""
  echo "Mobile dependencies:"
  if grep -q "expo-secure-store" "mobile/package.json"; then
    echo -e "${GREEN}✓${NC} expo-secure-store"
  else
    echo -e "${RED}✗${NC} expo-secure-store (add to package.json)"
  fi
fi

echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Backend Setup:"
echo "   cd backend"
echo "   python -m venv venv"
echo "   source venv/bin/activate"
echo "   pip install -r requirements.txt"
echo "   python manage.py migrate"
echo "   python manage.py runserver"
echo ""
echo "2. Mobile Setup:"
echo "   cd mobile"
echo "   cp .env.example .env"
echo "   npm install"
echo "   npm start"
echo ""
echo "3. Test Authentication:"
echo "   Open README_TESTING.md for curl commands"
echo ""

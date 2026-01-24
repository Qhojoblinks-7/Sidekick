from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.views import APIView

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that accepts email as username."""

    def post(self, request, *args, **kwargs):
        # Allow login with email as username
        print(f"Login attempt: {request.data}")
        if 'username' in request.data and '@' in request.data['username']:
            email = request.data['username']
            user = User.objects.filter(email=email).first()
            print(f"User lookup by email '{email}': {user}")
            if user:
                print(f"User found: {user.username}, is_active: {user.is_active}")
                request.data['username'] = user.username
            else:
                print(f"No user found with email '{email}'")
        return super().post(request, *args, **kwargs)

class RegisterDriverView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def post(self, request):
        """Register a new driver."""
        try:
            email = request.data.get('email')
            username = request.data.get('username', email)  # Use email as username if not provided
            password = request.data.get('password')
            password2 = request.data.get('password2')

            if not all([email, password, password2]):
                return Response(
                    {'error': 'Email, password, and password confirmation are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if password != password2:
                return Response(
                    {'error': 'Passwords do not match'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if len(password) < 8:
                return Response(
                    {'error': 'Password must be at least 8 characters long'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'Email already registered'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if User.objects.filter(username=username).exists():
                return Response(
                    {'error': 'Username already taken'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            print(f"Created user: {user.username}, is_active: {user.is_active}")

            return Response(
                {'message': 'Driver registered successfully'},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

register_driver = RegisterDriverView.as_view()

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for deployment monitoring."""
    return Response({"status": "healthy", "service": "sidekick-backend"})

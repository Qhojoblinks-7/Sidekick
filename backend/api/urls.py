from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, register_driver

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', register_driver, name='register_driver'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

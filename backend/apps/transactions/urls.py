from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, ExpenseViewSet, DailySummaryView

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet)
router.register(r'expenses', ExpenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('daily-summary/', DailySummaryView.as_view(), name='daily-summary'),
]
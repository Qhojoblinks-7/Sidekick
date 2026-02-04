from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, ExpenseViewSet, DailySummaryView, PeriodSummaryView, ClearDebtView

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
    path('summary/daily/', DailySummaryView.as_view(), name='daily-summary'),
    path('summary/period/', PeriodSummaryView.as_view(), name='period-summary'),
    path('debt/clear/', ClearDebtView.as_view(), name='clear-debt'),
]
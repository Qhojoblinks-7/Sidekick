import logging
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.db.models import Sum
from django.contrib.auth.models import User
from .models import Transaction, Expense
from .serializers import TransactionSerializer, ExpenseSerializer
from datetime import date, datetime

logger = logging.getLogger(__name__)

class IsAuthenticatedOrSMSBridge(BasePermission):
    """
    Allow authenticated users, or POST requests from localhost (for SMS bridge)
    """
    def has_permission(self, request, view):
        if request.method == 'POST' and request.META.get('REMOTE_ADDR') in ['127.0.0.1', 'localhost']:
            return True
        return request.user and request.user.is_authenticated


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticatedOrSMSBridge]

    def get_queryset(self):
        # Filter transactions by current user only
        logger.info(f"TransactionViewSet get_queryset called by user: {self.request.user}")
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign user on creation
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            # For SMS bridge, assign to first user (for testing)
            first_user = User.objects.first()
            serializer.save(user=first_user)




class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter expenses by current user only
        logger.info(f"ExpenseViewSet get_queryset called by user: {self.request.user}")
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign user on creation
        logger.info(f"ExpenseViewSet perform_create called by user: {self.request.user}")
        serializer.save(user=self.request.user)


class DailySummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        logger.info(f"DailySummaryView get called by user: {request.user}")
        today = date.today()

        # Calculate Total Profit from Trips (user's data only)
        total_profit = (
            Transaction.objects.filter(user=request.user, created_at__date=today).aggregate(
                Sum("rider_profit")
            )["rider_profit__sum"]
            or 0
        )

        # Calculate Total Expenses (user's data only)
        total_expenses = (
            Expense.objects.filter(user=request.user, created_at__date=today).aggregate(Sum("amount"))[
                "amount__sum"
            ]
            or 0
        )

        # Calculate Total Debt owed to Bolt/Yango (user's data only)
        total_debt = (
            Transaction.objects.filter(user=request.user, created_at__date=today).aggregate(
                Sum("platform_debt")
            )["platform_debt__sum"]
            or 0
        )

        return Response(
            {
                "net_profit": float(total_profit - total_expenses),
                "total_debt": float(total_debt),
                "expenses": float(total_expenses),
            }
        )


class PeriodSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            return Response({'error': 'start_date and end_date are required'}, status=400)

        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            return Response({'error': 'Invalid date format'}, status=400)

        # Calculate Total Profit from Trips
        total_profit = (
            Transaction.objects.filter(user=request.user, created_at__range=(start, end)).aggregate(
                Sum("rider_profit")
            )["rider_profit__sum"]
            or 0
        )

        # Calculate Total Expenses
        total_expenses = (
            Expense.objects.filter(user=request.user, created_at__range=(start, end)).aggregate(Sum("amount"))[
                "amount__sum"
            ]
            or 0
        )

        # Calculate Total Debt
        total_debt = (
            Transaction.objects.filter(user=request.user, created_at__range=(start, end)).aggregate(
                Sum("platform_debt")
            )["platform_debt__sum"]
            or 0
        )

        # Calculate incomes per platform
        yango_income = Transaction.objects.filter(user=request.user, platform='YANGO', created_at__range=(start, end)).aggregate(Sum("rider_profit"))["rider_profit__sum"] or 0
        bolt_income = Transaction.objects.filter(user=request.user, platform='BOLT', created_at__range=(start, end)).aggregate(Sum("rider_profit"))["rider_profit__sum"] or 0

        # Calculate debts per platform
        yango_debt = Transaction.objects.filter(user=request.user, platform='YANGO', created_at__range=(start, end)).aggregate(Sum("platform_debt"))["platform_debt__sum"] or 0
        bolt_debt = Transaction.objects.filter(user=request.user, platform='BOLT', created_at__range=(start, end)).aggregate(Sum("platform_debt"))["platform_debt__sum"] or 0

        return Response({
            "yango_income": float(yango_income),
            "bolt_income": float(bolt_income),
            "expenses": float(total_expenses),
            "yango_debt": float(yango_debt),
            "bolt_debt": float(bolt_debt),
            "net_profit": float(total_profit - total_expenses),
            "total_debt": float(total_debt),
        })

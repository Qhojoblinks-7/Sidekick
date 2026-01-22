import logging
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from .models import Transaction, Expense
from .serializers import TransactionSerializer, ExpenseSerializer
from datetime import date

logger = logging.getLogger(__name__)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter transactions by current user only
        logger.info(f"TransactionViewSet get_queryset called by user: {self.request.user}")
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign user on creation
        serializer.save(user=self.request.user)


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter expenses by current user only
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign user on creation
        logger.info(f"TransactionViewSet perform_create called by user: {self.request.user}")
        serializer.save(user=self.request.user)


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

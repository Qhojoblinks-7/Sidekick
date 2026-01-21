from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import Transaction, Expense
from .serializers import TransactionSerializer, ExpenseSerializer
from datetime import date


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer


class DailySummaryView(APIView):
    def get(self, request):
        today = date.today()

        # Calculate Total Profit from Trips
        total_profit = (
            Transaction.objects.filter(created_at__date=today).aggregate(
                Sum("rider_profit")
            )["rider_profit__sum"]
            or 0
        )

        # Calculate Total Expenses
        total_expenses = (
            Expense.objects.filter(created_at__date=today).aggregate(Sum("amount"))[
                "amount__sum"
            ]
            or 0
        )

        # Calculate Total Debt owed to Bolt/Yango
        total_debt = (
            Transaction.objects.filter(created_at__date=today).aggregate(
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

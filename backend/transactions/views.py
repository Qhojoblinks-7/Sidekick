import logging
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny
from django.db.models import Sum
from django.db import models
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
        queryset = Transaction.objects.filter(user=self.request.user)
        count = queryset.count()
        logger.info(f"TransactionViewSet returning {count} transactions for user {self.request.user.id}")
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        logger.info(f"TransactionViewSet list response data: {response.data}")
        return response

    def perform_create(self, serializer):
        # Automatically assign user on creation
        if self.request.user.is_authenticated:
            logger.info(f"perform_create: Saving transaction for user: {self.request.user.id} ({self.request.user.username})")
            serializer.save(user=self.request.user)
        else:
            # For SMS bridge, assign to first user (for testing)
            first_user = User.objects.first()
            logger.warning(f"perform_create: No authenticated user, assigning to first user: {first_user.id if first_user else 'None'}")
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


class ClearDebtView(APIView):
    """
    Clear platform debt by creating offset transactions
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.info(f"ClearDebtView called by user: {user.id}")

        try:
            # Get current total debt
            current_debt = Transaction.objects.filter(user=user).aggregate(
                total_debt=Sum('platform_debt')
            )['total_debt'] or 0

            if current_debt == 0:
                return Response({
                    'success': True,
                    'message': 'No debt to clear',
                    'amount_cleared': 0
                })

            # Create offset transactions for each platform
            yango_debt = Transaction.objects.filter(
                user=user, platform='YANGO'
            ).aggregate(total=Sum('platform_debt'))['total'] or 0

            bolt_debt = Transaction.objects.filter(
                user=user, platform='BOLT'
            ).aggregate(total=Sum('platform_debt'))['total'] or 0

            cleared_count = 0

            # Create Yango debt offset if there's Yango debt
            if yango_debt > 0:
                Transaction.objects.create(
                    user=user,
                    tx_id=f'debt-clear-yango-{int(datetime.now().timestamp())}',
                    amount_received=0,
                    rider_profit=0,
                    platform_debt=-yango_debt,  # Negative debt to offset
                    platform='YANGO',
                    department='INVESTMENT',
                    is_tip=False,
                    tip_amount=0,
                    created_at=datetime.now()
                )
                cleared_count += 1
                logger.info(f"Created Yango debt offset: {yango_debt}")

            # Create Bolt debt offset if there's Bolt debt
            if bolt_debt > 0:
                Transaction.objects.create(
                    user=user,
                    tx_id=f'debt-clear-bolt-{int(datetime.now().timestamp())}',
                    amount_received=0,
                    rider_profit=0,
                    platform_debt=-bolt_debt,  # Negative debt to offset
                    platform='BOLT',
                    department='REVENUE',
                    is_tip=False,
                    tip_amount=0,
                    created_at=datetime.now()
                )
                cleared_count += 1
                logger.info(f"Created Bolt debt offset: {bolt_debt}")

            return Response({
                'success': True,
                'message': f'Debt cleared with {cleared_count} offset transaction(s)',
                'amount_cleared': float(current_debt)
            })

        except Exception as e:
            logger.error(f"Error clearing debt: {e}")
            return Response({
                'success': False,
                'message': f'Error clearing debt: {str(e)}'
            }, status=400)


class DailySummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.info(f"DailySummaryView get called by user: {request.user}")
        
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return Response({
                "net_profit": 0,
                "total_debt": 0,
                "expenses": 0,
                "yango_income": 0,
                "bolt_income": 0,
                "yango_debt": 0,
                "bolt_debt": 0,
            })
        
        today = date.today()
        user = request.user

        try:
            # OPTIMIZED: Single query for all transaction aggregates with platform grouping
            # This replaces 6 separate queries with 1 query using conditional aggregation
            transaction_aggs = Transaction.objects.filter(
                user=user, 
                created_at__date=today
            ).aggregate(
                total_profit=Sum("rider_profit"),
                total_debt=Sum("platform_debt"),
                yango_profit=Sum("rider_profit", filter=models.Q(platform='YANGO')),
                bolt_profit=Sum("rider_profit", filter=models.Q(platform='BOLT')),
                yango_debt=Sum("platform_debt", filter=models.Q(platform='YANGO')),
                bolt_debt=Sum("platform_debt", filter=models.Q(platform='BOLT')),
            )
            
            total_profit = transaction_aggs["total_profit"] or 0
            total_debt = transaction_aggs["total_debt"] or 0
            yango_income = transaction_aggs["yango_profit"] or 0
            bolt_income = transaction_aggs["bolt_profit"] or 0
            yango_debt = transaction_aggs["yango_debt"] or 0
            bolt_debt = transaction_aggs["bolt_debt"] or 0

            # Single query for expenses
            expenses_aggs = Expense.objects.filter(
                user=user, 
                created_at__date=today
            ).aggregate(total_expenses=Sum("amount"))
            total_expenses = expenses_aggs["total_expenses"] or 0

            net_profit = float(total_profit - total_expenses)
            
            logger.info(f"[CALC_DEBUG] DailySummary - Final calculations: net_profit={net_profit}, total_debt={float(total_debt)}, expenses={float(total_expenses)}")
            return Response({
                "net_profit": net_profit,
                "total_debt": float(total_debt),
                "expenses": float(total_expenses),
                "yango_income": float(yango_income),
                "bolt_income": float(bolt_income),
                "yango_debt": float(yango_debt),
                "bolt_debt": float(bolt_debt),
            })
        except Exception as e:
            logger.error(f"[CALC_DEBUG] DailySummary - Error: {e}")
            return Response({
                "net_profit": 0,
                "total_debt": 0,
                "expenses": 0,
                "yango_income": 0,
                "bolt_income": 0,
                "yango_debt": 0,
                "bolt_debt": 0,
            })


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

        logger.info(f"[PERIOD_DEBUG] PeriodSummary request by user: {request.user.id}")
        logger.info(f"[PERIOD_DEBUG] Date range: start={start}, end={end}")

        # Check total transactions for user
        total_user_transactions = Transaction.objects.filter(user=request.user).count()
        logger.info(f"[PERIOD_DEBUG] Total transactions for user: {total_user_transactions}")

        # Check transactions in date range
        transactions_in_range = Transaction.objects.filter(user=request.user, created_at__range=(start, end))
        logger.info(f"[PERIOD_DEBUG] Transactions in range: {transactions_in_range.count()}")

        # Calculate Total Profit from Trips
        profit_query = Transaction.objects.filter(user=request.user, created_at__range=(start, end)).aggregate(
            Sum("rider_profit")
        )
        total_profit = profit_query["rider_profit__sum"] or 0
        logger.info(f"[PERIOD_DEBUG] Total profit query result: {profit_query}, total_profit: {total_profit}")

        # Calculate Total Expenses
        expenses_query = Expense.objects.filter(user=request.user, created_at__range=(start, end)).aggregate(Sum("amount"))
        total_expenses = expenses_query["amount__sum"] or 0
        logger.info(f"[CALC_DEBUG] PeriodSummary - Total expenses query result: {expenses_query}, total_expenses: {total_expenses}")

        # Calculate Total Debt
        debt_query = Transaction.objects.filter(user=request.user, created_at__range=(start, end)).aggregate(
            Sum("platform_debt")
        )
        total_debt = debt_query["platform_debt__sum"] or 0
        logger.info(f"[CALC_DEBUG] PeriodSummary - Total debt query result: {debt_query}, total_debt: {total_debt}")

        # Calculate incomes per platform
        yango_income_query = Transaction.objects.filter(user=request.user, platform='YANGO', created_at__range=(start, end)).aggregate(Sum("rider_profit"))
        yango_income = yango_income_query["rider_profit__sum"] or 0
        bolt_income_query = Transaction.objects.filter(user=request.user, platform='BOLT', created_at__range=(start, end)).aggregate(Sum("rider_profit"))
        bolt_income = bolt_income_query["rider_profit__sum"] or 0
        logger.info(f"[CALC_DEBUG] PeriodSummary - Yango income: {yango_income}, Bolt income: {bolt_income}")

        # Calculate debts per platform
        yango_debt_query = Transaction.objects.filter(user=request.user, platform='YANGO', created_at__range=(start, end)).aggregate(Sum("platform_debt"))
        yango_debt = yango_debt_query["platform_debt__sum"] or 0
        bolt_debt_query = Transaction.objects.filter(user=request.user, platform='BOLT', created_at__range=(start, end)).aggregate(Sum("platform_debt"))
        bolt_debt = bolt_debt_query["platform_debt__sum"] or 0
        logger.info(f"[CALC_DEBUG] PeriodSummary - Yango debt: {yango_debt}, Bolt debt: {bolt_debt}")

        net_profit = float(total_profit - total_expenses)
        logger.info(f"[CALC_DEBUG] PeriodSummary - Final calculations: net_profit={net_profit}, total_debt={float(total_debt)}, expenses={float(total_expenses)}")
        return Response({
            "yango_income": float(yango_income),
            "bolt_income": float(bolt_income),
            "expenses": float(total_expenses),
            "yango_debt": float(yango_debt),
            "bolt_debt": float(bolt_debt),
            "net_profit": net_profit,
            "total_debt": float(total_debt),
        })

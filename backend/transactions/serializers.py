import logging
from django.utils import timezone
from rest_framework import serializers
from .models import Transaction, Expense

logger = logging.getLogger(__name__)


class TransactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'username', 'tx_id', 'amount_received', 'rider_profit', 'platform_debt', 'platform', 'is_tip', 'created_at', 'trip_price', 'bonuses', 'system_fees', 'gross_total']
        read_only_fields = ['user']

    def validate_created_at(self, value):
        """Handle both string and datetime inputs for created_at"""
        from datetime import datetime
        if isinstance(value, str):
            # Parse ISO string and make timezone-aware if naive
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt)
                return dt
            except ValueError:
                # Fallback to current time
                return timezone.now()
        return value

    def create(self, validated_data):
        # Check for duplicate tx_id across all users
        tx_id = validated_data.get('tx_id')
        if tx_id:
            try:
                existing = Transaction.objects.get(tx_id=tx_id)
                logger.info(f"Duplicate transaction with tx_id: {tx_id}, returning existing")
                return existing
            except Transaction.DoesNotExist:
                pass

        # Automatically assign user from request if not already set
        if 'user' not in validated_data:
            validated_data['user'] = self.context['request'].user

        # Ensure created_at is set (fallback to now if not provided)
        if 'created_at' not in validated_data or validated_data['created_at'] is None:
            validated_data['created_at'] = timezone.now()

        # If trip_price is provided, calculate the derived fields
        if 'trip_price' in validated_data and validated_data['trip_price'] is not None:
            trip_price = validated_data['trip_price']
            bonuses = validated_data.get('bonuses', 0)
            system_fees = validated_data.get('system_fees', 0)

            gross_total = trip_price + bonuses
            amount_received = gross_total
            rider_profit = trip_price + bonuses + system_fees
            platform_debt = -system_fees

            validated_data['gross_total'] = gross_total
            validated_data['amount_received'] = amount_received
            validated_data['rider_profit'] = rider_profit
            validated_data['platform_debt'] = platform_debt

        return super().create(validated_data)


class ExpenseSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'username', 'amount', 'category', 'description', 'created_at']
        read_only_fields = ['user']

    def validate_created_at(self, value):
        """Handle both string and datetime inputs for created_at"""
        from datetime import datetime
        if isinstance(value, str):
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt)
                return dt
            except ValueError:
                return timezone.now()
        return value

    def create(self, validated_data):
        # Automatically assign user from request
        if 'user' not in validated_data:
            validated_data['user'] = self.context['request'].user
        
        # Ensure created_at is set
        if 'created_at' not in validated_data or validated_data['created_at'] is None:
            validated_data['created_at'] = timezone.now()
            
        return super().create(validated_data)
import logging
from django.utils import timezone
from rest_framework import serializers
from .models import Transaction, Expense

logger = logging.getLogger(__name__)


class TransactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'username', 'tx_id', 'amount_received', 'rider_profit', 'platform_debt', 'platform', 'is_tip', 'tip_amount', 'created_at', 'trip_price', 'bonuses', 'system_fees', 'gross_total']
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
        current_user = validated_data.get('user')
        logger.info(f"[SERIALIZER] create called with tx_id: {tx_id}, user: {current_user}")
        
        if tx_id:
            try:
                existing = Transaction.objects.get(tx_id=tx_id)
                logger.info(f"[SERIALIZER] Duplicate transaction found with tx_id: {tx_id}, existing user: {existing.user.id}")
                logger.info(f"[SERIALIZER] Returning existing transaction (not creating new one)")
                return existing
            except Transaction.DoesNotExist:
                logger.info(f"[SERIALIZER] No duplicate found for tx_id: {tx_id}, proceeding with creation")
            except Transaction.MultipleObjectsReturned:
                logger.warning(f"[SERIALIZER] Multiple transactions found for tx_id: {tx_id}, using first")
                existing = Transaction.objects.filter(tx_id=tx_id).first()
                logger.info(f"[SERIALIZER] Returning first existing transaction (not creating new one)")
                return existing

        # Automatically assign user from request if not already set
        if 'user' not in validated_data:
            if 'request' in self.context:
                validated_data['user'] = self.context['request'].user
                logger.info(f"[SERIALIZER] Assigned user from request context: {self.context['request'].user.id}")
            else:
                logger.error("[SERIALIZER] No request context and no user in validated_data!")
                raise serializers.ValidationError("Unable to determine user for transaction")

        # Ensure created_at is set (fallback to now if not provided)
        if 'created_at' not in validated_data or validated_data['created_at'] is None:
            validated_data['created_at'] = timezone.now()

        logger.info(f"[SERIALIZER] Creating new transaction with validated_data: user={validated_data.get('user')}")
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
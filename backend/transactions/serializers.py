import os
import hashlib
import hmac
import logging
from django.utils import timezone
from django.conf import settings
from rest_framework import serializers
from .models import Transaction, Expense

logger = logging.getLogger(__name__)


def compute_request_hash(tx_id, amount, platform, secret_key=None):
    """
    Compute HMAC-SHA256 hash for transaction request validation.
    
    Args:
        tx_id: Transaction reference ID
        amount: Transaction amount
        platform: Platform name (YANGO, BOLT, PRIVATE)
        secret_key: Optional secret key (uses settings.SECRET_KEY if not provided)
    
    Returns:
        Hexadecimal hash string
    """
    if secret_key is None:
        secret_key = getattr(settings, 'SMS_API_SECRET', settings.SECRET_KEY)
    
    # Create canonical message
    message = f"{tx_id}:{amount}:{platform}"
    
    # Compute HMAC
    hash_obj = hmac.new(
        secret_key.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    )
    
    return hash_obj.hexdigest()


def verify_request_hash(tx_id, amount, platform, provided_hash, secret_key=None):
    """
    Verify HMAC hash from mobile request.
    
    Args:
        tx_id: Transaction reference ID
        amount: Transaction amount
        platform: Platform name
        provided_hash: Hash provided by mobile app
        secret_key: Optional secret key
    
    Returns:
        True if hash matches, False otherwise
    """
    expected_hash = compute_request_hash(tx_id, amount, platform, secret_key)
    
    # Use constant-time comparison to prevent timing attacks
    return hmac.compare_digest(expected_hash, provided_hash)


class TransactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    request_hash = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'username', 'tx_id', 'amount_received', 'rider_profit', 
            'platform_debt', 'platform', 'is_tip', 'tip_amount', 'created_at', 
            'trip_price', 'bonuses', 'system_fees', 'gross_total', 'request_hash'
        ]
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

    def validate(self, data):
        """
        Validate request hash for SMS transactions.
        This prevents fake transaction injection from malicious users.
        """
        # Only validate hash if it's an SMS transaction (has tx_id)
        if data.get('tx_id') and data.get('request_hash'):
            tx_id = data.get('tx_id')
            amount = data.get('amount_received', 0)
            platform = data.get('platform', 'UNKNOWN')
            provided_hash = data.get('request_hash')
            
            logger.info(f"[SERIALIZER] Validating hash for tx_id: {tx_id}")
            
            # Verify hash
            is_valid = verify_request_hash(tx_id, amount, platform, provided_hash)
            
            if not is_valid:
                logger.warning(f"[SERIALIZER] Hash validation failed for tx_id: {tx_id}")
                # In production, you might want to reject invalid hashes
                # For now, we log and allow (backward compatibility)
                if getattr(settings, 'SMS_HASH_STRICT_MODE', False):
                    raise serializers.ValidationError({
                        'request_hash': 'Invalid request hash. Transaction may be tampered.'
                    })
            
            # Remove hash from validated data (not stored in model)
            data.pop('request_hash', None)
        
        return data

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
    request_hash = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'username', 'amount', 'category', 'description', 'created_at', 'request_hash']
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

    def validate(self, data):
        """Validate request hash for expense transactions."""
        if data.get('amount') and data.get('request_hash'):
            # For expenses, we use a different message format
            amount = data.get('amount', 0)
            category = data.get('category', 'General')
            description = data.get('description', '')[:50]  # First 50 chars
            
            provided_hash = data.get('request_hash')
            
            # Compute hash for expense
            message = f"EXPENSE:{amount}:{category}:{description}"
            secret_key = getattr(settings, 'SMS_API_SECRET', settings.SECRET_KEY)
            
            hash_obj = hmac.new(
                secret_key.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            )
            expected_hash = hash_obj.hexdigest()
            
            if not hmac.compare_digest(expected_hash, provided_hash):
                logger.warning(f"[SERIALIZER] Expense hash validation failed")
                if getattr(settings, 'SMS_HASH_STRICT_MODE', False):
                    raise serializers.ValidationError({
                        'request_hash': 'Invalid request hash.'
                    })
            
            data.pop('request_hash', None)
        
        return data

    def create(self, validated_data):
        # Automatically assign user from request
        if 'user' not in validated_data:
            validated_data['user'] = self.context['request'].user
        
        # Ensure created_at is set
        if 'created_at' not in validated_data or validated_data['created_at'] is None:
            validated_data['created_at'] = timezone.now()
            
        return super().create(validated_data)

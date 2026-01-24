from rest_framework import serializers
from .models import Transaction, Expense


class TransactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'username', 'tx_id', 'amount_received', 'rider_profit', 'platform_debt', 'platform', 'is_tip', 'created_at']
        read_only_fields = ['user', 'created_at']

    def create(self, validated_data):
        # Automatically assign user from request if not already set
        if 'user' not in validated_data:
            validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ExpenseSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'username', 'amount', 'category', 'description', 'created_at']
        read_only_fields = ['user', 'created_at']

    def create(self, validated_data):
        # Automatically assign user from request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
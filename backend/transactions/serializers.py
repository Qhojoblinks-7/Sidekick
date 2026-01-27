from rest_framework import serializers
from .models import Transaction, Expense


class TransactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'username', 'tx_id', 'amount_received', 'rider_profit', 'platform_debt', 'platform', 'is_tip', 'created_at', 'trip_price', 'bonuses', 'system_fees', 'gross_total']
        read_only_fields = ['user']

    def create(self, validated_data):
        # Automatically assign user from request if not already set
        if 'user' not in validated_data:
            validated_data['user'] = self.context['request'].user

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

    def create(self, validated_data):
        # Automatically assign user from request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
from rest_framework import serializers
from .models import Transaction, Expense


class TransactionSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()

    def get_status(self, obj):
        if obj.rider_profit > 50:
            return 'High Tip!'
        elif obj.platform_debt > 0:
            return 'Pending Subtraction'
        else:
            return 'Verified'

    class Meta:
        model = Transaction
        fields = "__all__"


class ExpenseSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()

    def get_status(self, obj):
        return 'Expense'

    class Meta:
        model = Expense
        fields = "__all__"

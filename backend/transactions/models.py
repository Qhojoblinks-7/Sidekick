from django.db import models
from django.contrib.auth.models import User


class Transaction(models.Model):
    PLATFORM_CHOICES = [
        ("YANGO", "Yango"),
        ("BOLT", "Bolt"),
        ("PRIVATE", "Private"),
    ]

    # User association for data isolation - REQUIRED for SaaS
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')

    tx_id = models.CharField(max_length=100, unique=True)  # From MoMo SMS
    amount_received = models.DecimalField(max_digits=10, decimal_places=2)

    # New fields for detailed breakdown
    trip_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    system_fees = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gross_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # The Split Logic
    rider_profit = models.DecimalField(max_digits=10, decimal_places=2)
    platform_debt = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    platform = models.CharField(
        max_length=10, choices=PLATFORM_CHOICES, default="YANGO"
    )
    is_tip = models.BooleanField(default=False)

    created_at = models.DateTimeField()

    def __str__(self):
        return f"{self.user.username} - {self.platform} - GHS {self.amount_received} ({self.tx_id})"


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ("FUEL", "Fuel"),
        ("DATA", "Data"),
        ("FOOD", "Food"),
        ("REPAIRS", "Repairs"),
        ("OTHER", "Other"),
    ]

    # User association for data isolation - REQUIRED for SaaS
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField()

    def __str__(self):
        return f"{self.user.username} - {self.category} - GHS {self.amount}"

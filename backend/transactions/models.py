from django.db import models
from django.contrib.auth.models import User


class Transaction(models.Model):
    PLATFORM_CHOICES = [
        ("YANGO", "Yango"),
        ("BOLT", "Bolt"),
        ("PRIVATE", "Private"),
    ]

    DEPARTMENT_CHOICES = [
        ("INVESTMENT", "Investment"),
        ("REVENUE", "Revenue"),
        ("OTHER", "Other"),
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
        max_length=10, choices=PLATFORM_CHOICES, default="YANGO", db_index=True
    )
    department = models.CharField(
        max_length=20, choices=DEPARTMENT_CHOICES, default="REVENUE"
    )
    is_tip = models.BooleanField(default=False)
    tip_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(db_index=True)

    def save(self, *args, **kwargs):
        if self.platform == 'YANGO':
            self.department = 'INVESTMENT'
        elif self.platform == 'BOLT':
            self.department = 'REVENUE'
        else:
            self.department = 'OTHER'
        super().save(*args, **kwargs)

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
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, db_index=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(db_index=True)

    def __str__(self):
        return f"{self.user.username} - {self.category} - GHS {self.amount}"

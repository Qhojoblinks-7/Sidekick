#!/usr/bin/env python
import os
import django
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from transactions.models import Transaction, Expense
from django.contrib.auth.models import User
import datetime

def create_sample_data():
    # Get or create test user
    user, created = User.objects.get_or_create(username='test@example.com', defaults={'email':'test@example.com'})
    if created:
        user.set_password('password123')
        user.save()
        print('Created test user')

    # Create sample transactions
    transactions_data = [
        {'tx_id': 'tx1', 'amount_received': 50.0, 'rider_profit': 45.0, 'platform_debt': 5.0, 'platform': 'YANGO'},
        {'tx_id': 'tx2', 'amount_received': 60.0, 'rider_profit': 55.0, 'platform_debt': 5.0, 'platform': 'BOLT'},
        {'tx_id': 'tx3', 'amount_received': 40.0, 'rider_profit': 38.0, 'platform_debt': 2.0, 'platform': 'YANGO'},
        {'tx_id': 'tx4', 'amount_received': 70.0, 'rider_profit': 65.0, 'platform_debt': 5.0, 'platform': 'BOLT'},
        {'tx_id': 'tx5', 'amount_received': 55.0, 'rider_profit': 50.0, 'platform_debt': 5.0, 'platform': 'YANGO'},
    ]

    for data in transactions_data:
        tx, created = Transaction.objects.get_or_create(tx_id=data['tx_id'], defaults={**data, 'user': user})
        if created:
            print(f'Created transaction {data["tx_id"]}')

    # Create sample expenses
    expenses_data = [
        {'amount': 20.0, 'category': 'FUEL', 'description': 'Fuel expense'},
        {'amount': 15.0, 'category': 'DATA', 'description': 'Data bundle'},
        {'amount': 10.0, 'category': 'FOOD', 'description': 'Lunch'},
        {'amount': 25.0, 'category': 'REPAIR', 'description': 'Bike repair'},
    ]

    for data in expenses_data:
        exp, created = Expense.objects.get_or_create(
            user=user,
            amount=data['amount'],
            category=data['category'],
            defaults={'description': data['description']}
        )
        if created:
            print(f'Created expense {data["category"]}')

    print('Sample data created successfully')

if __name__ == '__main__':
    create_sample_data()
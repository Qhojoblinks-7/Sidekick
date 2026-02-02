import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from transactions.models import Transaction, Expense
from django.contrib.auth.models import User

print('=== Database Status ===')
print(f'Users: {User.objects.count()}')
print(f'Transactions: {Transaction.objects.count()}')
print(f'Expenses: {Expense.objects.count()}')

if User.objects.count() == 0:
    print('\nDatabase is empty!')
    print('Open the mobile app and create an account to get started.')

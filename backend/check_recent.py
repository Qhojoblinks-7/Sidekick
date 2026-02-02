import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from transactions.models import Transaction
from django.contrib.auth.models import User
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime, timedelta

print('=== Recent Transactions (Last 24 hours) ===')

# Get all transactions from last 24 hours
recent = Transaction.objects.all().order_by('-created_at')
print(f'Total transactions: {recent.count()}')

for tx in recent[:10]:
    print(f'\n{tx.created_at}')
    print(f'  User ID: {tx.user_id}')
    print(f'  Platform: {tx.platform}')
    print(f'  Amount Received: {tx.amount_received}')
    print(f'  Rider Profit: {tx.rider_profit}')
    print(f'  Platform Debt (D): {tx.platform_debt}')
    print(f'  Trip Price: {tx.trip_price}')
    print(f'  Bonuses: {tx.bonuses}')
    print(f'  System Fees: {tx.system_fees}')
    print(f'  Gross Total: {tx.gross_total}')

# Get user ID for immanueleshun9@gmail.com
user = User.objects.filter(username='immanueleshun9@gmail.com').first()
if user:
    print(f'\n=== Your Account ===')
    print(f'User ID: {user.id}')
    print(f'Username: {user.username}')

    your_txs = Transaction.objects.filter(user=user).order_by('-created_at')
    print(f'Your transactions: {your_txs.count()}')

    if your_txs.exists():
        print('\nYour recent transactions:')
        for tx in your_txs[:5]:
            print(f'  {tx.created_at}: {tx.platform} - D={tx.platform_debt}')
    else:
        print('\n⚠️  You have no transactions saved to your account!')
        print('This might indicate:')
        print('  1. Authentication issue - session not linked to user')
        print('  2. Transactions saved to wrong user')
        print('  3. Database not synced')

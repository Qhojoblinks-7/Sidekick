import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from transactions.models import Transaction
from django.contrib.auth.models import User
from django.db.models import Sum

print('=== Database Check ===')
print('User count:', User.objects.count())
print('Transaction count:', Transaction.objects.count())

# List all users
users = User.objects.all()
print('\nAll users:', list(users.values_list('username', flat=True)))

# Check for Yango transactions
yango_txs = Transaction.objects.filter(platform='YANGO')
print(f'\nTotal Yango transactions: {yango_txs.count()}')

if yango_txs.count() > 0:
    print('\nRecent Yango transactions:')
    for tx in yango_txs[:10]:
        print(f'  - User: {tx.user.username}')
        print(f'    platform_debt: {tx.platform_debt}')
        print(f'    system_fees: {tx.system_fees}')
        print(f'    rider_profit: {tx.rider_profit}')
        print(f'    created_at: {tx.created_at}')
        print()
    
    # Sum platform_debt for Yango
    yango_debt = Transaction.objects.filter(platform='YANGO').aggregate(total=Sum('platform_debt'))
    print(f'Total Yango debt: {yango_debt["total"]}')
else:
    print('\nNo Yango transactions found!')

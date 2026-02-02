import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from transactions.models import Transaction
from django.contrib.auth.models import User
from django.db.models import Sum

print('=== All Users and Their Transactions ===')

for user in User.objects.all().order_by('-id'):
    print(f'\nUser: {user.username} (id={user.id})')
    txs = Transaction.objects.filter(user=user)
    print(f'  Transactions: {txs.count()}')

    yango_txs = txs.filter(platform='YANGO')
    bolt_txs = txs.filter(platform='BOLT')

    if yango_txs.exists():
        yango_debt = yango_txs.aggregate(Sum('platform_debt'))
        print(f'  Yango: {yango_txs.count()} txns, total debt: {yango_debt["platform_debt__sum"]}')

        print('  Recent Yango transactions:')
        for tx in yango_txs.order_by('-created_at')[:3]:
            print(f'    - {tx.created_at.date()}: D={tx.platform_debt}, P={tx.rider_profit}')
    else:
        print('  Yango: 0 transactions')

    if bolt_txs.exists():
        bolt_debt = bolt_txs.aggregate(Sum('platform_debt'))
        print(f'  Bolt: {bolt_txs.count()} txns, total debt: {bolt_debt["platform_debt__sum"]}')
    else:
        print('  Bolt: 0 transactions')

print('\n=== Summary ===')
total = Transaction.objects.aggregate(
    yango=Sum('platform_debt', filter=__import__('django.db.models').Q(platform='YANGO')),
    bolt=Sum('platform_debt', filter=__import__('django.db.models').Q(platform='BOLT')),
)
print(f'Total Yango debt: {total["yango"] or 0}')
print(f'Total Bolt debt: {total["bolt"] or 0}')

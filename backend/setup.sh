#!/bin/bash
# Django setup and migration script

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running migrations..."
python manage.py migrate

echo "Creating superuser (optional)..."
python manage.py createsuperuser

echo "Starting Django development server..."
python manage.py runserver 0.0.0.0:8000

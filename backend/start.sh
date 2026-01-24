#!/bin/bash
# Run migrations
python manage.py migrate --noinput

# Start the application
gunicorn --bind 0.0.0.0:8000 config.wsgi:application
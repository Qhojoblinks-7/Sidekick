# Sidekick Documentation

Welcome to the official documentation for Sidekick, a secure SaaS platform for ride-sharing drivers to track transactions and expenses.

## 📖 Documentation Overview

This documentation is organized to help you understand, develop, deploy, and contribute to the Sidekick platform.

### 🚀 Getting Started

- **[Quick Start](development.md#quick-start)** - Get the project running in 5 minutes
- **[Architecture](architecture.md)** - Understand the system design
- **[API Reference](api.md)** - Complete API documentation

### 🛠️ Development

- **[Development Guide](development.md)** - Setup, coding standards, and workflows
- **[Contributing](contributing.md)** - How to contribute to the project
- **[Testing](api.md#testing)** - API testing and validation

### 🚢 Deployment

- **[Deployment Guide](deployment.md)** - Production deployment instructions
- **[Security](security-implementation.md)** - Security implementation details

## 📋 Table of Contents

| Section | Description |
|---------|-------------|
| [Architecture](architecture.md) | System architecture, data flow, and component relationships |
| [API Reference](api.md) | REST API endpoints, authentication, and examples |
| [Development](development.md) | Development setup, guidelines, and best practices |
| [Deployment](deployment.md) | Production deployment and configuration |
| [Contributing](contributing.md) | Contribution guidelines and code standards |
| [Security](security-implementation.md) | Security implementation and best practices |
| [Setup Guide](setup-guide.md) | Complete setup and configuration guide |
| [API Testing](api-testing.md) | API testing examples and scripts |

## 🎯 Project Overview

Sidekick is a multi-tenant SaaS platform designed for ride-sharing drivers to:

- **Track Transactions**: Record ride payments, tips, and platform fees
- **Manage Expenses**: Log fuel, maintenance, and other business costs
- **View Analytics**: Monitor daily/weekly earnings and spending
- **Secure Data**: Complete data isolation between drivers

### Key Features

- 🔐 **Enterprise Security**: JWT authentication with hardware-encrypted tokens
- 🛡️ **Data Isolation**: Each driver sees only their own data
- 📱 **Cross-Platform**: Native iOS and Android apps via React Native
- ⚡ **Real-time**: Live data synchronization
- 📊 **Analytics**: Comprehensive financial tracking

### Technology Stack

- **Backend**: Django REST Framework + PostgreSQL
- **Frontend**: React Native + Expo
- **Authentication**: JWT with automatic token refresh
- **Security**: Argon2 password hashing, CORS, HTTPS
- **Deployment**: Railway/Render (backend), EAS Build (mobile)

## 🆘 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- 🐛 **Bugs**: Please report bugs with detailed reproduction steps

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
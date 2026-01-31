# Sidekick - Ride-Sharing Driver Financial Tracker

## Introduction of the System

Sidekick is a secure, multi-tenant SaaS platform designed specifically for ride-sharing drivers to efficiently track their transactions and expenses. The system provides enterprise-grade authentication and complete data isolation between driver accounts, ensuring privacy and security. Built as a cross-platform mobile application with a Django REST Framework backend, Sidekick enables drivers to monitor their earnings, manage expenses, and maintain financial records through automated SMS processing and manual entry capabilities.

The platform addresses the common challenges faced by ride-sharing drivers, including inconsistent income tracking, expense management, and the need for accurate financial reporting. By leveraging SMS integration with popular ride-sharing platforms like Uber, Bolt, and Yango, Sidekick automates transaction recording while providing a user-friendly interface for manual adjustments and comprehensive financial analytics.

## User Requirements Definition

### Primary Users
- **Ride-Sharing Drivers**: Individual drivers who need to track income from multiple platforms and manage business expenses.

### User Stories
1. As a driver, I want to automatically capture ride earnings from SMS notifications so that I don't have to manually enter each transaction.
2. As a driver, I want to manually add expenses (fuel, maintenance, tolls) so that I can track all business costs.
3. As a driver, I want to view my daily/weekly/monthly earnings summary so that I can monitor my income trends.
4. As a driver, I want to categorize my expenses so that I can understand where my money is going.
5. As a driver, I want to set financial goals and track progress so that I can plan my earnings targets.
6. As a driver, I want my data to be completely private and secure so that other drivers cannot access my information.
7. As a driver, I want the app to work offline and sync when connected so that I can use it in areas with poor network coverage.

### Functional Requirements
- User registration and authentication
- SMS permission and automated transaction processing
- Manual transaction and expense entry
- Financial dashboard with summaries and analytics
- Transaction history with filtering and search
- Expense categorization and reporting
- Data export capabilities
- Settings management for app preferences

### Non-Functional Requirements
- Security: Enterprise-grade authentication with JWT tokens
- Performance: Real-time data synchronization
- Usability: Intuitive mobile interface
- Reliability: Offline functionality with conflict resolution
- Privacy: Complete data isolation between users
- Scalability: Multi-tenant architecture supporting multiple drivers

## System Requirements Specification

### Functional Requirements

#### Authentication & Security
- **FR1**: User registration with email verification
- **FR2**: JWT-based authentication with automatic token refresh
- **FR3**: Secure password hashing using Argon2
- **FR4**: Complete data isolation between user accounts
- **FR5**: HTTPS encryption for all data transmission

#### Transaction Management
- **FR6**: Automated SMS processing for ride-sharing platforms (Uber, Bolt, Yango)
- **FR7**: Manual transaction entry with validation
- **FR8**: Transaction categorization and tagging
- **FR9**: Transaction editing and deletion capabilities
- **FR10**: Duplicate transaction prevention

#### Expense Tracking
- **FR11**: Manual expense entry with categories
- **FR12**: Expense categorization (fuel, maintenance, tolls, etc.)
- **FR13**: Expense history with filtering options

#### Analytics & Reporting
- **FR14**: Real-time dashboard with earnings summaries
- **FR15**: Period-based filtering (daily, weekly, monthly)
- **FR16**: Financial goal setting and progress tracking
- **FR17**: Data export functionality

#### Mobile Features
- **FR18**: Cross-platform compatibility (iOS/Android)
- **FR19**: Offline data storage and synchronization
- **FR20**: Push notifications for important updates
- **FR21**: Theme customization (light/dark mode)

### Non-Functional Requirements

#### Performance
- **NFR1**: App startup time < 3 seconds
- **NFR2**: SMS processing < 2 seconds per message
- **NFR3**: Dashboard load time < 1 second
- **NFR4**: Support for 1000+ transactions per user

#### Security
- **NFR5**: End-to-end encryption for sensitive data
- **NFR6**: Rate limiting on authentication endpoints
- **NFR7**: Secure storage of authentication tokens
- **NFR8**: Regular security audits and updates

#### Usability
- **NFR9**: Intuitive navigation with tab-based interface
- **NFR10**: Consistent design language across platforms
- **NFR11**: Accessibility compliance (WCAG 2.1)
- **NFR12**: Multi-language support (English primary)

#### Reliability
- **NFR13**: 99.9% uptime for backend services
- **NFR14**: Offline functionality for core features
- **NFR15**: Automatic data backup and recovery
- **NFR16**: Error handling with user-friendly messages

#### Scalability
- **NFR17**: Horizontal scaling support for backend
- **NFR18**: Database optimization for large datasets
- **NFR19**: CDN integration for static assets

#### Compatibility
- **NFR20**: iOS 12+ and Android 8+ support
- **NFR21**: React Native 0.70+ compatibility
- **NFR22**: Django 4.0+ backend framework

## Technology Stack

- **Backend**: Django REST Framework, PostgreSQL
- **Frontend**: React Native, Expo
- **Authentication**: JWT with automatic refresh
- **Database**: PostgreSQL with multi-tenant isolation
- **Deployment**: Railway/Render (backend), EAS Build (mobile)
- **Security**: Argon2 hashing, HTTPS, CORS

## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Expo CLI
- PostgreSQL (for production)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Mobile Setup
```bash
cd mobile
npm install
cp .env.example .env
npm start
```

## API Documentation

Complete API documentation is available in `docs/api.md`, including endpoints for:
- Authentication (register, login, refresh)
- Transaction management (CRUD operations)
- Expense tracking
- User settings

## Testing

Run the validation script to ensure proper setup:
```bash
bash validate-setup.sh
```

## Deployment

- **Backend**: Deploy to Railway, Render, or Heroku
- **Mobile**: Use EAS Build for App Store and Play Store distribution
- **Database**: Managed PostgreSQL instance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the coding standards
4. Add tests for new features
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Documentation: `docs/` directory
- Issues: GitHub Issues
- Email: [project maintainer contact]

---

**Empowering ride-sharing drivers with financial control and transparency.**

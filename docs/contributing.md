# Contributing Guide

Welcome! We appreciate your interest in contributing to Sidekick. This guide will help you get started with development and contribution workflows.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## 🤝 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- Git
- Expo CLI

### Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/sidekick.git
   cd sidekick
   ```

2. **Follow the development setup**
   See [Development Guide](development.md) for complete setup instructions.

3. **Run the validation script**
   ```bash
   bash validate-setup.sh
   ```

## 🔄 Development Workflow

### 1. Choose an Issue

- Check [GitHub Issues](https://github.com/your-repo/issues) for open tasks
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch

```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 3. Make Changes

- Write clear, focused commits
- Test your changes thoroughly
- Update documentation if needed
- Follow the coding standards below

### 4. Test Your Changes

```bash
# Backend tests
cd backend && python manage.py test

# Frontend tests
cd mobile && npm test

# Integration tests
bash validate-setup.sh
```

### 5. Submit a Pull Request

- Push your branch to GitHub
- Create a pull request with a clear description
- Reference any related issues
- Wait for review and address feedback

## 💻 Coding Standards

### Python (Backend)

#### Code Style

- Follow [PEP 8](https://pep8.org/) style guide
- Use [Black](https://black.readthedocs.io/) for formatting
- Maximum line length: 88 characters
- Use descriptive variable names

#### Example

```python
# Good
def get_user_transactions(user_id: int, date_from: date = None) -> QuerySet:
    """Get transactions for a user within date range."""
    queryset = Transaction.objects.filter(user_id=user_id)
    if date_from:
        queryset = queryset.filter(created_at__gte=date_from)
    return queryset

# Bad
def get_trans(user, d=None):
    q = Transaction.objects.filter(user=user)
    if d:
        q = q.filter(created_at__gte=d)
    return q
```

#### Django Best Practices

- Use `select_related()` and `prefetch_related()` for optimization
- Follow REST API conventions
- Use Django's built-in authentication
- Write comprehensive docstrings

### JavaScript/React Native (Frontend)

#### Code Style

- Use [Prettier](https://prettier.io/) for formatting
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for new components (optional but encouraged)
- Use functional components with hooks

#### Example

```jsx
// Good
const TransactionItem = ({ transaction, onPress }) => {
  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Text style={styles.amount}>
        {formatCurrency(transaction.amount)}
      </Text>
      <Text style={styles.description}>
        {transaction.description}
      </Text>
    </TouchableOpacity>
  );
};

// Bad
const TransactionItem = ({transaction, onPress}) => (
  <TouchableOpacity onPress={onPress}>
    <Text>${transaction.amount}</Text>
    <Text>{transaction.description}</Text>
  </TouchableOpacity>
);
```

#### React Best Practices

- Use custom hooks for reusable logic
- Implement proper error boundaries
- Use React Query for data fetching
- Follow component composition patterns

## 🧪 Testing

### Backend Testing

```python
# Example test
from django.test import TestCase
from rest_framework.test import APITestCase
from .models import Transaction

class TransactionModelTest(TestCase):
    def test_transaction_creation(self):
        """Test that transactions can be created with valid data."""
        transaction = Transaction.objects.create(
            tx_id="TEST_001",
            amount_received=25.00,
            rider_profit=20.00,
            platform_debt=5.00,
            platform="YANGO"
        )
        self.assertEqual(transaction.tx_id, "TEST_001")
        self.assertEqual(float(transaction.amount_received), 25.00)
```

### Frontend Testing

```jsx
// Example test
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TransactionItem from '../components/TransactionItem';

const mockTransaction = {
  id: 1,
  amount: 25.00,
  description: 'Test transaction'
};

test('renders transaction correctly', () => {
  const { getByText } = render(
    <TransactionItem transaction={mockTransaction} />
  );

  expect(getByText('$25.00')).toBeTruthy();
  expect(getByText('Test transaction')).toBeTruthy();
});
```

### Testing Requirements

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and user flows
- **E2E Tests**: Test complete user journeys (future)
- **Coverage**: Aim for 80%+ code coverage

## 📝 Submitting Changes

### Commit Messages

Follow [Conventional Commits](https://conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add JWT token refresh functionality

fix(api): resolve transaction filtering bug

docs(api): update endpoint documentation

test(transactions): add model validation tests
```

### Pull Request Process

1. **Create PR**
   - Use descriptive title
   - Reference related issues
   - Provide clear description of changes

2. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   Add screenshots of UI changes

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

3. **Review Process**
   - Automated checks must pass
   - At least one reviewer approval required
   - Address all review comments
   - Squash commits before merge

## 🐛 Reporting Issues

### Bug Reports

**Good Bug Report:**
- Clear title describing the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, etc.)
- Screenshots/logs if applicable

**Example:**
```
Title: Login form doesn't validate email format

Description:
When entering an invalid email during registration, the form accepts it without validation.

Steps to reproduce:
1. Go to registration screen
2. Enter "invalid-email" in email field
3. Click register
4. Form submits without error

Expected: Form should show validation error
Actual: Form submits and shows success message

Environment: iOS 15, Expo SDK 47
```

### Feature Requests

**Good Feature Request:**
- Clear description of the feature
- Use case and benefits
- Mockups or examples if applicable
- Acceptance criteria

## 🎯 Contribution Areas

### High Priority

- **Security**: Authentication improvements, data validation
- **Performance**: API optimization, mobile app performance
- **Testing**: Increase test coverage, add E2E tests
- **Documentation**: API docs, user guides

### Good First Issues

- UI component improvements
- Code refactoring
- Documentation updates
- Simple bug fixes
- Test coverage improvements

### Advanced Contributions

- Architecture improvements
- New feature development
- Performance optimization
- Security enhancements
- DevOps improvements

## 📞 Getting Help

- **Documentation**: Check [docs/](index.md) first
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (if available)

## 🙏 Recognition

Contributors are recognized through:
- GitHub contributor statistics
- Mention in release notes
- Contributor spotlight (for major contributions)
- Co-author credits on commits

Thank you for contributing to Sidekick! Your efforts help make ride-sharing more transparent and fair for drivers worldwide. 🚗💨
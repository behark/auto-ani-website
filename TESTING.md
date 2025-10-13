# Testing Guide

This project includes comprehensive testing setup with Jest and React Testing Library.

## Test Structure

```
├── __tests__/
│   ├── integration/           # Integration tests
│   │   ├── vehicle-browsing.test.tsx
│   │   └── api-health.test.ts
├── components/
│   ├── vehicles/
│   │   └── __tests__/
│   │       └── VehicleCard.test.tsx
│   └── forms/
│       └── __tests__/
│           └── VehicleInquiryForm.test.tsx
└── app/api/
    └── health/
        └── __tests__/
            └── route.test.ts
```

## Test Types

### Unit Tests
Test individual components and functions in isolation.

### Integration Tests
Test how different parts of the application work together.

### API Tests
Test API endpoints and their responses.

## Available Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only component tests
npm run test:components

# Run only API tests
npm run test:api

# Run all tests (unit + integration)
npm run test:all

# Debug tests
npm run test:debug

# CI/CD testing
npm run test:ci
```

## Test Configuration

### Jest Configuration
- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Global test setup and mocks

### Key Features
- TypeScript support
- Next.js integration
- React Testing Library
- Coverage reporting
- Mock implementations for external dependencies

## Writing Tests

### Component Tests
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import YourComponent from '../YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent prop="value" />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const user = userEvent.setup()
    render(<YourComponent />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Updated Text')).toBeInTheDocument()
  })
})
```

### API Tests
```typescript
import { GET } from '../route'

describe('/api/endpoint', () => {
  it('returns expected response', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('expectedField')
  })
})
```

## Mocking

### Common Mocks
- Next.js router and navigation
- External APIs
- Database connections
- Environment variables
- Browser APIs (IntersectionObserver, matchMedia)

### Mock Examples
```typescript
// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
}))

// Mock API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mock data' }),
  })
)
```

## Coverage

The test suite includes coverage reporting for:
- Statements
- Branches
- Functions
- Lines

Coverage reports are generated in:
- Console output
- HTML report (`coverage/lcov-report/index.html`)
- LCOV format for CI/CD integration

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Component Testing
- Test user-visible behavior, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features

### API Testing
- Test both success and error scenarios
- Verify response structure and status codes
- Test security features (CSRF, rate limiting)

### Integration Testing
- Test complete user workflows
- Verify data flow between components
- Test state management

## Debugging Tests

### Debug Mode
```bash
npm run test:debug
```

### VS Code Integration
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Continuous Integration

The `test:ci` script is optimized for CI/CD environments:
- Runs without watch mode
- Generates coverage reports
- Fails on coverage thresholds (if configured)

## Adding New Tests

1. Create test files with `.test.tsx` or `.test.ts` extension
2. Place them in `__tests__` directories or alongside source files
3. Follow existing patterns and naming conventions
4. Update this documentation if adding new test types

## Performance Testing

For performance-sensitive components:
- Use `jest.setTimeout()` for longer operations
- Mock heavy dependencies
- Test rendering performance with large datasets

## Security Testing

The test suite includes security-focused tests:
- CSRF protection
- Rate limiting
- Input sanitization
- XSS prevention
- Authentication flows

## Troubleshooting

### Common Issues
- **Tests timeout**: Increase timeout or mock async operations
- **Module not found**: Check Jest module name mapping in config
- **Mock not working**: Ensure mock is defined before import
- **Coverage gaps**: Add tests for uncovered branches/functions

### Getting Help
- Check Jest documentation: https://jestjs.io/
- React Testing Library guides: https://testing-library.com/
- Review existing tests for patterns
- Use `--verbose` flag for detailed output
# Testing Guide

## Test Types
- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user flows
- **Visual Tests**: Test UI consistency

## Running Tests
- All tests: `npm test`
- Unit only: `npm run test:unit`
- E2E: `npm run test:e2e`
- Coverage: `npm run test:coverage`

## Writing Tests
- Use Vitest for unit/integration
- Use Playwright for E2E
- Aim for 80%+ coverage
- Test edge cases and errors

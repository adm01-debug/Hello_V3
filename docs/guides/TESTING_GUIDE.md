# Testing Guide

## Unit Testing
```typescript
describe('Calculator', () => {
  it('should add numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

## Integration Testing
```typescript
it('should create user via API', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ name: 'John' });
  expect(response.status).toBe(201);
});
```

## E2E Testing
```typescript
test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'test@example.com');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
});
```

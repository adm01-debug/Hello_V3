import { faker } from '@faker-js/faker'

export function createCall(overrides = {}) {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    duration: faker.number.int({ min: 60, max: 3600 }),
    status: 'completed',
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  }
}

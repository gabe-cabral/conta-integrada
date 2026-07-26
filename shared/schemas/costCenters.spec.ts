import { describe, expect, it } from 'vitest';

import { costCenterCreateSchema, costCenterUpdateSchema } from './costCenters.js';

const categoryId = '507f1f77bcf86cd799439011';

describe('cost center schemas', () => {
  it('accepts a complete cost center', () => {
    const result = costCenterCreateSchema.safeParse({
      name: 'Marketing',
      description: 'Campanhas e eventos',
      limit: {
        amountInCents: 0,
        currency: 'BRL',
        period: 'monthly',
      },
      categoryIds: [categoryId],
      active: true,
    });

    expect(result.success).toBe(true);
  });

  it('rejects duplicate categories and names over 50 characters', () => {
    expect(
      costCenterCreateSchema.safeParse({
        name: 'a'.repeat(51),
        categoryIds: [categoryId, categoryId],
        active: true,
      }).success,
    ).toBe(false);
  });

  it('allows removing an existing limit in an update', () => {
    expect(costCenterUpdateSchema.safeParse({ limit: null }).success).toBe(true);
  });
});

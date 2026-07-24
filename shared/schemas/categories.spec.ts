import { describe, expect, it } from 'vitest';

import {
  categoryCreateSchema,
  customUserCategoryCreateSchema,
  userCategoryUpdateSchema,
} from './categories.js';
import {
  getLocalizedCategoryName,
  normalizeCategoryName,
} from '../utils/categories.js';

const category = {
  name: {
    'en': 'Transportation',
    'es': 'Transporte',
    'pt-BR': 'Transporte',
  },
  active: true,
  color: '#5096de',
  parentId: null,
  kind: 'EXPENSE' as const,
  level: 'CATEGORY' as const,
};

describe('category schemas', () => {
  it('accepts a translated root category', () => {
    expect(categoryCreateSchema.parse(category)).toEqual(category);
  });

  it('requires an activity to have a parent category', () => {
    const result = categoryCreateSchema.safeParse({
      ...category,
      level: 'ACTIVITY',
    });

    expect(result.success).toBe(false);
  });

  it('requires a custom category name', () => {
    const result = customUserCategoryCreateSchema.safeParse({
      ...category,
      name: '',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a color update', () => {
    expect(userCategoryUpdateSchema.parse({ color: '#5f6caf' })).toEqual({
      color: '#5f6caf',
    });
  });
});

describe('category localization', () => {
  it('uses the exact locale and falls back to English', () => {
    expect(getLocalizedCategoryName(category.name, 'pt-BR')).toBe('Transporte');
    expect(getLocalizedCategoryName(category.name, 'fr')).toBe('Transportation');
  });

  it('normalizes whitespace, case and Unicode composition', () => {
    expect(normalizeCategoryName('  SAU\u0301DE ')).toBe('saúde');
  });
});

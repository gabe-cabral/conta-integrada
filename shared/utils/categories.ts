import type { CategoryName } from '../schemas/categories.js';

export function getLocalizedCategoryName(
  name: CategoryName,
  locale: string,
): string {
  if (locale in name) return name[locale as keyof CategoryName];

  const language = locale.split('-')[0];
  if (language && language in name) {
    return name[language as keyof CategoryName];
  }

  return name.en;
}

export function normalizeCategoryName(name: string): string {
  return name.trim().normalize('NFKC').toLocaleLowerCase('en');
}

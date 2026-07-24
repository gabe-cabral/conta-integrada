import { z } from 'zod';

import { CATEGORY_KINDS, CATEGORY_LEVELS } from '../constants/categories.js';
import { userAuditableRecordWithIdSchema } from '../zod/zodBase.js';
import { zodObjectId } from '../zod/mongodb.js';

export { CATEGORY_KINDS, CATEGORY_LEVELS } from '../constants/categories.js';

export const categoryKindSchema = z.enum(CATEGORY_KINDS);
export const categoryLevelSchema = z.enum(CATEGORY_LEVELS);

export const categoryNameSchema = z.strictObject({
  'en': z.string().trim().min(1).max(80),
  'es': z.string().trim().min(1).max(80),
  'pt-BR': z.string().trim().min(1).max(80),
});

const categoryFieldsSchema = z.strictObject({
  name: categoryNameSchema,
  active: z.boolean(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  parentId: zodObjectId.nullable(),
  kind: categoryKindSchema,
  level: categoryLevelSchema,
});

function validateCategoryHierarchy(
  category: Pick<z.infer<typeof categoryFieldsSchema>, 'level' | 'parentId'>,
  context: z.RefinementCtx,
) {
  if (category.level === 'CATEGORY' && category.parentId !== null) {
    context.addIssue({
      code: 'custom',
      path: ['parentId'],
      message: 'A category cannot have a parent',
    });
  }

  if (category.level === 'ACTIVITY' && category.parentId === null) {
    context.addIssue({
      code: 'custom',
      path: ['parentId'],
      message: 'An activity must have a parent category',
    });
  }
}

export const categorySchema = categoryFieldsSchema.extend({
  _id: zodObjectId,
}).superRefine(validateCategoryHierarchy);

export const categoryCreateSchema = categoryFieldsSchema
  .extend({ _id: zodObjectId.optional() })
  .superRefine(validateCategoryHierarchy);

export const categoryUpdateSchema = categoryFieldsSchema
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'At least one category field must be provided',
  });

const userCategoryFieldsSchema = z.strictObject({
  catalogCategoryId: zodObjectId.nullable(),
  parentId: zodObjectId.nullable(),
  name: z.string().trim().min(1).max(80).nullable(),
  active: z.boolean(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  kind: categoryKindSchema,
  level: categoryLevelSchema,
});

function validateUserCategorySource(
  category: Pick<
    z.infer<typeof userCategoryFieldsSchema>,
    'catalogCategoryId' | 'level' | 'name' | 'parentId'
  >,
  context: z.RefinementCtx,
) {
  const isCatalogCategory = category.catalogCategoryId !== null;

  if (isCatalogCategory && category.name !== null) {
    context.addIssue({
      code: 'custom',
      path: ['name'],
      message: 'A catalog category cannot override its name',
    });
  }

  if (!isCatalogCategory && category.name === null) {
    context.addIssue({
      code: 'custom',
      path: ['name'],
      message: 'A custom category must have a name',
    });
  }

  if (category.level === 'CATEGORY' && category.parentId !== null) {
    context.addIssue({
      code: 'custom',
      path: ['parentId'],
      message: 'A category cannot have a parent',
    });
  }

  if (category.level === 'ACTIVITY' && category.parentId === null) {
    context.addIssue({
      code: 'custom',
      path: ['parentId'],
      message: 'An activity must have a parent category',
    });
  }
}

export const userCategorySchema = userAuditableRecordWithIdSchema
  .extend(userCategoryFieldsSchema.shape)
  .superRefine(validateUserCategorySource);

export const userCategoryCreateSchema = userCategoryFieldsSchema
  .superRefine(validateUserCategorySource);

export const userCategoryAdoptSchema = z.strictObject({
  catalogCategoryId: zodObjectId,
  active: z.boolean().default(true),
});

export const customUserCategoryCreateSchema = userCategoryFieldsSchema
  .omit({ catalogCategoryId: true })
  .superRefine((category, context) => {
    validateUserCategorySource(
      { ...category, catalogCategoryId: null },
      context,
    );
  });

export const userCategoryUpdateSchema = z.strictObject({
  name: z.string().trim().min(1).max(80).optional(),
  active: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
}).refine((changes) => Object.keys(changes).length > 0, {
  message: 'At least one user category field must be provided',
});

export const categoryConfigurationSchema = z.strictObject({
  catalog: z.array(categorySchema),
  categories: z.array(userCategorySchema),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type CategoryName = z.infer<typeof categoryNameSchema>;
export type CategoryKind = z.infer<typeof categoryKindSchema>;
export type CategoryLevel = z.infer<typeof categoryLevelSchema>;
export type UserCategory = z.infer<typeof userCategorySchema>;
export type ResolvedUserCategory = Omit<UserCategory, 'name'> & {
  name: string
  source: 'system' | 'custom'
};
export type UserCategoryCreate = z.infer<typeof userCategoryCreateSchema>;
export type UserCategoryAdopt = z.infer<typeof userCategoryAdoptSchema>;
export type CustomUserCategoryCreate = z.infer<
  typeof customUserCategoryCreateSchema
>;
export type UserCategoryUpdate = z.infer<typeof userCategoryUpdateSchema>;
export type CategoryConfiguration = z.infer<typeof categoryConfigurationSchema>;

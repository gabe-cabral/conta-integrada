import type { Document } from 'mongodb';

export const categorySchema = {
  title: 'TransactionCategory',
  bsonType: 'object',
  properties: {
    _id: {
      bsonType: 'objectId',
      description: 'Category ID',
    },
    name: {
      bsonType: 'binData',
      description: 'Category\'s name',
    },
    active: {
      bsonType: 'bool',
      description: '`true` is this category is active',
    },
    color: {
      bsonType: ['null', 'string'],
      description: 'Category\'s color',
    },
    parentId: {
      bsonType: ['null', 'objectId'],
      description: 'Group ID',
    },
    kind: {
      bsonType: 'string',
      enum: [
        'ADJUSTMENT',
        'CONTRIBUTION',
        'DIVIDEND',
        'EXPENSE',
        'INCOME',
        'INTEREST',
        'INVESTMENT',
        'REDEMPTION',
        'REFUND',
        'TAX',
        'TRANSFER',
      ],
      description: 'TransactionType',
    },
    userId: {
      bsonType: 'objectId',
      description: 'Owner ID',
    },
  },
  required: ['_id', 'active', 'kind', 'name', 'userId'],
  additionalProperties: true,
} as Document;

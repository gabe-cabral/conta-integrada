import { z } from 'zod';
import { zodObjectId } from '../zod/mongodb.js';
import { dateStringToDate } from '../zod/zodDate.js';

export const auditableRecordSchema = z.strictObject({
  createdAt: dateStringToDate,
  updatedAt: dateStringToDate.nullable(),
});

export type AuditableRecordData = z.input<typeof auditableRecordSchema>;
export type AuditableRecord = z.infer<typeof auditableRecordSchema>;

export const userAuditableRecordSchema = auditableRecordSchema.extend({
  userId: zodObjectId,
});

export type UserAuditableRecordData = z.input<typeof userAuditableRecordSchema>;
export type UserAuditableRecord = z.infer<typeof userAuditableRecordSchema>;

export const userAuditableRecordWithIdSchema = auditableRecordSchema.extend({
  _id: zodObjectId,
  userId: zodObjectId,
});

export type UserAuditableRecordWithIdData = z.input<typeof userAuditableRecordWithIdSchema>;
export type UserAuditableRecordWithId = z.infer<typeof userAuditableRecordWithIdSchema>;

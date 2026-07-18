import type { AuditableRecord } from '../zod/zodBase.js';

export interface User extends AuditableRecord {
  _id: string
  email: string
  name: string
}

export interface DocumentOwner {
  userId: string
}

import type { AuditableRecord } from '../zod/zodBase.js';

export interface User extends AuditableRecord {
  _id: string
  active: boolean
  email: string
  lastAccessAt: Date | null
  name: string
}

export interface DocumentOwner {
  userId: string
}

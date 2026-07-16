import type { AuditableRecord } from './base';

export interface IdentityDocument {
  country: string
  type: string
  value: string
  hash: string
  primary: boolean
}

export interface Person extends AuditableRecord {
  _id: string
  name: string
}

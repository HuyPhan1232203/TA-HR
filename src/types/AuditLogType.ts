export interface IAuditLog {
  id: string
  module: string
  action: string
  entityName: string
  entityId: string
  description: string
  performedAtUtc: string
}

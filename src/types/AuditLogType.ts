export interface IAuditLog {
  id: string
  at: string
  actor: string
  action: string
  target: string
  ip: string
}

const VND = new Intl.NumberFormat('vi-VN')

export function fmtVND(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${VND.format(n)} ₫`
}

export function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—'
  return VND.format(n)
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}

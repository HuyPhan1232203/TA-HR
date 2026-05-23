import { useCallback, useState, type ReactNode } from 'react'
import { Modal } from './modal'
import { Button } from './button'

export interface ConfirmOptions {
  title?: string
  description?: string
  body?: ReactNode
  confirmText?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export interface UseConfirmResult {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  node: ReactNode
}

export function useConfirm(): UseConfirmResult {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setState({ ...opts, resolve })),
    [],
  )

  const close = (value: boolean) => {
    state?.resolve(value)
    setState(null)
  }

  const node = state ? (
    <Modal
      open
      onClose={() => close(false)}
      title={state.title ?? 'Xác nhận'}
      description={state.description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => close(false)}>
            Hủy
          </Button>
          <Button
            variant={state.danger ? 'destructive' : 'default'}
            onClick={() => close(true)}
          >
            {state.confirmText ?? 'Xác nhận'}
          </Button>
        </>
      }
    >
      <div className="text-sm text-muted-foreground">{state.body}</div>
    </Modal>
  ) : null

  return { confirm, node }
}

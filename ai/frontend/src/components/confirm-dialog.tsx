'use client'

type ConfirmDialogProps = {
  open: boolean
  title: string
  content?: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  danger?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  content,
  confirmLabel = '确认',
  cancelLabel = '取消',
  busy = false,
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="modal-card"
        role="dialog"
      >
        <div className="modal-header">
          <h3 className="modal-title" id="confirm-dialog-title">
            {title}
          </h3>
        </div>

        {content && <div className="modal-text">{content}</div>}

        <div className="modal-actions">
          <button className="button subtle" disabled={busy} onClick={onClose} type="button">
            {cancelLabel}
          </button>
          <button className={`button ${danger ? 'danger-solid' : ''}`} disabled={busy} onClick={() => void onConfirm()} type="button">
            {busy ? '处理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

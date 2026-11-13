import { useEffect, useRef } from 'react';

// Dialog konfirmasi bergaya Tailwind (pengganti window.confirm)
export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  danger = true,
  loading = false,
  onCancel,
  onConfirm,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !loading && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, loading]);

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink/50 px-4"
      onClick={() => !loading && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
              danger ? 'bg-red-50 text-heart' : 'bg-brand-soft text-brand'
            }`}
            aria-hidden="true"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {danger ? (
                <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5m4-5v5" />
              ) : (
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              )}
            </svg>
          </span>
          <div>
            <h2 id="confirm-title" className="text-lg font-extrabold leading-tight">{title}</h2>
            <p id="confirm-message" className="mt-1.5 text-sm text-ink-soft">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" className="btn-outline" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn text-white ${danger ? 'bg-heart hover:bg-red-600' : 'bg-red-500 hover:bg-red-600'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

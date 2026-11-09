import { useEffect, useRef } from 'react';

const AppDialog = ({ open, title, description, actions, onClose, busy = false }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose?.();
      if (event.key !== 'Tab') return;

      const controls = dialogRef.current?.querySelectorAll('button:not(:disabled)') || [];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const preferredFocus = dialogRef.current?.querySelector('[data-dialog-preferred="true"]')
      || dialogRef.current?.querySelector('button:not(:disabled)');
    preferredFocus?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <section
        ref={dialogRef}
        className="panel max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto p-5 shadow-xl sm:p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-description"
      >
        <h2 id="app-dialog-title" className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
        <p id="app-dialog-description" className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          {actions.map((action) => (
            <button
              data-dialog-preferred={
                action.variant === 'secondary' || (!actions.some((item) => item.variant === 'secondary') && action.variant === 'primary')
                  ? 'true'
                  : undefined
              }
              key={action.label}
              className={action.variant === 'danger' ? 'btn-danger' : action.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
              type="button"
              disabled={busy || action.disabled}
              onClick={action.onSelect}
            >
              {busy && action.loadingLabel ? action.loadingLabel : action.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AppDialog;

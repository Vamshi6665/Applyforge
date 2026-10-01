import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

/** Side sheet with focus handling and Escape to close. */
export default function Drawer({ open, title, onClose, children, footer, wide = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Focus the sheet once when it opens (not on every parent re-render,
  // which would steal focus from inputs inside it).
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="drawer-layer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={`drawer ${wide ? 'drawer--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header className="drawer__head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="drawer__body">{children}</div>
        {footer && <footer className="drawer__foot">{footer}</footer>}
      </aside>
    </div>
  );
}

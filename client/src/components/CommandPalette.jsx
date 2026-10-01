import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Ctrl/Cmd + K launcher. `actions` is a list of
 * { id, label, hint?, icon?, keys?, run, disabled? }.
 */
export default function CommandPalette({ open, onClose, actions }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
    }
  }, [open]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return actions.filter((a) => !a.disabled && (!needle || `${a.label} ${a.hint || ''}`.toLowerCase().includes(needle)));
  }, [q, actions]);

  if (!open) return null;

  const run = (a) => {
    onClose();
    a.run();
  };

  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && list[idx]) {
      e.preventDefault();
      run(list[idx]);
    }
  };

  return (
    <div className="palette-layer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command menu">
        <div className="palette__search">
          <Icon name="spark" />
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={onKey}
            placeholder="Type a command"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={list[idx] ? `cmd-${list[idx].id}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="palette__list" id="palette-list" role="listbox">
          {list.length === 0 && <li className="palette__empty">No command matches “{q}”.</li>}
          {list.map((a, i) => (
            <li
              key={a.id}
              id={`cmd-${a.id}`}
              role="option"
              aria-selected={i === idx}
              className={i === idx ? 'is-on' : ''}
              onMouseEnter={() => setIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                run(a);
              }}
            >
              <Icon name={a.icon || 'spark'} />
              <span className="palette__label">{a.label}</span>
              {a.hint && <span className="palette__hint">{a.hint}</span>}
              {a.keys && <kbd>{a.keys}</kbd>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

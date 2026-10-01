import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { wordDiff, diffStats } from '../lib/diff.js';
import { QUICK_ASKS } from '../lib/constants.js';

const lowerLabel = (l) => (/^LinkedIn/.test(l) ? l : l.charAt(0).toLowerCase() + l.slice(1));

/** Text shown while streaming: everything before the <draft> block. */
export function visibleText(raw = '') {
  const i = raw.indexOf('<draft>');
  return (i === -1 ? raw : raw.slice(0, i)).trim();
}

function RevisionCard({ revision, onApply, onDismiss }) {
  const parts = useMemo(() => wordDiff(revision.base || '', revision.draft), [revision.base, revision.draft]);
  const stats = diffStats(parts);
  return (
    <div className={`revision revision--${revision.status}`}>
      <div className="revision__head">
        <span>
          Revision <span className="add-count">+{stats.added}</span> <span className="del-count">−{stats.removed}</span> words
        </span>
        {revision.status === 'applied' && <span className="badge">Applied</span>}
        {revision.status === 'dismissed' && <span className="badge badge--muted">Dismissed</span>}
      </div>
      <div className="revision__diff serif" data-testid="revision-diff">
        {parts.map((p, i) =>
          p.type === 'same' ? (
            <span key={i}>{p.text}</span>
          ) : p.type === 'add' ? (
            <ins key={i}>{p.text}</ins>
          ) : (
            <del key={i}>{p.text}</del>
          ),
        )}
      </div>
      {revision.status === 'pending' && (
        <div className="revision__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onDismiss}>
            Dismiss
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={onApply}>
            <Icon name="check" /> Apply to draft
          </button>
        </div>
      )}
    </div>
  );
}

function Message({ m, onApply, onDismiss }) {
  if (m.role === 'user') return <div className="msg msg--user">{m.content}</div>;
  const text = m.note ?? visibleText(m.content);
  const writing = m.streaming && m.content.includes('<draft>');
  return (
    <div className="msg msg--coach" aria-live={m.streaming ? 'polite' : undefined}>
      {text && <p>{text}</p>}
      {!text && m.streaming && !writing && <span className="typing" aria-label="Coach is typing"><i /><i /><i /></span>}
      {writing && <p className="muted">Writing the revision…</p>}
      {m.error && <p className="error-text">{m.error}</p>}
      {m.revision && <RevisionCard revision={m.revision} onApply={onApply} onDismiss={onDismiss} />}
    </div>
  );
}

export default function ChatPanel({ scope, scopeLabel, messages, streaming, onSend, onStop, onApply, onDismiss, disabledReason }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = (value) => {
    const v = (value ?? text).trim();
    if (!v || streaming || disabledReason) return;
    onSend(v);
    setText('');
  };

  const asks = scope === 'general' ? QUICK_ASKS.general : [...QUICK_ASKS.edit, QUICK_ASKS.general[0]];

  return (
    <section className="pane pane--chat" aria-labelledby="chat-title">
      <div className="pane__head">
        <h2 id="chat-title">Coach</h2>
        <span className="scope" title="The coach edits the draft tab you have open">
          {scope === 'general' ? 'General questions' : `Editing: ${scopeLabel}`}
        </span>
      </div>

      <div className="chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <div className="empty empty--chat">
            <p>
              {scope === 'general'
                ? 'Ask anything about this job: what to emphasize, likely interview questions, how to talk about gaps.'
                : `Tell the coach how to change your ${lowerLabel(scopeLabel)}. You'll see every edit before it's applied.`}
            </p>
          </div>
        ) : (
          messages.map((m, i) => <Message key={i} m={m} onApply={() => onApply(i)} onDismiss={() => onDismiss(i)} />)
        )}
      </div>

      <div className="asks" role="group" aria-label="Quick requests">
        {asks.map((a) => (
          <button key={a} type="button" className="ask" onClick={() => submit(a)} disabled={streaming || Boolean(disabledReason)}>
            {a}
          </button>
        ))}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="chat-box" className="sr-only">
          Message the coach
        </label>
        <textarea
          id="chat-box"
          rows={2}
          value={text}
          placeholder={disabledReason || 'Ask for a change, or ask a question'}
          disabled={Boolean(disabledReason)}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        {streaming ? (
          <button type="button" className="icon-btn icon-btn--solid" onClick={onStop} aria-label="Stop">
            <Icon name="stop" />
          </button>
        ) : (
          <button type="submit" className="icon-btn icon-btn--solid" aria-label="Send" disabled={!text.trim() || Boolean(disabledReason)}>
            <Icon name="send" />
          </button>
        )}
      </form>
    </section>
  );
}

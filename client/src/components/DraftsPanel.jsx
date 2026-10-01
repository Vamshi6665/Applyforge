import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { SECTIONS, TONES, LINKEDIN_LIMIT, sectionLabel } from '../lib/constants.js';
import { copyText, fmtNum } from '../lib/format.js';

function AutoTextarea({ value, onChange, label, serif = true }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={`sheet__text ${serif ? 'serif' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      spellCheck
    />
  );
}

function LimitRing({ count, limit }) {
  const pct = Math.min(1, count / limit);
  const over = count > limit;
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <span className={`ring ${over ? 'ring--over' : ''}`} title={`${count} of ${limit} characters`}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle cx="11" cy="11" r={r} className="ring__track" />
        <circle cx="11" cy="11" r={r} className="ring__fill" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <span>
        {count}/{limit}
      </span>
    </span>
  );
}

function Sheet({ id, draft, tone, busy, onEdit, onUndo, onRegenerate, onWriteTone, notify }) {
  const [copied, setCopied] = useState(false);
  if (!draft) {
    const toneLabel = TONES.find((t) => t.id === tone)?.label.toLowerCase();
    return (
      <div className="sheet sheet--empty">
        <p>No {toneLabel} version of this draft yet.</p>
        <button type="button" className="btn" onClick={() => onWriteTone(id)} disabled={busy}>
          Write {toneLabel} version
        </button>
      </div>
    );
  }
  const text = draft.text;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const doCopy = async () => {
    const ok = await copyText(text);
    setCopied(ok);
    notify(ok ? `${sectionLabel(id)} copied` : 'Copy failed. Select the text and copy it manually.');
    if (ok) setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={`sheet ${busy ? 'is-busy' : ''}`}>
      <AutoTextarea value={text} onChange={(v) => onEdit(id, v)} label={`${sectionLabel(id)} text`} />
      <div className="sheet__foot">
        <div className="sheet__stats">
          {id === 'linkedin' ? <LimitRing count={text.length} limit={LINKEDIN_LIMIT} /> : <span>{fmtNum(words)} words</span>}
          {draft.quality?.issues?.length > 0 && (
            <span className="warn" title={draft.quality.issues.join('\n')}>
              {draft.quality.issues.length} thing{draft.quality.issues.length > 1 ? 's' : ''} to check
            </span>
          )}
        </div>
        <div className="sheet__actions">
          <button type="button" className="btn btn--ghost" onClick={() => onUndo(id)} disabled={!draft.history?.length} title="Undo last change">
            <Icon name="undo" /> Undo
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => onRegenerate(id)} disabled={busy} title="Write this draft again">
            <Icon name="refresh" /> Rewrite
          </button>
          <button type="button" className="btn btn--primary" onClick={doCopy}>
            <Icon name={copied ? 'check' : 'copy'} /> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DraftsPanel({
  selected,
  toggleSection,
  tone,
  setTone,
  draftsByTone,
  active,
  setActive,
  generating,
  canGenerate,
  onGenerate,
  onRegenerate,
  onWriteTone,
  onEdit,
  onUndo,
  lastRun,
  onSaveToTracker,
  notify,
}) {
  const current = draftsByTone[tone] || {};
  const existing = SECTIONS.filter((s) => draftsByTone.metrics?.[s.id] || draftsByTone.concise?.[s.id]);
  const hasDrafts = existing.length > 0;
  const activeId = existing.some((s) => s.id === active) ? active : existing[0]?.id;
  const count = selected.length;

  return (
    <section className="pane pane--drafts" aria-labelledby="drafts-title">
      <div className="pane__head">
        <h2 id="drafts-title">Drafts</h2>
        <div className="seg" role="group" aria-label="Tone">
          {TONES.map((t) => (
            <button key={t.id} type="button" aria-pressed={tone === t.id} onClick={() => setTone(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="composer">
        <div className="picker" role="group" aria-label="Documents to write">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="pick"
              aria-pressed={selected.includes(s.id)}
              onClick={() => toggleSection(s.id)}
            >
              {s.short}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--go" onClick={onGenerate} disabled={!canGenerate || !count || Boolean(generating)}>
          {generating === 'all' ? (
            <>
              <span className="spinner" aria-hidden="true" /> Writing…
            </>
          ) : (
            <>
              <Icon name="spark" /> Write {count} draft{count === 1 ? '' : 's'}
            </>
          )}
        </button>
      </div>

      <div className="pane__scroll">
        {!hasDrafts ? (
          <div className="empty">
            {canGenerate ? (
              <p>
                Pick what you need, then write. Only the documents you pick are generated, so you never pay for drafts you won't use.
                <kbd>Ctrl</kbd> + <kbd>Enter</kbd> works too.
              </p>
            ) : (
              <p>Paste a job posting first. Your drafts will appear here.</p>
            )}
          </div>
        ) : (
          <>
            <div className="tabs" role="tablist" aria-label="Drafts">
              {existing.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  type="button"
                  id={`tab-${s.id}`}
                  aria-selected={activeId === s.id}
                  aria-controls={`panel-${s.id}`}
                  className="tab"
                  onClick={() => setActive(s.id)}
                >
                  {s.short}
                  {!current[s.id] && <span className="tab__dot" title="Not written in this tone yet" />}
                </button>
              ))}
              <button type="button" className="btn btn--ghost btn--sm tabs__save" onClick={onSaveToTracker}>
                <Icon name="plus" /> Track application
              </button>
            </div>
            <div role="tabpanel" id={`panel-${activeId}`} aria-labelledby={`tab-${activeId}`}>
              <Sheet
                id={activeId}
                draft={current[activeId]}
                tone={tone}
                busy={generating === activeId || generating === 'all'}
                onEdit={onEdit}
                onUndo={onUndo}
                onRegenerate={onRegenerate}
                onWriteTone={onWriteTone}
                notify={notify}
              />
            </div>
            {lastRun && (
              <p className="fineprint" data-testid="usage-line">
                {lastRun.cached
                  ? `Reused an identical earlier result from ${lastRun.modelLabel}, 0 tokens used.`
                  : `${lastRun.modelLabel} used ${fmtNum(lastRun.usage.input)} tokens in and ${fmtNum(lastRun.usage.output)} out.`}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

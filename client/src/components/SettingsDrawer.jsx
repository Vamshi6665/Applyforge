import Drawer from './Drawer.jsx';
import { fmtNum } from '../lib/format.js';

function status(p) {
  if (p.id === 'mock') return { text: 'Works offline', cls: 'badge--muted' };
  if (p.configured) return { text: 'Ready', cls: 'badge--ok' };
  if (p.acceptsUserKey) return { text: 'Add your key', cls: 'badge--warn' };
  return { text: p.id === 'ollama' ? 'Set OLLAMA_BASE_URL' : 'Not set up', cls: 'badge--muted' };
}

export default function SettingsDrawer({ open, onClose, providers, selection, setSelection, keys, setKey, rememberKeys, setRememberKeys, theme, setTheme, session }) {
  const active = providers.find((p) => p.id === selection.provider);
  const modelIsCustom = active && selection.model && !active.models.some((m) => m.id === selection.model);

  return (
    <Drawer open={open} title="Model and settings" onClose={onClose}>
      <fieldset className="form-block">
        <legend>Model provider</legend>
        <div className="providers">
          {providers.map((p) => {
            const s = status(p);
            return (
              <label key={p.id} className={`provider ${selection.provider === p.id ? 'is-on' : ''}`}>
                <input
                  type="radio"
                  name="provider"
                  value={p.id}
                  checked={selection.provider === p.id}
                  onChange={() => setSelection({ provider: p.id, model: p.models[0]?.id })}
                />
                <span className="provider__name">{p.label}</span>
                <span className={`badge ${s.cls}`}>{s.text}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {active && (
        <fieldset className="form-block">
          <legend>{active.label} model</legend>
          <div className="models">
            {active.models.map((m) => (
              <label key={m.id} className={`model ${selection.model === m.id ? 'is-on' : ''}`}>
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={selection.model === m.id}
                  onChange={() => setSelection({ ...selection, model: m.id })}
                />
                <span>{m.label}</span>
                <span className={`tier tier--${m.tier}`}>{m.tier === 'fast' ? 'Fast, cheap' : m.tier === 'quality' ? 'Best writing' : 'Custom'}</span>
              </label>
            ))}
          </div>
          {active.id !== 'mock' && (
            <label className="field">
              <span>Or type any model ID</span>
              <input
                value={modelIsCustom ? selection.model : ''}
                placeholder="e.g. a newer model name"
                onChange={(e) => setSelection({ ...selection, model: e.target.value.trim() || active.models[0]?.id })}
              />
            </label>
          )}

          {active.acceptsUserKey && (
            <>
              <label className="field">
                <span>Your {active.label} API key {active.configured && <em className="muted">(optional, the server has one)</em>}</span>
                <input
                  type="password"
                  autoComplete="off"
                  value={keys[active.id] || ''}
                  onChange={(e) => setKey(active.id, e.target.value)}
                  placeholder="Paste a key to use your own account"
                />
              </label>
              <label className="check">
                <input type="checkbox" checked={rememberKeys} onChange={(e) => setRememberKeys(e.target.checked)} />
                Remember keys on this device
              </label>
              <p className="fineprint">Keys go straight to the provider through your ApplyForge server and are never stored on the server.</p>
            </>
          )}
        </fieldset>
      )}

      <fieldset className="form-block">
        <legend>Appearance</legend>
        <div className="seg" role="group" aria-label="Theme">
          {['auto', 'light', 'dark'].map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-block">
        <legend>This session</legend>
        <dl className="stats">
          <div>
            <dt>Tokens in</dt>
            <dd>{fmtNum(session.input)}</dd>
          </div>
          <div>
            <dt>Tokens out</dt>
            <dd>{fmtNum(session.output)}</dd>
          </div>
          <div>
            <dt>Cache hits</dt>
            <dd>{fmtNum(session.cacheHits)}</dd>
          </div>
        </dl>
      </fieldset>
    </Drawer>
  );
}

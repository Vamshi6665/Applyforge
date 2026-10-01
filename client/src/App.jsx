import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JobPanel from './components/JobPanel.jsx';
import DraftsPanel from './components/DraftsPanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import SettingsDrawer from './components/SettingsDrawer.jsx';
import ProfileDrawer from './components/ProfileDrawer.jsx';
import TrackerDrawer from './components/TrackerDrawer.jsx';
import Icon from './components/Icon.jsx';
import Welcome from './components/Welcome.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import { SAMPLE_JD } from './lib/sample.js';
import { api, streamChat } from './lib/api.js';
import { useDebounced, useLocalState } from './hooks/useLocalState.js';
import { SECTIONS, sectionLabel } from './lib/constants.js';
import { isFollowUpDue } from './lib/format.js';
import { load, save } from './lib/storage.js';

const EMPTY_DRAFTS = { metrics: {}, concise: {} };
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export default function App() {
  // ---- persisted preferences and work --------------------------------------
  const [profile, setProfile] = useLocalState('profile', null);
  const [jd, setJd] = useLocalState('jd', '');
  const [selected, setSelected] = useLocalState('sections', ['email', 'linkedin']);
  const [tone, setTone] = useLocalState('tone', 'metrics');
  const [draftsByTone, setDraftsByTone] = useLocalState('drafts', EMPTY_DRAFTS);
  const [apps, setApps] = useLocalState('apps', []);
  const [selection, setSelection] = useLocalState('selection', null);
  const [theme, setTheme] = useLocalState('theme', 'auto');
  const [rememberKeys, setRememberKeys] = useLocalState('rememberKeys', false);
  const [keys, setKeys] = useState(() => (load('rememberKeys', false) ? load('keys', {}) : {}));

  // ---- session state --------------------------------------------------------
  const [providers, setProviders] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [role, setRoleState] = useLocalState('role', '');
  const [company, setCompanyState] = useLocalState('company', '');
  const [edited, setEdited] = useLocalState('edited', { role: false, company: false });
  const [active, setActive] = useState('email');
  const [generating, setGenerating] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [started, setStarted] = useLocalState('started', false);
  const [lastRun, setLastRun] = useState(null);
  const [chats, setChats] = useState({});
  const [streaming, setStreaming] = useState(false);
  const [drawer, setDrawer] = useState(null);
  const [view, setView] = useState('job');
  const [toast, setToast] = useState(null);
  const [session, setSession] = useState({ input: 0, output: 0, cacheHits: 0 });
  const abortRef = useRef(null);
  const toastTimer = useRef(null);

  const notify = useCallback((text, kind = 'info') => {
    clearTimeout(toastTimer.current);
    setToast({ text, kind });
    toastTimer.current = setTimeout(() => setToast(null), kind === 'error' ? 6000 : 2600);
  }, []);

  // ---- boot: models and default profile -------------------------------------
  useEffect(() => {
    let alive = true;
    api
      .models()
      .then((r) => {
        if (!alive) return;
        setProviders(r.providers);
        setSelection((sel) => {
          const p = sel && r.providers.find((x) => x.id === sel.provider);
          return p ? sel : r.default;
        });
      })
      .catch((e) => notify(e.message, 'error'));
    if (!profile) {
      api
        .defaultProfile()
        .then((r) => alive && setProfile(r.profile))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- theme ------------------------------------------------------------------
  useEffect(() => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ---- keys: memory only unless the user opts in ---------------------------
  useEffect(() => {
    save('keys', rememberKeys ? keys : undefined);
  }, [keys, rememberKeys]);
  const setKey = (id, value) => setKeys((k) => ({ ...k, [id]: value }));
  const activeKey = selection ? keys[selection.provider] || undefined : undefined;

  // ---- live, zero-token analysis as the JD changes ---------------------------
  const debouncedJd = useDebounced(jd, 350);
  useEffect(() => {
    if (!debouncedJd.trim() || !profile) {
      setAnalysis(null);
      return undefined;
    }
    const ctrl = new AbortController();
    setAnalyzing(true);
    api
      .analyze({ jd: debouncedJd, profile }, { signal: ctrl.signal })
      .then((a) => {
        setAnalysis(a);
        setRoleState((r) => (edited.role ? r : a.role));
        setCompanyState((c) => (edited.company ? c : a.company));
      })
      .catch((e) => {
        if (e.name !== 'AbortError') notify(e.message, 'error');
      })
      .finally(() => setAnalyzing(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedJd, profile]);

  const setRole = (v) => {
    setRoleState(v);
    setEdited((e) => ({ ...e, role: true }));
  };
  const setCompany = (v) => {
    setCompanyState(v);
    setEdited((e) => ({ ...e, company: true }));
  };

  const modelLabel = useMemo(() => {
    const p = providers.find((x) => x.id === selection?.provider);
    const m = p?.models.find((x) => x.id === selection?.model);
    return m ? `${m.label}` : selection?.model || 'Loading models';
  }, [providers, selection]);

  const canGenerate = jd.trim().length >= 80 && Boolean(profile) && Boolean(selection);

  // ---- generation -------------------------------------------------------------
  const runGenerate = useCallback(
    async (sections, { fresh = false, busy = 'all', forTone = tone } = {}) => {
      if (!canGenerate || !sections.length) return;
      setGenerating(busy);
      setPendingCount(sections.length);
      try {
        const r = await api.generate(
          {
            jd,
            profile,
            sections,
            tone: forTone,
            role: role || undefined,
            company: company || undefined,
            provider: selection.provider,
            model: selection.model,
            fresh,
          },
          { key: activeKey },
        );
        setDraftsByTone((all) => {
          const next = { ...all, [forTone]: { ...(all[forTone] || {}) } };
          for (const [id, d] of Object.entries(r.drafts)) {
            const prev = next[forTone][id];
            next[forTone][id] = {
              text: d.text,
              quality: d.quality,
              history: prev ? [...(prev.history || []), prev.text].slice(-20) : [],
            };
          }
          return next;
        });
        if (busy === 'all') setActive(sections[0]);
        setLastRun({ cached: r.cached, usage: r.usage, modelLabel });
        setSession((s) => ({
          input: s.input + r.usage.input,
          output: s.output + r.usage.output,
          cacheHits: s.cacheHits + (r.cached ? 1 : 0),
        }));
        setView('drafts');
        if (busy === 'all') {
          const n = Object.keys(r.drafts).length;
          notify(`${n} draft${n === 1 ? '' : 's'} ready${r.cached ? ', reused from cache' : ''}`);
        }
      } catch (e) {
        notify(e.message, 'error');
        if (e.code === 'missing_key' || e.code === 'invalid_key') setDrawer('settings');
      } finally {
        setGenerating(null);
      }
    },
    [canGenerate, jd, profile, tone, role, company, selection, activeKey, modelLabel, notify, setDraftsByTone],
  );

  const onGenerate = () => runGenerate(selected, { fresh: false });
  const onRegenerate = (id) => runGenerate([id], { fresh: true, busy: id });
  const onWriteTone = () => {
    const current = draftsByTone[tone] || {};
    const missing = SECTIONS.map((s) => s.id).filter((id) => !current[id] && (draftsByTone.metrics?.[id] || draftsByTone.concise?.[id]));
    runGenerate(missing, { busy: 'all' });
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !generating) {
        e.preventDefault();
        runGenerate(selected);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runGenerate, selected, generating]);

  const toggleSection = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : SECTIONS.map((x) => x.id).filter((x) => x === id || s.includes(x))));

  const updateDraft = (id, fn) =>
    setDraftsByTone((all) => {
      const cur = all[tone]?.[id];
      if (!cur) return all;
      return { ...all, [tone]: { ...all[tone], [id]: fn(cur) } };
    });

  const onEdit = (id, text) => updateDraft(id, (d) => ({ ...d, text }));
  const onUndo = (id) =>
    updateDraft(id, (d) => {
      if (!d.history?.length) return d;
      const history = d.history.slice(0, -1);
      return { ...d, text: d.history[d.history.length - 1], history };
    });

  // ---- chat -------------------------------------------------------------------
  const currentDrafts = draftsByTone[tone] || {};
  const existingIds = SECTIONS.map((s) => s.id).filter((id) => draftsByTone.metrics?.[id] || draftsByTone.concise?.[id]);
  const activeId = existingIds.includes(active) ? active : existingIds[0];
  const scope = activeId && currentDrafts[activeId] ? activeId : 'general';
  const scopeKey = `${scope}:${tone}`;
  const messages = chats[scopeKey] || [];

  const patchLast = (key, fn) =>
    setChats((c) => {
      const list = [...(c[key] || [])];
      list[list.length - 1] = fn(list[list.length - 1]);
      return { ...c, [key]: list };
    });

  const onSend = async (text) => {
    const key = scopeKey;
    const base = scope === 'general' ? '' : currentDrafts[scope]?.text || '';
    const history = messages.filter((m) => !m.streaming && !m.error).map((m) => ({ role: m.role, content: m.content }));
    setChats((c) => ({
      ...c,
      [key]: [...(c[key] || []), { role: 'user', content: text }, { role: 'assistant', content: '', streaming: true }],
    }));
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStreaming(true);
    try {
      await streamChat(
        {
          message: text,
          docType: scope,
          draft: base,
          jd,
          role: role || undefined,
          company: company || undefined,
          history,
          profile,
          provider: selection?.provider,
          model: selection?.model,
        },
        {
          key: activeKey,
          signal: ctrl.signal,
          onEvent: (evt) => {
            if (evt.type === 'text') patchLast(key, (m) => ({ ...m, content: m.content + evt.text }));
            if (evt.type === 'done') {
              patchLast(key, (m) => ({
                ...m,
                streaming: false,
                note: evt.note,
                revision: evt.draft && scope !== 'general' ? { draft: evt.draft, base, quality: evt.quality, status: 'pending', section: scope, tone } : null,
              }));
              setSession((s) => ({ ...s, input: s.input + evt.usage.input, output: s.output + evt.usage.output }));
            }
          },
        },
      );
    } catch (e) {
      const stopped = e.name === 'AbortError';
      patchLast(key, (m) => ({ ...m, streaming: false, error: stopped ? 'Stopped.' : e.message }));
      if (!stopped && (e.code === 'missing_key' || e.code === 'invalid_key')) setDrawer('settings');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const onStop = () => abortRef.current?.abort();

  const setRevisionStatus = (i, status) =>
    setChats((c) => {
      const list = [...(c[scopeKey] || [])];
      list[i] = { ...list[i], revision: { ...list[i].revision, status } };
      return { ...c, [scopeKey]: list };
    });

  const onApply = (i) => {
    const rev = messages[i]?.revision;
    if (!rev) return;
    setDraftsByTone((all) => {
      const cur = all[rev.tone]?.[rev.section];
      if (!cur) return all;
      return {
        ...all,
        [rev.tone]: {
          ...all[rev.tone],
          [rev.section]: { ...cur, text: rev.draft, quality: rev.quality || cur.quality, history: [...(cur.history || []), cur.text].slice(-20) },
        },
      };
    });
    setRevisionStatus(i, 'applied');
    notify(`${sectionLabel(rev.section)} updated. Undo is on the draft.`);
  };

  // ---- tracker ----------------------------------------------------------------
  const onSaveToTracker = () => {
    const snapshot = { metrics: draftsByTone.metrics, concise: draftsByTone.concise };
    setApps((list) => {
      const existing = list.find((a) => a.jd === jd);
      if (existing) return list.map((a) => (a.id === existing.id ? { ...a, role, company, drafts: snapshot } : a));
      return [{ id: newId(), role, company, jd, drafts: snapshot, status: 'drafted', createdAt: new Date().toISOString(), notes: '' }, ...list];
    });
    notify(`Tracking ${role || 'this role'}${company ? ` at ${company}` : ''}`);
  };
  const updateApp = (id, patch) => setApps((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const removeApp = (id) => setApps((list) => list.filter((a) => a.id !== id));
  const openApp = (a) => {
    setJd(a.jd || '');
    setStarted(true);
    setRoleState(a.role || '');
    setCompanyState(a.company || '');
    setEdited({ role: true, company: true });
    setDraftsByTone(a.drafts || EMPTY_DRAFTS);
    setChats({});
    setDrawer(null);
    setView('drafts');
  };
  const dueCount = apps.filter((a) => isFollowUpDue(a)).length;

  const newJob = () => {
    if (streaming) onStop();
    setJd('');
    setStarted(false);
    setDraftsByTone(EMPTY_DRAFTS);
    setChats({});
    setRoleState('');
    setCompanyState('');
    setEdited({ role: false, company: false });
    setLastRun(null);
    setView('job');
  };

  const showWelcome = !started && existingIds.length === 0;
  const startWith = (text) => {
    setJd(text);
    setStarted(true);
  };

  const paletteActions = [
    { id: 'write', label: `Write ${selected.length} selected draft${selected.length === 1 ? '' : 's'}`, icon: 'spark', keys: 'Ctrl Enter', run: () => runGenerate(selected), disabled: !canGenerate || !selected.length },
    { id: 'sample', label: 'Load a sample job', icon: 'doc', run: () => startWith(SAMPLE_JD) },
    { id: 'new', label: 'Start a new job', icon: 'plus', run: () => newJob(), disabled: !jd && !existingIds.length },
    { id: 'track', label: 'Track this application', icon: 'list', run: () => onSaveToTracker(), disabled: !existingIds.length },
    { id: 'apps', label: 'Open applications', icon: 'list', hint: dueCount ? `${dueCount} follow-up${dueCount > 1 ? 's' : ''} due` : '', run: () => setDrawer('tracker') },
    { id: 'profile', label: 'Edit your profile', icon: 'user', run: () => setDrawer('profile'), disabled: !profile },
    { id: 'model', label: 'Change model or API key', icon: 'gear', hint: modelLabel, run: () => setDrawer('settings') },
    { id: 'tone', label: `Switch to ${tone === 'metrics' ? 'concise' : 'metrics first'} tone`, icon: 'edit', run: () => setTone(tone === 'metrics' ? 'concise' : 'metrics') },
    ...SECTIONS.map((sec) => ({
      id: `pick-${sec.id}`,
      label: `${selected.includes(sec.id) ? 'Remove' : 'Add'} ${sec.label.toLowerCase().replace('linkedin', 'LinkedIn')}`,
      icon: 'doc',
      hint: 'Drafts to write',
      run: () => toggleSection(sec.id),
    })),
    { id: 'theme', label: `Use ${theme === 'dark' ? 'light' : 'dark'} theme`, icon: 'moon', run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
  ];

  const chatDisabled = !jd.trim() ? 'Paste a job posting first' : !selection ? 'Loading models…' : '';

  return (
    <div className={`app ${showWelcome ? 'app--welcome' : ''}`} data-view={view}>
      <header className="topbar">
        <h1 className="wordmark">
          Apply<span>Forge</span>
        </h1>
        <nav className="topbar__actions" aria-label="App">
          <button type="button" className="cmd-btn" onClick={() => setPaletteOpen(true)} aria-label="Open command menu">
            <Icon name="spark" />
            <span className="hide-sm">Commands</span>
            <kbd className="hide-sm">Ctrl K</kbd>
          </button>
          <button type="button" className="model-chip" onClick={() => setDrawer('settings')} title="Change model">
            <span className="model-chip__dot" aria-hidden="true" />
            {modelLabel}
          </button>
          <button type="button" className="btn btn--ghost" onClick={newJob} disabled={!jd && !existingIds.length}>
            <Icon name="plus" />
            <span className="hide-sm">New job</span>
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setDrawer('tracker')}>
            <Icon name="list" />
            <span className="hide-sm">Applications</span>
            {dueCount > 0 && (
              <span className="count" aria-label={`${dueCount} follow-ups due`}>
                {dueCount}
              </span>
            )}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setDrawer('profile')} disabled={!profile}>
            <Icon name="user" />
            <span className="hide-sm">Profile</span>
          </button>
          <button type="button" className="icon-btn" onClick={() => setDrawer('settings')} aria-label="Settings">
            <Icon name="gear" />
          </button>
        </nav>
      </header>

      {showWelcome ? (
        <Welcome jd={jd} setJd={setJd} onStart={startWith} notify={notify} modelLabel={modelLabel} onOpenProfile={() => setDrawer('profile')} />
      ) : (
      <main className="workspace">
        <JobPanel
          jd={jd}
          setJd={setJd}
          analysis={analysis}
          analyzing={analyzing}
          role={role}
          company={company}
          setRole={setRole}
          setCompany={setCompany}
        />
        <DraftsPanel
          selected={selected}
          toggleSection={toggleSection}
          tone={tone}
          setTone={setTone}
          draftsByTone={draftsByTone}
          active={activeId}
          setActive={setActive}
          generating={generating}
          canGenerate={canGenerate}
          onGenerate={onGenerate}
          onRegenerate={onRegenerate}
          onWriteTone={onWriteTone}
          onEdit={onEdit}
          onUndo={onUndo}
          lastRun={lastRun}
          onSaveToTracker={onSaveToTracker}
          notify={notify}
          modelLabel={modelLabel}
          pendingCount={pendingCount}
        />
        <ChatPanel
          scope={scope}
          scopeLabel={sectionLabel(scope)}
          messages={messages}
          streaming={streaming}
          onSend={onSend}
          onStop={onStop}
          onApply={onApply}
          onDismiss={(i) => setRevisionStatus(i, 'dismissed')}
          disabledReason={chatDisabled}
        />
      </main>
      )}

      {!showWelcome && (
      <nav className="mobile-nav" aria-label="Sections">
        {[
          ['job', 'doc', 'Job'],
          ['drafts', 'edit', 'Drafts'],
          ['chat', 'chat', 'Coach'],
        ].map(([id, icon, label]) => (
          <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>
            <Icon name={icon} />
            {label}
          </button>
        ))}
      </nav>
      )}

      <SettingsDrawer
        open={drawer === 'settings'}
        onClose={() => setDrawer(null)}
        providers={providers}
        selection={selection || {}}
        setSelection={setSelection}
        keys={keys}
        setKey={setKey}
        rememberKeys={rememberKeys}
        setRememberKeys={setRememberKeys}
        theme={theme}
        setTheme={setTheme}
        session={session}
      />
      {profile && (
        <ProfileDrawer
          open={drawer === 'profile'}
          onClose={() => setDrawer(null)}
          profile={profile}
          onSave={setProfile}
          onReset={() =>
            api
              .defaultProfile()
              .then((r) => {
                setProfile(r.profile);
                notify('Profile reset to default');
              })
              .catch((e) => notify(e.message, 'error'))
          }
          notify={notify}
        />
      )}
      <TrackerDrawer
        open={drawer === 'tracker'}
        onClose={() => setDrawer(null)}
        apps={apps}
        updateApp={updateApp}
        removeApp={removeApp}
        openApp={openApp}
      />

      {paletteOpen && <CommandPalette open onClose={() => setPaletteOpen(false)} actions={paletteActions} />}

      <div className="toast-region" role="status" aria-live="polite">
        {toast && <div className={`toast toast--${toast.kind}`}>{toast.text}</div>}
      </div>
    </div>
  );
}

import Drawer from './Drawer.jsx';
import Icon from './Icon.jsx';
import { STATUSES } from '../lib/constants.js';
import { fmtDate, isFollowUpDue, daysBetween, toCsv } from '../lib/format.js';

export default function TrackerDrawer({ open, onClose, apps, updateApp, removeApp, openApp }) {
  const download = () => {
    const blob = new Blob([toCsv(apps)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'applyforge-applications.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const due = apps.filter((a) => isFollowUpDue(a)).length;

  return (
    <Drawer
      open={open}
      title="Applications"
      onClose={onClose}
      wide
      footer={
        apps.length > 0 && (
          <button type="button" className="btn btn--ghost" onClick={download}>
            <Icon name="download" /> Export CSV
          </button>
        )
      }
    >
      {apps.length === 0 ? (
        <div className="empty">
          <p>Nothing tracked yet. After writing drafts, choose Track application to keep the role, its drafts and its status here.</p>
        </div>
      ) : (
        <>
          {due > 0 && (
            <p className="notice" role="status">
              {due} application{due > 1 ? 's are' : ' is'} ready for a follow-up.
            </p>
          )}
          <ul className="apps">
            {apps.map((a) => {
              const followUp = isFollowUpDue(a);
              return (
                <li key={a.id} className={`job-app ${followUp ? 'job-app--due' : ''}`}>
                  <div className="job-app__main">
                    <h3>{a.role || 'Untitled role'}</h3>
                    <p className="muted">
                      {a.company || 'Unknown company'}, saved {fmtDate(a.createdAt)}
                      {a.sentAt && `, sent ${fmtDate(a.sentAt)}`}
                    </p>
                    {followUp && <p className="due">Sent {daysBetween(a.sentAt)} days ago with no reply. Time to follow up.</p>}
                    <label className="field field--inline">
                      <span className="sr-only">Notes</span>
                      <input value={a.notes || ''} placeholder="Notes, recruiter name, next step" onChange={(e) => updateApp(a.id, { notes: e.target.value })} />
                    </label>
                  </div>
                  <div className="job-app__side">
                    <label className="field field--inline">
                      <span className="sr-only">Status for {a.role}</span>
                      <select
                        value={a.status}
                        onChange={(e) => {
                          const status = e.target.value;
                          const patch = { status };
                          if (status === 'sent' && !a.sentAt) patch.sentAt = new Date().toISOString();
                          updateApp(a.id, patch);
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="job-app__btns">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => openApp(a)}>
                        <Icon name="eye" /> Open
                      </button>
                      <button type="button" className="icon-btn" aria-label={`Delete ${a.role}`} onClick={() => removeApp(a.id)}>
                        <Icon name="trash" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Drawer>
  );
}

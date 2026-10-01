import { useEffect, useState } from 'react';
import Drawer from './Drawer.jsx';
import Icon from './Icon.jsx';

const toList = (s) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
const toLines = (s) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

function toForm(p) {
  return {
    ...p,
    certifications: (p.certifications || []).join(', '),
    skills: (p.skills || []).join(', '),
    metrics: (p.metrics || []).join('\n'),
    experience: (p.experience || []).map((e) => ({ ...e })),
  };
}

function fromForm(f) {
  return {
    ...f,
    certifications: toList(f.certifications),
    skills: toList(f.skills),
    metrics: toLines(f.metrics),
    experience: f.experience.filter((e) => e.role || e.org || e.summary),
  };
}

export default function ProfileDrawer({ open, onClose, profile, onSave, onReset, notify }) {
  const [form, setForm] = useState(() => toForm(profile));
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(toForm(profile));
      setError('');
    }
  }, [open, profile]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setExp = (i, k) => (e) =>
    setForm((f) => ({ ...f, experience: f.experience.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200_000) {
      setError('That file is too large. Paste the text instead.');
      return;
    }
    const text = await file.text();
    setForm((f) => ({ ...f, resumeText: text.slice(0, 12000) }));
    notify(`Loaded ${file.name}`);
  };

  const save = () => {
    if (!form.name.trim() || !form.headline.trim()) {
      setError('Name and headline are required.');
      return;
    }
    onSave(fromForm(form));
    notify('Profile saved');
    onClose();
  };

  return (
    <Drawer
      open={open}
      title="Your profile"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onReset}>
            Reset to default
          </button>
          <button type="button" className="btn btn--primary" onClick={save}>
            Save profile
          </button>
        </>
      }
    >
      <p className="fineprint">Everything the writer is allowed to claim comes from here. Anything not listed is treated as a gap and never invented.</p>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <div className="form-grid">
        <label className="field">
          <span>Full name</span>
          <input value={form.name} onChange={set('name')} />
        </label>
        <label className="field">
          <span>First name for sign-offs</span>
          <input value={form.firstName} onChange={set('firstName')} />
        </label>
        <label className="field">
          <span>Headline</span>
          <input value={form.headline} onChange={set('headline')} placeholder="Data and AI professional" />
        </label>
        <label className="field">
          <span>Years of experience</span>
          <input value={form.years} onChange={set('years')} placeholder="4+" />
        </label>
        <label className="field field--full">
          <span>Education</span>
          <input value={form.education} onChange={set('education')} />
        </label>
        <label className="field">
          <span>Short education (LinkedIn)</span>
          <input value={form.educationShort} onChange={set('educationShort')} placeholder="MS in Computer Science" />
        </label>
        <label className="field">
          <span>Certifications as you say them</span>
          <input value={form.certsShort} onChange={set('certsShort')} placeholder="PL-300, DP-203, and AWS certifications" />
        </label>
        <label className="field field--full">
          <span>Certifications, comma separated</span>
          <input value={form.certifications} onChange={set('certifications')} />
        </label>
        <label className="field field--full">
          <span>Skills, comma separated</span>
          <textarea rows={3} value={form.skills} onChange={set('skills')} />
        </label>
        <label className="field field--full">
          <span>Real metrics, one per line</span>
          <textarea rows={4} value={form.metrics} onChange={set('metrics')} />
        </label>
      </div>

      <h3 className="sub">Experience</h3>
      {form.experience.map((e, i) => (
        <div key={i} className="exp">
          <div className="form-grid">
            <label className="field">
              <span>Role</span>
              <input value={e.role} onChange={setExp(i, 'role')} />
            </label>
            <label className="field">
              <span>Organization</span>
              <input value={e.org} onChange={setExp(i, 'org')} />
            </label>
            <label className="field">
              <span>Dates</span>
              <input value={e.dates} onChange={setExp(i, 'dates')} />
            </label>
            <label className="field field--full">
              <span>What you did</span>
              <textarea rows={2} value={e.summary} onChange={setExp(i, 'summary')} />
            </label>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setForm((f) => ({ ...f, experience: f.experience.filter((_, j) => j !== i) }))}
          >
            <Icon name="trash" /> Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => setForm((f) => ({ ...f, experience: [...f.experience, { role: '', org: '', dates: '', summary: '' }] }))}
      >
        <Icon name="plus" /> Add experience
      </button>

      <h3 className="sub">Your voice</h3>
      <label className="field">
        <span>A real email you sent (sets the structure and tone)</span>
        <textarea rows={8} className="serif" value={form.goldEmail} onChange={set('goldEmail')} />
      </label>
      <label className="field">
        <span>A real LinkedIn note you sent</span>
        <textarea rows={3} className="serif" value={form.goldLinkedin} onChange={set('goldLinkedin')} />
      </label>
      <label className="field">
        <span>Resume text (optional, extra facts)</span>
        <textarea rows={6} value={form.resumeText} onChange={set('resumeText')} placeholder="Paste your resume as plain text" />
      </label>
      <label className="upload">
        <Icon name="upload" /> Load resume from a .txt or .md file
        <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={onFile} />
      </label>
    </Drawer>
  );
}

import React, { useLayoutEffect, useRef, useState } from "react";

const PAGE_H_IN = 11;
const MARGIN_IN = 0.5;
const SIZES = [10.5, 10.25, 10, 9.75, 9.5];

function Editable({ value, onChange, editable, className, tag = "span" }) {
  const Tag = tag;
  if (!editable) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag
      className={`${className || ""} editable`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const v = e.currentTarget.innerText.replace(/\s+/g, " ").trim();
        if (v !== value) onChange(v);
      }}
    >
      {value}
    </Tag>
  );
}

function Bullets({ items, editable, onEdit }) {
  return (
    <ul className="rd-bullets">
      {items.map((b, i) => (
        <li key={i}>
          <Editable tag="b" value={b.label} editable={editable} onChange={(v) => onEdit(i, { ...b, label: v.replace(/:$/, "") })} />
          <b>: </b>
          <Editable value={b.text} editable={editable} onChange={(v) => onEdit(i, { ...b, text: v })} />
        </li>
      ))}
    </ul>
  );
}

export default function ResumeDoc({ resume, profile, editable = false, onChange = () => {}, onFit = () => {}, printMode = false, fontPt }) {
  const ref = useRef(null);
  const [size, setSize] = useState(SIZES[0]);
  const [overflow, setOverflow] = useState(false);
  const pt = fontPt || size;

  // shrink type step by step until the content fits one Letter page
  useLayoutEffect(() => {
    if (fontPt || !ref.current) return;
    const el = ref.current;
    const limit = (PAGE_H_IN - 2 * MARGIN_IN) * 96;
    let chosen = SIZES[SIZES.length - 1];
    for (const s of SIZES) {
      el.style.fontSize = `${s}pt`;
      if (el.scrollHeight <= limit) { chosen = s; break; }
    }
    el.style.fontSize = `${chosen}pt`;
    const over = el.scrollHeight > limit;
    setSize(chosen);
    setOverflow(over);
    onFit({ size: chosen, overflow: over });
  }, [resume, fontPt]);

  const c = profile.contact;
  const set = (fn) => {
    const next = structuredClone(resume);
    fn(next);
    onChange(next);
  };

  return (
    <div className={`rd-page ${printMode ? "rd-print" : ""}`}>
      <div className="rd" ref={ref} style={{ fontSize: `${pt}pt` }}>
        <h1 className="rd-name">{profile.name.toUpperCase()}</h1>
        <div className="rd-contact">
          {c.location} | {c.phone} | <a href={`mailto:${c.email}`}>{c.email}</a> | <a href={c.linkedin}>LinkedIn</a> | <a href={c.github}>GitHub</a>
        </div>
        <div className="rd-rule" />
        <Editable tag="p" className="rd-summary" value={resume.summary} editable={editable} onChange={(v) => set((r) => (r.summary = v))} />

        <h2 className="rd-h">PROFESSIONAL EXPERIENCE</h2>
        {resume.experience.map((e, ei) => (
          <div className="rd-block" key={e.role_id || ei}>
            <div className="rd-row"><b>{e.company}</b><b>{e.dates}</b></div>
            <div className="rd-row rd-sub"><b>{e.title}</b><span>{e.location}</span></div>
            <Bullets items={e.bullets} editable={editable} onEdit={(i, b) => set((r) => (r.experience[ei].bullets[i] = b))} />
          </div>
        ))}

        {/* legacy: only runs saved before v2.3 carry a projects section */}
        {resume.projects?.length > 0 && <h2 className="rd-h">PROJECTS</h2>}
        {(resume.projects || []).map((p, pi) => (
          <div className="rd-block" key={pi}>
            <div className="rd-row"><span><b>{p.name}</b>{p.tech?.length ? <i> | {p.tech.join(", ")}</i> : null}</span></div>
            <Bullets items={p.bullets} editable={editable} onEdit={(i, b) => set((r) => (r.projects[pi].bullets[i] = b))} />
          </div>
        ))}

        <h2 className="rd-h">TECHNICAL SKILLS</h2>
        <table className="rd-skills">
          <tbody>
            {resume.skills.map((s, i) => (
              <tr key={i}>
                <td className="rd-skill-cat"><b>{s.category}</b></td>
                <td>: {s.items.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="rd-h">CERTIFICATIONS</h2>
        <p className="rd-certs">{resume.certifications.join(" | ")}</p>

        <h2 className="rd-h">EDUCATION</h2>
        {profile.education.map((ed, i) => (
          <div className="rd-block" key={i}>
            <div className="rd-row"><span><b>{ed.school}</b> | {ed.degree}{ed.detail ? ` | ${ed.detail}` : ""}</span><b>{ed.dates}</b></div>
          </div>
        ))}
      </div>
      {!printMode && overflow && <div className="rd-overflow">Over one page at 9.5 pt. Ask for a tighter version or trim a bullet.</div>}
    </div>
  );
}

export function resumeToText(resume, profile) {
  const c = profile.contact;
  const L = [];
  L.push(profile.name.toUpperCase(), `${c.location} | ${c.phone} | ${c.email} | ${c.linkedin} | ${c.github}`, "", resume.summary, "", "PROFESSIONAL EXPERIENCE");
  resume.experience.forEach((e) => {
    L.push(`${e.company}    ${e.dates}`, `${e.title}    ${e.location}`);
    e.bullets.forEach((b) => L.push(`• ${b.label}: ${b.text}`));
    L.push("");
  });
  if (resume.projects?.length) L.push("PROJECTS");
  (resume.projects || []).forEach((p) => {
    L.push(`${p.name} | ${p.tech.join(", ")}`);
    p.bullets.forEach((b) => L.push(`• ${b.label}: ${b.text}`));
  });
  L.push("", "TECHNICAL SKILLS");
  resume.skills.forEach((s) => L.push(`${s.category}: ${s.items.join(", ")}`));
  L.push("", "CERTIFICATIONS", ...resume.certifications.map((x) => `• ${x}`), "", "EDUCATION");
  profile.education.forEach((ed) => L.push(`${ed.school}    ${ed.dates}`, `${ed.degree}${ed.detail ? ` | ${ed.detail}` : ""}    ${ed.location}`));
  return L.join("\n");
}

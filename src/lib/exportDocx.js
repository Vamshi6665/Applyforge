import {
  Document, Packer, Paragraph, TextRun, TabStopType, BorderStyle, AlignmentType, ExternalHyperlink, LevelFormat,
  Table, TableRow, TableCell, WidthType,
} from "docx";

const FONT = "Times New Roman";
const CONTENT_TWIPS = 10800; // 7.5in

export async function buildDocx(resume, profile, fontPt = 10.5) {
  const sz = Math.round(fontPt * 2);
  const run = (text, o = {}) => new TextRun({ text, font: FONT, size: sz, ...o });
  const tight = { spacing: { before: 0, after: 0, line: 228 } };

  const row = (left, right, { boldLeft = true, boldRight = true, italicLeft = false, gap = false } = {}) =>
    new Paragraph({
      ...tight,
      spacing: { before: gap ? 60 : 0, after: 0, line: 228 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_TWIPS }],
      children: [run(left, { bold: boldLeft, italics: italicLeft }), run(`\t${right}`, { bold: boldRight })],
    });

  const heading = (t) =>
    new Paragraph({
      spacing: { before: 80, after: 30 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000", space: 1 } },
      children: [run(t, { bold: true, size: sz + 1 })],
    });

  const bullet = (b) =>
    new Paragraph({
      ...tight,
      numbering: { reference: "dots", level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      children: [run(`${b.label}: `, { bold: true }), run(b.text)],
    });

  const c = profile.contact;
  const link = (text, href) => new ExternalHyperlink({ link: href, children: [run(text, { color: "1F4E9A" })] });

  const kids = [
    new Paragraph({ alignment: AlignmentType.CENTER, ...tight, children: [run(profile.name.toUpperCase(), { bold: true, size: sz + 8 })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 60 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 4 } },
      children: [
        run(`${c.location} | ${c.phone} | `), link(c.email, `mailto:${c.email}`), run(" | "), link("LinkedIn", c.linkedin), run(" | "), link("GitHub", c.github),
      ],
    }),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 40, after: 20 }, children: [run(resume.summary)] }),
    heading("PROFESSIONAL EXPERIENCE"),
  ];

  resume.experience.forEach((e, i) => {
    kids.push(row(e.company, e.dates, { gap: i > 0 }), row(e.title, e.location), ...e.bullets.map(bullet));
  });

  kids.push(heading("PROJECTS"));
  resume.projects.forEach((p) => {
    kids.push(
      new Paragraph({ ...tight, children: [run(p.name, { bold: true }), run(p.tech?.length ? ` | ${p.tech.join(", ")}` : "", { italics: true })] }),
      ...p.bullets.map(bullet),
    );
  });

  kids.push(heading("TECHNICAL SKILLS"));
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  kids.push(
    new Table({
      width: { size: CONTENT_TWIPS, type: WidthType.DXA },
      columnWidths: [2300, 8500],
      borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
      rows: resume.skills.map(
        (s) =>
          new TableRow({
            children: [
              new TableCell({ width: { size: 2300, type: WidthType.DXA }, children: [new Paragraph({ ...tight, children: [run(s.category, { bold: true })] })] }),
              new TableCell({ width: { size: 8500, type: WidthType.DXA }, children: [new Paragraph({ ...tight, children: [run(`: ${s.items.join(", ")}`)] })] }),
            ],
          }),
      ),
    }),
  );

  kids.push(heading("CERTIFICATIONS"), new Paragraph({ ...tight, children: [run(resume.certifications.join(" | "))] }));

  kids.push(heading("EDUCATION"));
  profile.education.forEach((ed) =>
    kids.push(new Paragraph({
      ...tight,
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_TWIPS }],
      children: [run(ed.school, { bold: true }), run(` | ${ed.degree}${ed.detail ? ` | ${ed.detail}` : ""}`), run(`\t${ed.dates}`, { bold: true })],
    })));

  const doc = new Document({
    numbering: {
      config: [{
        reference: "dots",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 300, hanging: 220 } } } }],
      }],
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: kids,
    }],
  });
  return Packer.toBlob(doc);
}

export async function downloadDocx(resume, profile, fontPt, filename) {
  const blob = await buildDocx(resume, profile, fontPt);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

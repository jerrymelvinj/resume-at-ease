import { useState, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SECTIONS = ["intro", "contact", "experience", "education", "skills", "recognition", "preview"];
const SECTION_LABELS = {
  intro: "Start",
  contact: "Contact Info",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  recognition: "Recognition",
  preview: "Done!",
};
const SECTION_XP = { contact: 100, experience: 250, education: 150, skills: 100, recognition: 50 };
const QUIPS = [
  "Every great career starts with a great resume.",
  "Recruiters spend 7 seconds on a resume. Make them count.",
  "You're doing amazing. Keep going!",
  "One step closer to landing that dream role.",
  "Skills on paper — power in person.",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const emptyExp = () => ({ company: "", role: "", duration: "", location: "", startMonth: "", startYear: "", endMonth: "", endYear: "", current: false, bullets: [""] });
const emptyEdu = () => ({ institution: "", degree: "", year: "", specialization: "" });

const formatDuration = (exp) => {
  if (exp.startMonth && exp.startYear) {
    const end = exp.current ? "Present" : exp.endMonth && exp.endYear ? `${exp.endMonth} ${exp.endYear}` : "";
    return end ? `${exp.startMonth} ${exp.startYear} – ${end}` : `${exp.startMonth} ${exp.startYear}`;
  }
  return exp.duration || "";
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function XPBar({ xp, maxXp }) {
  const pct = Math.min(100, (xp / maxXp) * 100);
  return (
    <div style={{ width: "100%", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", marginBottom: 4, fontFamily: "monospace" }}>
        <span>XP {xp} / {maxXp}</span>
        <span>{Math.round(pct)}% complete</span>
      </div>
      <div style={{ background: "#e5e5e5", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#111", borderRadius: 4, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

function Badge({ label, earned }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", border: `1.5px solid ${earned ? "#111" : "#ccc"}`,
      borderRadius: 20, fontSize: 11, fontFamily: "monospace",
      color: earned ? "#111" : "#aaa", marginRight: 6, marginBottom: 6,
      background: earned ? "#f5f5f5" : "transparent",
      transition: "all 0.3s",
    }}>
      {earned ? "✓" : "○"} {label}
    </div>
  );
}

function Label({ children, required }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#333", marginBottom: 4, fontFamily: "monospace" }}>
      {children}{required && <span style={{ color: "#c00", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function ErrorText({ children }) {
  return (
    <div style={{ color: "#c00", background: "#fff1f1", border: "1px solid #f2c2c2", borderRadius: 8, padding: "12px 14px", fontFamily: "monospace", fontSize: 12, marginTop: 16 }}>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, multiline, rows = 2 }) {
  const base = {
    width: "100%", boxSizing: "border-box",
    border: "1.5px solid #ddd", borderRadius: 6, padding: "9px 12px",
    fontSize: 14, fontFamily: "Georgia, serif", color: "#111",
    background: "#fff", outline: "none", transition: "border 0.2s",
    resize: multiline ? "vertical" : "none",
  };
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} onFocus={e => e.target.style.border = "1.5px solid #111"} onBlur={e => e.target.style.border = "1.5px solid #ddd"} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={e => e.target.style.border = "1.5px solid #111"} onBlur={e => e.target.style.border = "1.5px solid #ddd"} />;
}

function SectionCard({ title, emoji, children }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <h3 style={{ margin: "0 0 18px 0", fontSize: 15, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
        <span>{emoji}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function Btn({ onClick, children, variant = "primary", disabled }) {
  const styles = {
    primary: { background: "#111", color: "#fff", border: "1.5px solid #111" },
    secondary: { background: "#fff", color: "#111", border: "1.5px solid #111" },
    ghost: { background: "transparent", color: "#888", border: "1.5px solid #ddd" },
    danger: { background: "transparent", color: "#c00", border: "1.5px solid #c00" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], padding: "8px 18px", borderRadius: 7,
      fontSize: 13, fontFamily: "monospace", fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      transition: "all 0.15s", letterSpacing: "0.04em",
    }}>
      {children}
    </button>
  );
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
function generatePDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595, ML = 56, MR = 56, TW = W - ML - MR;
  let y = 56;

  const line = () => { doc.setDrawColor(0); doc.setLineWidth(0.8); doc.line(ML, y, W - MR, y); y += 10; };
  const gap = (n = 6) => { y += n; };

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.name || "Your Name", W / 2, y, { align: "center" });
  y += 20;

  // Contact row
  const parts = [data.email, data.phone, data.linkedin, data.location].filter(Boolean);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(parts.join(" | "), W / 2, y, { align: "center" });
  y += 18;
  line();

  const sectionTitle = (title) => {
    gap(4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(title.toUpperCase(), ML, y);
    y += 6;
    doc.setLineWidth(0.5);
    doc.line(ML, y, W - MR, y);
    y += 10;
  };

  const wrapText = (text, maxWidth, fontSize) => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  };

  // EXPERIENCE
  if (data.experience?.length) {
    sectionTitle("Experience");
    data.experience.forEach(exp => {
      if (!exp.company && !exp.role) return;
      const durationText = formatDuration(exp);
      // Row 1: Company | Duration
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(exp.company || "", ML, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      if (durationText) doc.text(durationText, W - MR, y, { align: "right" });

      y += 13;
      // Row 2: Role | Location
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.text(exp.role || "", ML, y);
      doc.setFont("helvetica", "normal");
      if (exp.location) doc.text(exp.location, W - MR, y, { align: "right" });
      y += 12;

      exp.bullets.forEach(b => {
        if (!b.trim()) return;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        const lines = wrapText("– " + b, TW - 10, 9.5);
        lines.forEach((ln, i) => {
          doc.text(i === 0 ? ln : "  " + ln.trim(), ML + 8, y);
          y += 12;
        });
      });
      gap(4);
    });
  }

  // EDUCATION
  if (data.education?.length) {
    sectionTitle("Education");
    data.education.forEach(edu => {
      if (!edu.institution && !edu.degree) return;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(edu.institution || "", ML, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      if (edu.year) doc.text(edu.year, W - MR, y, { align: "right" });
      y += 13;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.text(edu.degree || "", ML, y);
      y += 12;

      if (edu.specialization) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        const lines = wrapText("Specialization in " + edu.specialization, TW, 9.5);
        lines.forEach(ln => { doc.text(ln, ML, y); y += 12; });
      }
      gap(4);
    });
  }

  // SKILLS
  if (data.skills?.length) {
    sectionTitle("Skills");
    const lines = wrapText(data.skills.join(" • "), TW, 9.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    lines.forEach(line => {
      doc.text(line, ML, y);
      y += 12;
    });
  }

  // RECOGNITION
  if (data.recognition) {
    sectionTitle("Recognition");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const lines = wrapText(data.recognition, TW, 9.5);
    lines.forEach(ln => { doc.text(ln, ML, y); y += 12; });
  }

  doc.save(`${(data.name || "resume").replace(/\s+/g, "_")}_resume.pdf`);
}

// ─── STEPS ───────────────────────────────────────────────────────────────────
function IntroStep({ onStart }) {
  const [quip] = useState(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, margin: "0 0 10px" }}>Resume Builder</h1>
      <p style={{ fontFamily: "monospace", fontSize: 13, color: "#555", maxWidth: 380, margin: "0 auto 8px" }}>
        Build a clean, ATS-ready resume in under 5 minutes.
      </p>
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#888", fontSize: 13, marginBottom: 32 }}>"{quip}"</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
        {["Contact Info", "Experience", "Education", "Skills", "Recognition"].map((s, i) => (
          <div key={s} style={{ fontFamily: "monospace", fontSize: 11, background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 20, padding: "4px 12px", color: "#555" }}>
            {i + 1}. {s}
          </div>
        ))}
      </div>
      <Btn onClick={onStart}>Begin Your Resume →</Btn>
    </div>
  );
}

function ContactStep({ data, onChange, errors }) {
  const fields = [
    { key: "name", label: "Full Name", placeholder: "Your Name", required: true },
    { key: "email", label: "Email", placeholder: "example@email.com", required: true },
    { key: "phone", label: "Phone", placeholder: "+91 XXXX XXXX" },
    { key: "linkedin", label: "LinkedIn URL", placeholder: "linkedin.com/in/yourprofile" },
    { key: "location", label: "Location", placeholder: "City, State" },
  ];
  return (
    <SectionCard title="Who are you?" emoji="👤">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {fields.map(f => (
          <div key={f.key} style={{ gridColumn: f.key === "name" ? "span 2" : "span 1" }}>
            <Label required={f.required}>{f.label}</Label>
            <Input value={data[f.key] || ""} onChange={v => onChange(f.key, v)} placeholder={f.placeholder} />
          </div>
        ))}
      </div>
      {errors?.length > 0 && <ErrorText>{errors.join(" ")}</ErrorText>}
    </SectionCard>
  );
}

function ExperienceStep({ data, onChange, errors }) {
  const [picker, setPicker] = useState({ idx: null, target: "start", year: new Date().getFullYear(), startMonth: "", startYear: "", endMonth: "", endYear: "", current: false });

  const add = () => onChange([...data, emptyExp()]);
  const remove = i => onChange(data.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(data.map((e, idx) => idx === i ? { ...e, [key]: val } : e));
  const addBullet = i => update(i, "bullets", [...data[i].bullets, ""]);
  const removeBullet = (i, bi) => update(i, "bullets", data[i].bullets.filter((_, idx) => idx !== bi));
  const updateBullet = (i, bi, val) => update(i, "bullets", data[i].bullets.map((b, idx) => idx === bi ? val : b));

  const openPicker = (i) => {
    const exp = data[i] || emptyExp();
    setPicker({
      idx: i,
      target: "start",
      year: exp.startYear ? Number(exp.startYear) : new Date().getFullYear(),
      startMonth: exp.startMonth || "",
      startYear: exp.startYear || "",
      endMonth: exp.endMonth || "",
      endYear: exp.endYear || "",
      current: Boolean(exp.current),
    });
  };

  const closePicker = () => setPicker(prev => ({ ...prev, idx: null }));

  const savePicker = () => {
    if (!picker.startMonth || !picker.startYear) { return; }
    onChange(data.map((exp, idx) => idx === picker.idx ? {
      ...exp,
      startMonth: picker.startMonth,
      startYear: picker.startYear,
      endMonth: picker.current ? "" : picker.endMonth,
      endYear: picker.current ? "" : picker.endYear,
      current: picker.current,
    } : exp));
    closePicker();
  };

  const setPickerValue = (field, value) => setPicker(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      {data.map((exp, i) => (
        <SectionCard key={i} title={`Experience ${i + 1}`} emoji="💼">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { key: "company", label: "Company Name", required: true },
              { key: "role", label: "Role / Title", required: true },
              { key: "location", label: "Location", placeholder: "Bangalore, KA" },
            ].map(f => (
              <div key={f.key}>
                <Label required={f.required}>{f.label}</Label>
                <Input value={exp[f.key]} onChange={v => update(i, f.key, v)} placeholder={f.placeholder || ""} />
              </div>
            ))}
            <div>
              <Label>Duration</Label>
              <button
                type="button"
                onClick={() => openPicker(i)}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 12px",
                  border: "1.5px solid #ddd", borderRadius: 6, background: "#fff",
                  fontFamily: "Georgia, serif", color: "#111", cursor: "pointer",
                }}
              >
                {formatDuration(exp) || "Select duration"}
              </button>
              {exp.current && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#444", fontFamily: "monospace" }}>
                  Currently working here
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Label>Key Achievements / Responsibilities</Label>
            {exp.bullets.map((b, bi) => (
              <div key={bi} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "monospace", fontSize: 13, marginTop: 10, color: "#888" }}>–</span>
                <div style={{ flex: 1 }}>
                  <Input value={b} onChange={v => updateBullet(i, bi, v)} placeholder="Describe what you achieved or built…" multiline rows={2} />
                </div>
                {exp.bullets.length > 1 && (
                  <button onClick={() => removeBullet(i, bi)} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: "#c00", fontSize: 16 }}>✕</button>
                )}
              </div>
            ))}
            <Btn variant="ghost" onClick={() => addBullet(i)}>+ Add bullet</Btn>
          </div>
          {data.length > 1 && (
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <Btn variant="danger" onClick={() => remove(i)}>Remove</Btn>
            </div>
          )}
        </SectionCard>
      ))}
      <Btn variant="secondary" onClick={add}>+ Add Another Role</Btn>
      {errors?.length > 0 && <ErrorText>{errors.join(" ")}</ErrorText>}

      {picker.idx !== null && (
        <div onClick={closePicker} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 360, maxWidth: "100%", background: "#fff", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.16)", padding: 22, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>Select Duration</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Choose start and end dates.</div>
              </div>
              <button onClick={closePicker} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#666" }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                { key: "start", label: "Start Date" },
                { key: "end", label: "End Date" },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPickerValue("target", tab.key)}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10,
                    border: `1px solid ${picker.target === tab.key ? "#111" : "#ddd"}`,
                    background: picker.target === tab.key ? "#111" : "#fff",
                    color: picker.target === tab.key ? "#fff" : "#111",
                    fontFamily: "monospace", cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button type="button" onClick={() => setPickerValue("year", picker.year - 1)} style={{ border: "1px solid #ddd", background: "transparent", borderRadius: 8, width: 34, height: 34, cursor: "pointer" }}>←</button>
              <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700 }}>{picker.year}</div>
              <button type="button" onClick={() => setPickerValue("year", picker.year + 1)} style={{ border: "1px solid #ddd", background: "transparent", borderRadius: 8, width: 34, height: 34, cursor: "pointer" }}>→</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
              {MONTHS.map(month => {
                const active = picker.target === "start" ? picker.startMonth === month : picker.endMonth === month;
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setPickerValue(picker.target === "start" ? "startMonth" : "endMonth", month)}
                    style={{
                      padding: "10px 0", borderRadius: 10, border: `1px solid ${active ? "#111" : "#ddd"}`,
                      background: active ? "#111" : "#f9f9f9", color: active ? "#fff" : "#111",
                      fontFamily: "monospace", cursor: "pointer",
                    }}
                  >
                    {month}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <Label>Month</Label>
                <div style={{ padding: "10px 12px", border: "1.5px solid #ddd", borderRadius: 8, background: "#fff", fontFamily: "Georgia, serif", color: "#111" }}>
                  {picker.target === "start" ? picker.startMonth || "Select month" : picker.endMonth || "Select month"}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <Label>Year</Label>
                <input
                  type="number"
                  value={picker.target === "start" ? picker.startYear : picker.endYear}
                  onChange={e => setPickerValue(picker.target === "start" ? "startYear" : "endYear", e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 14, fontFamily: "Georgia, serif" }}
                />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, cursor: "pointer", fontFamily: "monospace", color: "#333" }}>
              <input type="checkbox" checked={picker.current} onChange={e => setPickerValue("current", e.target.checked)} />
              Currently work here
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn variant="ghost" onClick={closePicker}>Cancel</Btn>
              <Btn onClick={savePicker}>Save</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EducationStep({ data, onChange, errors }) {
  const add = () => onChange([...data, emptyEdu()]);
  const remove = i => onChange(data.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(data.map((e, idx) => idx === i ? { ...e, [key]: val } : e));

  return (
    <div>
      {data.map((edu, i) => (
        <SectionCard key={i} title={`Education ${i + 1}`} emoji="🎓">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { key: "institution", label: "Institution", required: true },
              { key: "degree", label: "Degree / Program", required: true },
              { key: "year", label: "Graduation Year / Month", placeholder: "May 2024" },
              { key: "specialization", label: "Specialization (optional)", placeholder: "Communication and Media Studies" },
            ].map(f => (
              <div key={f.key} style={{ gridColumn: f.key === "institution" || f.key === "specialization" ? "span 2" : "span 1" }}>
                <Label required={f.required}>{f.label}</Label>
                <Input value={edu[f.key]} onChange={v => update(i, f.key, v)} placeholder={f.placeholder || ""} />
              </div>
            ))}
          </div>
          {data.length > 1 && (
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <Btn variant="danger" onClick={() => remove(i)}>Remove</Btn>
            </div>
          )}
        </SectionCard>
      ))}
      <Btn variant="secondary" onClick={add}>+ Add Another Degree</Btn>
      {errors?.length > 0 && <ErrorText>{errors.join(" ")}</ErrorText>}
    </div>
  );
}

function SkillsStep({ data, onChange }) {
  const [inputValue, setInputValue] = useState("");

  const addSkills = (raw) => {
    const items = raw
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
    if (!items.length) return;
    onChange([...data, ...items]);
  };

  const handleChange = (value) => {
    if (value.includes(",")) {
      addSkills(value);
      setInputValue("");
      return;
    }
    setInputValue(value);
  };

  const removeSkill = (index) => {
    onChange(data.filter((_, idx) => idx !== index));
  };

  return (
    <SectionCard title="Your Skill Arsenal" emoji="⚡">
      <p style={{ fontFamily: "monospace", fontSize: 11, color: "#888", marginBottom: 16, marginTop: 0 }}>
        Separate skills with commas. Each skill becomes a tag inside the builder.
      </p>
      <Label>Skills</Label>
      <Input
        value={inputValue}
        onChange={handleChange}
        placeholder="Type a skill, then add a comma"
      />
      {data.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {data.map((skill, idx) => (
            <div key={`${skill}-${idx}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 999, background: "#fff", fontFamily: "monospace", fontSize: 12 }}>
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(idx)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function RecognitionStep({ data, onChange }) {
  return (
    <SectionCard title="Achievements & Certifications" emoji="🏆">
      <p style={{ fontFamily: "monospace", fontSize: 11, color: "#888", marginBottom: 12, marginTop: 0 }}>
        Awards, certifications, publications. Keep it concise — one entry per line works great.
      </p>
      <Label>Recognition</Label>
      <Input value={data || ""} onChange={onChange} placeholder={"Google UX Design Professional Certificate · Google AI Essentials - both via Coursera"} multiline rows={4} />
    </SectionCard>
  );
}

function PreviewStep({ formData, onExport }) {
  const { contact, experience, education, skills, recognition } = formData;
  const mono = { fontFamily: "monospace" };
  const serif = { fontFamily: "Georgia, serif" };

  return (
    <div>
      <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 12, padding: 32, marginBottom: 20, maxWidth: 680, margin: "0 auto 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ ...serif, fontSize: 22, fontWeight: 700 }}>{contact.name || "Your Name"}</div>
          <div style={{ ...mono, fontSize: 11, color: "#444", marginTop: 4 }}>
            {[contact.email, contact.phone, contact.linkedin, contact.location].filter(Boolean).join(" | ")}
          </div>
        </div>
        <hr style={{ border: "none", borderTop: "1.5px solid #111", margin: "12px 0" }} />

        {/* Experience */}
        {experience.some(e => e.company || e.role) && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>EXPERIENCE</div>
            <hr style={{ border: "none", borderTop: "0.5px solid #999", margin: "0 0 10px" }} />
            {experience.map((exp, i) => (exp.company || exp.role) && (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...mono, fontSize: 10, fontWeight: 700 }}>{exp.company}</span>
                  <span style={{ ...mono, fontSize: 10, color: "#555" }}>{formatDuration(exp)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...serif, fontSize: 10, fontStyle: "italic" }}>{exp.role}</span>
                  <span style={{ ...mono, fontSize: 10, color: "#555" }}>{exp.location}</span>
                </div>
                {exp.bullets.map((b, bi) => b && <div key={bi} style={{ ...serif, fontSize: 10, marginLeft: 8, marginTop: 3, color: "#222" }}>– {b}</div>)}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.some(e => e.institution || e.degree) && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>EDUCATION</div>
            <hr style={{ border: "none", borderTop: "0.5px solid #999", margin: "0 0 10px" }} />
            {education.map((edu, i) => (edu.institution || edu.degree) && (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...mono, fontSize: 10, fontWeight: 700 }}>{edu.institution}</span>
                  <span style={{ ...mono, fontSize: 10, color: "#555" }}>{edu.year}</span>
                </div>
                <div style={{ ...serif, fontSize: 10, fontStyle: "italic" }}>{edu.degree}</div>
                {edu.specialization && <div style={{ ...serif, fontSize: 10, color: "#444" }}>Specialization in {edu.specialization}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                ...mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                marginBottom: 4,
              }}
            >
              SKILLS
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "0.5px solid #999",
                margin: "0 0 10px",
              }}
            />

            <div
              style={{
                ...serif,
                fontSize: 10,
                lineHeight: 1.6,
              }}
            >
              {skills.join(" • ")}
            </div>
          </div>
        )}

        {/* Recognition */}
        {recognition && (
          <div>
            <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>RECOGNITION</div>
            <hr style={{ border: "none", borderTop: "0.5px solid #999", margin: "0 0 10px" }} />
            <div style={{ ...serif, fontSize: 10 }}>{recognition}</div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#888", marginBottom: 16 }}>
          Looks good? Export your resume as PDF.
        </p>
        <Btn onClick={onExport}>⬇ Download PDF</Btn>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0); // index into SECTIONS
  const [xp, setXp] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [jsPDFLoaded, setJsPDFLoaded] = useState(false);

  const [contact, setContact] = useState({ name: "", email: "", phone: "", linkedin: "", location: "" });
  const [experience, setExperience] = useState([emptyExp()]);
  const [education, setEducation] = useState([emptyEdu()]);
  const [skills, setSkills] = useState([]);
  const [recognition, setRecognition] = useState("");

  // Load jsPDF
  useEffect(() => {
    if (window.jspdf) { setJsPDFLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => setJsPDFLoaded(true);
    document.head.appendChild(script);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const awardXp = (section) => {
    if (!completedSections.has(section)) {
      const earned = SECTION_XP[section] || 0;
      setXp(x => x + earned);
      setCompletedSections(s => new Set([...s, section]));
      showToast(`+${earned} XP — ${section} complete! 🎉`);
    }
  };

  const maxXp = Object.values(SECTION_XP).reduce((a, b) => a + b, 0);
  const currentSection = SECTIONS[step];

  const goNext = () => {
    const section = SECTIONS[step];
    if (SECTION_XP[section]) awardXp(section);
    setStep(s => Math.min(s + 1, SECTIONS.length - 1));
  };

  const goPrev = () => setStep(s => Math.max(s - 1, 0));

  const handleExport = () => {
    if (!jsPDFLoaded) { showToast("PDF library loading, try again in a second."); return; }
    generatePDF({ ...contact, experience, education, skills, recognition });
  };

  const isContactComplete = contact.name.trim() && contact.email.trim();
  const isExperienceComplete = experience.some(exp => exp.company.trim() && exp.role.trim());
  const isEducationComplete = education.some(edu => edu.institution.trim() && edu.degree.trim());

  const contactWarnings = [];
  if (!contact.name.trim()) contactWarnings.push("Full Name is required.");
  if (!contact.email.trim()) contactWarnings.push("Email is required.");

  const experienceWarnings = [];
  if (!isExperienceComplete) experienceWarnings.push("Provide at least one experience entry with company and role.");

  const educationWarnings = [];
  if (!isEducationComplete) educationWarnings.push("Provide at least one education entry with institution and degree.");

  const canAdvance = () => {
    switch (currentSection) {
      case "contact":
        return Boolean(isContactComplete);
      case "experience":
        return Boolean(isExperienceComplete);
      case "education":
        return Boolean(isEducationComplete);
      default:
        return true;
    }
  };

  const badgeList = ["contact", "experience", "education", "skills", "recognition"];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", fontFamily: "Georgia, serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#111", color: "#fff", padding: "10px 22px", borderRadius: 24,
          fontFamily: "monospace", fontSize: 13, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.2s ease",
        }}>{toast}</div>
      )}

      {/* Top bar */}
      {step > 0 && step < SECTIONS.length - 1 && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "12px 24px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
                {SECTION_LABELS[currentSection]}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#777" }}>
                Step {step} of {SECTIONS.length - 2}
              </span>
            </div>
            <XPBar xp={xp} maxXp={maxXp} />
            <div style={{ marginTop: 8 }}>
              {badgeList.map(s => <Badge key={s} label={SECTION_LABELS[s]} earned={completedSections.has(s)} />)}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>
        {currentSection === "intro" && <IntroStep onStart={() => setStep(1)} />}

        {currentSection === "contact" && (
          <>
            <ContactStep data={contact} errors={contactWarnings} onChange={(k, v) => setContact(c => ({ ...c, [k]: v }))} />
          </>
        )}
        {currentSection === "experience" && (
          <ExperienceStep data={experience} errors={experienceWarnings} onChange={setExperience} />
        )}
        {currentSection === "education" && (
          <EducationStep data={education} errors={educationWarnings} onChange={setEducation} />
        )}
        {currentSection === "skills" && (
          <SkillsStep data={skills} onChange={setSkills} />
        )}
        {currentSection === "recognition" && (
          <RecognitionStep data={recognition} onChange={setRecognition} />
        )}
        {currentSection === "preview" && (
          <PreviewStep
            formData={{ contact, experience, education, skills, recognition }}
            onExport={handleExport}
          />
        )}

        {/* Navigation */}
        {currentSection !== "intro" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
            <Btn variant="ghost" onClick={goPrev}>← Back</Btn>
            {currentSection !== "preview" && (
              <Btn onClick={goNext} disabled={!canAdvance()}>
                {currentSection === "recognition" ? "Preview Resume →" : "Next →"}
              </Btn>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play, Pause, RotateCcw, Edit2, Save, X,
  Calendar, Flame, Plus, Trash2, ExternalLink
} from "lucide-react";
import InstallBanner from "./components/InstallBanner.jsx";

/* ===== Brand Colors ===== */
const BRAND = {
  bgFrom: "#FAF6F2",
  bgTo: "#F3ECE6",
  cardBg: "rgba(255,255,255,0.9)",
  cardBorder: "#E9E1DA",
  text: "#1F2937",
  subtext: "#6B7280",
  accent: "#C07A4C",
  accentDark: "#A96338",
  ringBase: "#E6DAD0",
  ringFill: "#C07A4C",
  pill: "#F5EEE8",
  successBg: "#E9F7EF",
  successText: "#1B5E20",
};

const ymdLocal = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const toMMSS = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const STEPS = ["Breathing", "Power Statements", "Future-Casting"];
const DEFAULT_STATEMENTS = [
  "This is my turning point.",
  "Alignment before action.",
  "Calm body, clear mind, bold moves.",
  "I’m open, receptive, magnetic.",
  "I grow every day.",
  "Energy first, tasks second.",
  "Five minutes to start; flow follows.",
  "Phone down, focus up.",
  "Small step, big proof.",
  "I give and receive love, freely and daily.",
  "Soft heart, strong spine.",
  "I design simple, ship fast, learn always.",
  "1% better today. 1000× impact tomorrow.",
  "I’m safe to prosper. Money flows; I steer.",
  "Abundance follows service. I serve → I grow.",
  "Fear is data, not a decision.",
];

const QUOTES = [
  { text: "Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "Your life does not get better by chance, it gets better by change.", author: "Jim Rohn" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
];

const K = {
  streak: "flow222_streak",
  lastDone: "flow222_last_done",
  statementsList: "flow222_statements_list",
  selectedToday: "flow222_selected_today",
  futureCast: "flow222_future_cast",
  reminderTime: "flow222_reminder_time",
};

export default function App() {
  // steps + timers (auto-advance only by timer finishing)
  const [step, setStep] = useState(0); // 0..2, 3 = complete
  const [timeLeft, setTimeLeft] = useState(120);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);
  const [done0, setDone0] = useState(false);
  const [done1, setDone1] = useState(false);
  const [done2, setDone2] = useState(false);

  // statements
  const [statements, setStatements] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(K.statementsList) || "[]");
      return saved.length ? saved : DEFAULT_STATEMENTS;
    } catch { return DEFAULT_STATEMENTS; }
  });
  const [selected, setSelected] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(K.selectedToday) || "[]");
      return Array.isArray(s) ? s : [];
    } catch { return []; }
  });
  const [editingStatements, setEditingStatements] = useState(false);
  const [newStatement, setNewStatement] = useState("");

  // future-cast
  const [futureCast, setFutureCast] = useState(localStorage.getItem(K.futureCast) || "");
  const [editingFC, setEditingFC] = useState(false);
  const [draftFC, setDraftFC] = useState("");

  // streak + reminder
  const [streak, setStreak] = useState(() => Number(localStorage.getItem(K.streak)) || 0);
  const [lastDone, setLastDone] = useState(localStorage.getItem(K.lastDone) || "");
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderTime, setReminderTime] = useState(localStorage.getItem(K.reminderTime) || "08:00");

  // calm tone on finish
  const playCalmTone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 528;
      o.connect(g); g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.15, now + 0.2);
      g.gain.linearRampToValueAtTime(0.12, now + 0.6);
      g.gain.linearRampToValueAtTime(0, now + 1.2);
      o.start(now); o.stop(now + 1.25);
    } catch {}
  };

  // timer
  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setRunning(false);
          setTimeLeft(0);
          if (step === 0) setDone0(true);
          if (step === 1) setDone1(true);
          if (step === 2) setDone2(true);
          playCalmTone();
          // wait 10s then move to next
          setTimeout(() => {
            if (step < 2) {
              setStep((s) => s + 1);
              setTimeLeft(120);
            } else {
              setStep(3);
            }
          }, 10000);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, step]);

  const resetTimer = (s = 120) => { setRunning(false); setTimeLeft(s); };

  // persistence
  useEffect(() => { localStorage.setItem(K.statementsList, JSON.stringify(statements)); }, [statements]);
  useEffect(() => { localStorage.setItem(K.selectedToday, JSON.stringify(selected)); }, [selected]);
  useEffect(() => { localStorage.setItem(K.futureCast, futureCast || ""); }, [futureCast]);
  useEffect(() => { localStorage.setItem(K.reminderTime, reminderTime); }, [reminderTime]);
  useEffect(() => { localStorage.setItem(K.streak, String(streak)); if (lastDone) localStorage.setItem(K.lastDone, lastDone); }, [streak, lastDone]);

  // streak only when all three finished
  useEffect(() => {
    if (done0 && done1 && done2) {
      const today = ymdLocal();
      if (lastDone !== today) {
        const yesterday = ymdLocal(new Date(Date.now() - 86400000));
        setStreak(lastDone === yesterday ? streak + 1 : 1);
        setLastDone(today);
      }
    }
  }, [done0, done1, done2, lastDone, streak]);

  // editing helpers (don’t affect auto-advance)
  const toggleSelect = (line) =>
    setSelected((prev) => (prev.includes(line) ? prev.filter((l) => l !== line) : [...prev, line]));
  const updateStatement = (idx, text) =>
    setStatements((list) => list.map((v, i) => (i === idx ? text : v)));
  const removeStatement = (idx) =>
    setStatements((list) => list.filter((_, i) => i !== idx));
  const addStatement = () => {
    const s = newStatement.trim(); if (!s) return;
    setStatements((list) => [...list, s]); setNewStatement("");
  };

  const openFC = () => {
    setDraftFC(
`Futurecasting 😎

Your yummy vision: 4-6 bullet points 
How would that FEEL 
How would you drink your coffee/tea/water in the morning ;)
How would it feel at dinner?
How would that feel walking down the street/trail/to your car? 
Flex Abundance - Specifically on Money
Vision and feeling of how you would be when getting it 
I did it! I did it! I did it! 
How would you stand on your deck?
How does $100M feel? 
How does fame/recognition/more than enough feel? 
Can you see yourself? Can you feel that feeling?`
    );
    setEditingFC(true);
  };
  const saveFC = () => { setFutureCast(draftFC); setEditingFC(false); };

  // ics reminder
  const downloadICS = () => {
    const [H, M] = reminderTime.split(":").map(Number);
    const d = new Date(); d.setHours(H, M, 0, 0);
    const p = (n) => String(n).padStart(2, "0");
    const DTSTART = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(H)}${p(M)}00`;
    const ics = [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//BestBonobos//2-2-2//EN","BEGIN:VEVENT",
      `UID:${Date.now()}@bestbonobos`,"SUMMARY:2-2-2 Morning Routine",
      "DESCRIPTION:Two minutes to align your day ✨","RRULE:FREQ=DAILY",
      `DTSTART:${DTSTART}`,"END:VEVENT","END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "222-daily-reminder.ics"; a.click(); URL.revokeObjectURL(url);
  };

  // ring animation
  const R = 94, CIRC = 2 * Math.PI * R, total = 120;
  const dash = CIRC * (1 - (total - timeLeft) / total);
  const ringGlow = running ? "drop-shadow(0 0 10px rgba(192,122,76,0.35))" : "none";

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [step === 3]);

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ backgroundImage: `linear-gradient(180deg, ${BRAND.bgFrom}, ${BRAND.bgTo})` }}
    >
      <InstallBanner />

      {/* HEADER (centered) */}
      <header className="w-full max-w-xl px-5 pt-6 text-center">
        <h1 className="text-3xl font-extrabold" style={{ color: BRAND.text }}>
          {step === 0 ? "Breathe" : step === 1 ? "Power" : step === 2 ? "Future-Cast" : "Great job"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: BRAND.subtext }}>
          FLOW · Law of Attraction with Alleah
        </p>
        <div className="flex justify-center items-center gap-2 mt-2" style={{ color: BRAND.accent }}>
          <Flame className="w-5 h-5" />
          <span className="font-semibold">{streak}</span>
          <span className="text-sm" style={{ color: BRAND.subtext }}>day streak</span>
        </div>

        {/* TABS in one row */}
        <nav className="mt-3 flex justify-center gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className="px-3 py-1.5 rounded-full text-sm font-medium border"
              style={{
                borderColor: BRAND.cardBorder,
                background: i === step ? BRAND.pill : "#fff",
                color: i === step ? BRAND.accent : BRAND.text
              }}
            >
              {label}
            </div>
          ))}
        </nav>
      </header>

      {/* MAIN CARD (centered) */}
      <main className="w-full max-w-xl px-5 pb-16 flex flex-col items-center">
        {step <= 2 && (
          <div
            className="rounded-3xl shadow-xl p-6 w-full max-w-md text-center mx-auto"
            style={{ background: BRAND.cardBg, border: `1px solid ${BRAND.cardBorder}` }}
          >
            {/* timer */}
            <div className="relative flex flex-col items-center justify-center py-4">
              <svg width="220" height="220">
                <circle cx="110" cy="110" r={R} fill="none" stroke={BRAND.ringBase} strokeWidth="14" />
                <circle
                  cx="110"
                  cy="110"
                  r={R}
                  fill="none"
                  stroke={BRAND.ringFill}
                  strokeWidth="14"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dash}
                  strokeLinecap="round"
                  transform="rotate(-90 110 110)"
                  style={{ transition: "stroke-dashoffset 1s linear, filter .25s ease", filter: ringGlow }}
                />
                <text x="110" y="116" textAnchor="middle" fontSize="36" fontWeight="bold" fill={BRAND.text}>
                  {toMMSS(timeLeft)}
                </text>
              </svg>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => setRunning((r) => !r)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white shadow-lg"
                  style={{ background: BRAND.accent }}
                >
                  {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {running ? "Pause" : "Start"}
                </button>
                <button
                  onClick={() => resetTimer(120)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border"
                  style={{ borderColor: BRAND.cardBorder, color: BRAND.text, background: "#fff" }}
                >
                  <RotateCcw className="w-5 h-5" /> Reset
                </button>
              </div>
            </div>

            {/* step contents */}
            {step === 0 && (
              <section className="mt-6">
                <h3 className="font-semibold mb-2" style={{ color: BRAND.text }}>What do you want to do?</h3>
                <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
                  <LinkCard title="Learn breathing" href="https://www.youtube.com/results?search_query=2+minute+breathing" />
                  <LinkCard title="Morning yoga" href="https://www.youtube.com/results?search_query=2+minute+yoga" />
                  <LinkCard title="Quick meditation" href="https://www.youtube.com/results?search_query=2+minute+meditation" />
                  <InfoChip text="2 minutes" />
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="mt-4">
                <h3 className="font-semibold mb-3" style={{ color: BRAND.text }}>Say 3–7 lines out loud</h3>
                {statements.map((line, idx) => {
                  const active = selected.includes(line);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSelect(line)}
                      className="block w-full p-3 rounded-2xl mb-2 border mx-auto"
                      style={{
                        maxWidth: 420,
                        borderColor: active ? BRAND.accent : BRAND.cardBorder,
                        background: active ? BRAND.accent : "#F8FAFC",
                        color: active ? "#fff" : BRAND.text
                      }}
                    >
                      {line}
                    </button>
                  );
                })}
                <button
                  onClick={() => setEditingStatements(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white"
                  style={{ background: BRAND.accent }}
                >
                  <Edit2 className="w-4 h-4" /> Customize
                </button>
              </section>
            )}

            {step === 2 && (
              <section className="mt-4">
                <h3 className="font-semibold mb-3" style={{ color: BRAND.text }}>Future-Casting</h3>
                {futureCast ? (
                  <article
                    className="rounded-2xl p-4 whitespace-pre-wrap leading-relaxed text-left mx-auto"
                    style={{ maxWidth: 420, background: "#FFF9F5", border: `1px solid ${BRAND.cardBorder}`, color: BRAND.text }}
                  >
                    {futureCast}
                  </article>
                ) : (
                  <div
                    className="rounded-2xl p-4 text-left mx-auto"
                    style={{ maxWidth: 420, background: "#FFF9F5", border: `1px solid ${BRAND.cardBorder}`, color: BRAND.subtext }}
                  >
                    Futurecasting 😎
                    <br /><br />
                    Your yummy vision: 4-6 bullet points<br />
                    How would that FEEL<br />
                    How would you drink your coffee/tea/water in the morning ;)<br />
                    How would it feel at dinner?<br />
                    How would that feel walking down the street/trail/to your car?<br />
                    Flex Abundance - Specifically on Money<br />
                    Vision and feeling of how you would be when getting it<br />
                    I did it! I did it! I did it!<br />
                    How would you stand on your deck?<br />
                    How does $100M feel?<br />
                    How does fame/recognition/more than enough feel?<br />
                    Can you see yourself? Can you feel that feeling?
                  </div>
                )}
                <button
                  onClick={openFC}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white"
                  style={{ background: BRAND.accent }}
                >
                  <Edit2 className="w-4 h-4" /> {futureCast ? "Edit" : "Create"}
                </button>
              </section>
            )}
          </div>
        )}

        {/* final screen */}
        {step === 3 && (
          <div
            className="rounded-3xl shadow-xl p-6 text-center w-full max-w-md mx-auto"
            style={{ background: BRAND.cardBg, border: `1px solid ${BRAND.cardBorder}` }}
          >
            <img
              src="/Alleah-500.png"
              alt="Alleah"
              className="mx-auto w-56 h-56 object-cover rounded-[36%] shadow-sm mb-4"
              style={{ transform: "rotate(-8deg)" }}
            />
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: BRAND.text }}>Great job! ✨</h2>
            <p className="mb-4" style={{ color: BRAND.subtext }}>
              You completed your 2-2-2 today. See you tomorrow.
            </p>
            <figure className="mx-auto max-w-sm rounded-2xl px-4 py-3"
                    style={{ background: BRAND.successBg, color: BRAND.successText }}>
              <blockquote className="italic">“{quote.text}”</blockquote>
              <figcaption className="mt-1 text-sm">— {quote.author}</figcaption>
            </figure>

            <div className="mt-6">
              <button
                onClick={() => setReminderOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white shadow"
                style={{ background: BRAND.accent }}
              >
                <Calendar className="w-4 h-4" /> Remind me daily
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {editingStatements && (
        <Modal title="Customize power statements" onClose={() => setEditingStatements(false)}>
          <div className="space-y-3 text-left">
            {statements.map((line, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={line}
                  onChange={(e) => updateStatement(idx, e.target.value)}
                  className="flex-1 border rounded-xl px-3 py-2"
                  style={{ borderColor: BRAND.cardBorder }}
                />
                <button
                  onClick={() => removeStatement(idx)}
                  className="px-3 py-2 rounded-xl border"
                  style={{ borderColor: BRAND.cardBorder }}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newStatement}
                onChange={(e) => setNewStatement(e.target.value)}
                placeholder="Add new statement…"
                className="flex-1 border rounded-xl px-3 py-2"
                style={{ borderColor: BRAND.cardBorder }}
              />
              <button
                onClick={addStatement}
                className="px-3 py-2 rounded-xl text-white"
                style={{ background: BRAND.accent }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setEditingStatements(false)}
                className="px-4 py-2 rounded-full border"
                style={{ borderColor: BRAND.cardBorder }}
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editingFC && (
        <Modal title="Edit your future-cast" onClose={() => setEditingFC(false)}>
          <textarea
            value={draftFC}
            onChange={(e) => setDraftFC(e.target.value)}
            className="w-full h-80 p-4 rounded-2xl"
            style={{ border: `2px solid ${BRAND.cardBorder}`, background: "#FFF9F5" }}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setEditingFC(false)}
              className="px-4 py-2 rounded-full text-white"
              style={{ background: "#9CA3AF" }}
            >
              <X className="w-4 h-4 inline mr-1" /> Cancel
            </button>
            <button
              onClick={saveFC}
              className="px-4 py-2 rounded-full text-white"
              style={{ background: BRAND.accent }}
            >
              <Save className="w-4 h-4 inline mr-1" /> Save
            </button>
          </div>
        </Modal>
      )}

      {reminderOpen && (
        <Modal title="Daily reminder" onClose={() => setReminderOpen(false)}>
          <div className="flex flex-col items-center gap-3 mb-3">
            <label className="font-medium">Time</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="border rounded-xl px-3 py-2 text-center"
              style={{ borderColor: BRAND.cardBorder }}
            />
          </div>
          <p className="text-sm" style={{ color: BRAND.subtext }}>
            Download an <code>.ics</code> and add it to Apple Calendar for a reliable daily iOS notification.
          </p>
          <div className="flex justify-center mt-3">
            <button
              onClick={downloadICS}
              className="px-4 py-2 rounded-full text-white"
              style={{ background: BRAND.accent }}
            >
              Download .ics
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===== UI bits ===== */
function LinkCard({ title, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl p-4 flex items-center justify-between hover:shadow-md mx-auto"
      style={{ background: "#FFF9F5", border: `1px solid ${BRAND.cardBorder}`, color: BRAND.text, maxWidth: 320 }}
    >
      <span className="font-medium">{title}</span>
      <ExternalLink className="w-4 h-4" style={{ color: BRAND.accent }} />
    </a>
  );
}
function InfoChip({ text }) {
  return (
    <div
      className="rounded-2xl p-4 text-center mx-auto"
      style={{ background: "#fff", border: `1px solid ${BRAND.cardBorder}`, color: BRAND.subtext, maxWidth: 320 }}
    >
      {text}
    </div>
  );
}
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl shadow-2xl p-6 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold" style={{ color: BRAND.text }}>{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: "#F3F4F6" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

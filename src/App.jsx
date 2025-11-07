import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Wind,
  Star,
  Sparkles,
  Calendar,
  ExternalLink,
  Info,
  Volume2,
  VolumeX,
} from "lucide-react";
import InstallBanner from "./components/InstallBanner.jsx";

/* ========= Brand ========= */
const BRAND = {
  bgFrom: "#FFF6F1",
  bgTo: "#FDEEE8",
  text: "#1C2A33",
  sub: "#6A7A86",
  coral: "#F4846C",
  coral2: "#E97159",
  cream: "#FFFFFF",
  creamSoftTop: "#FFF7F2",
  creamSoftBot: "#FFF2EB",
  border: "#F1E5DD",
  ringBase: "#F1E2D9",
  ringFill: "#F4846C",
  pill: "#FFE7DE",
  shadowLg: "0 24px 50px rgba(245,128,99,.18)",
  shadowMd: "0 12px 24px rgba(245,128,99,.12)",
};

const DEV_DONE_TAB_INDEX = 4;

/* ===== Helpers ===== */
const ymd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const toMMSS = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const getWeekKey = (d = new Date()) =>
  `${d.getFullYear()}-W${Math.ceil(
    ((d - new Date(d.getFullYear(), 0, 1)) / 86400000 +
      new Date(d.getFullYear(), 0, 1).getDay() +
      1) /
      7
  )}`;

/* ===== Storage keys ===== */
const K = {
  statementsList: "flow222_statements_list",
  selectedToday: "flow222_selected_today",
  futureCast: "flow222_future_cast",
  rewrites: "flow222_rewrites",
  streak: "flow222_streak",
  lastDone: "flow222_last_done",
  reminderTime: "flow222_rem_time",
  weeklySkipUsed: "flow222_skip_week",
  soundEnabled: "flow222_sound_enabled",
};

/* ===== Defaults ===== */
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

const DEFAULT_REWRITES = [
  {
    id: 1,
    current: "I never have enough time.",
    r1: "I'm learning to prioritise what truly matters.",
    r2: "There is enough time for the things that are aligned with me.",
  },
  {
    id: 2,
    current: "Money is always stressful for me.",
    r1: "I'm getting better at managing and welcoming money.",
    r2: "Money can be a calm, supportive partner in my life.",
  },
  {
    id: 3,
    current: "I'm not consistent enough to succeed.",
    r1: "I'm discovering my own natural rhythm of consistency.",
    r2: "Small, gentle steps still count and add up for me.",
  },
  {
    id: 4,
    current: "Other people are further ahead than I am.",
    r1: "I'm on my own unique, perfectly-timed path.",
    r2: "I can celebrate others and still trust my timing.",
  },
  {
    id: 5,
    current: "I’m afraid I’ll mess things up.",
    r1: "I'm allowed to learn as I go.",
    r2: "Every experience gives me more wisdom and clarity.",
  },
];

const FUTURECAST_TEMPLATE = `Futurecasting 😎

Your yummy vision: 4–6 bullet points
How would that FEEL?
How would you drink your coffee/tea/water in the morning? ;)
How would it feel at dinner?
How would that feel walking down the street/trail/to your car?
Flex Abundance — specifically about Money
Vision + feeling of you when getting it
I did it! I did it! I did it!
How would you stand on your deck?
How does $100M feel?
How does fame/recognition/more than enough feel?
Can you see yourself? Can you feel that feeling?`;

const QUOTES = [
  { text: "Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  {
    text: "Your life does not get better by chance, it gets better by change.",
    author: "Jim Rohn",
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
  },
  {
    text:
      "The happiness of your life depends upon the quality of your thoughts.",
    author: "Marcus Aurelius",
  },
];

/* ================================================== */

export default function App() {
  /* --- step & timer --- */
  const [tab, setTab] = useState(0); // 0 Breathing, 1 Power, 2 Rewrites, 3 Future, 4 Final
  const [timeLeft, setTimeLeft] = useState(120);
  const [running, setRunning] = useState(false);
  const tRef = useRef(null);

  // completion flags ONLY set by finishing timers
  const [done0, setDone0] = useState(false);
  const [done1, setDone1] = useState(false);
  const [done2, setDone2] = useState(false);
  const [done3, setDone3] = useState(false);

  /* --- popup after each step --- */
  const [nextPrompt, setNextPrompt] = useState(null); // {title, cta, toTab}
  const [autoNextTimer, setAutoNextTimer] = useState(null);

  /* --- streak + weekly skip --- */
  const [streak, setStreak] = useState(
    () => Number(localStorage.getItem(K.streak)) || 0
  );
  const [lastDone, setLastDone] = useState(
    localStorage.getItem(K.lastDone) || ""
  );
  const [skipWeek, setSkipWeek] = useState(
    localStorage.getItem(K.weeklySkipUsed) || ""
  );

  /* --- statements --- */
  const [statements, setStatements] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(K.statementsList) || "[]"
      );
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return DEFAULT_STATEMENTS.slice(0, 8); // seed eerste 8
  });
  const [selected, setSelected] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(K.selectedToday) || "[]");
      return Array.isArray(s) ? s : [];
    } catch {
      return [];
    }
  });
  const [editStatements, setEditStatements] = useState(false);
  const [tempStatements, setTempStatements] = useState([]);
  const [newLine, setNewLine] = useState("");

  /* --- rewrites (story + 2 rewrites) --- */
  const [rewrites, setRewrites] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(K.rewrites) || "[]");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return DEFAULT_REWRITES;
  });
  const [editRewrites, setEditRewrites] = useState(false);
  const [tempRewrites, setTempRewrites] = useState([]);

  /* --- future-cast --- */
  const [futureCast, setFutureCast] = useState(
    localStorage.getItem(K.futureCast) || ""
  );
  const [editFC, setEditFC] = useState(false);
  const [draftFC, setDraftFC] = useState("");

  /* --- reminder --- */
  const [remOpen, setRemOpen] = useState(false);
  const [remTime, setRemTime] = useState(
    localStorage.getItem(K.reminderTime) || "08:00"
  );
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(K.soundEnabled);
    return stored === null ? true : stored === "true";
  });

  /* --- notification feedback on finish --- */
  const notifyComplete = () => {
    if (soundEnabled) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 528;
        o.connect(g);
        g.connect(ctx.destination);
        const now = ctx.currentTime;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.16, now + 0.25);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        o.start(now);
        o.stop(now + 1.25);
      } catch {}
    }
    try {
      if ("vibrate" in navigator) navigator.vibrate([100, 30, 100]);
    } catch {}
  };

  /* --- timer loop --- */
  useEffect(() => {
    if (!running) return;
    tRef.current = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(tRef.current);
          setRunning(false);
          setTimeLeft(0);

          if (tab === 0) setDone0(true);
          if (tab === 1) setDone1(true);
          if (tab === 2) setDone2(true);
          if (tab === 3) setDone3(true);

          notifyComplete();

          const nextMap = {
            0: "Power Statements",
            1: "Rewrites",
            2: "Future-Casting",
            3: "Wrap-up",
          };
          const toTab = tab < 3 ? tab + 1 : DEV_DONE_TAB_INDEX;
          setNextPrompt({
            title: `Ready for your ${nextMap[tab]}?`,
            cta: "Let’s do it",
            toTab,
          });

          const t = setTimeout(() => {
            setTab(toTab);
            setTimeLeft(120);
            setNextPrompt(null);
          }, 10000);
          setAutoNextTimer(t);

          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tRef.current);
  }, [running, tab]);

  const resetTimer = (s = 120) => {
    setRunning(false);
    setTimeLeft(s);
  };

  /* --- persist --- */
  useEffect(() => {
    localStorage.setItem(K.statementsList, JSON.stringify(statements));
  }, [statements]);
  useEffect(() => {
    localStorage.setItem(K.selectedToday, JSON.stringify(selected));
  }, [selected]);
  useEffect(() => {
    localStorage.setItem(K.futureCast, futureCast || "");
  }, [futureCast]);
  useEffect(() => {
    localStorage.setItem(K.rewrites, JSON.stringify(rewrites));
  }, [rewrites]);
  useEffect(() => {
    localStorage.setItem(K.reminderTime, remTime);
  }, [remTime]);
  useEffect(() => {
    localStorage.setItem(K.soundEnabled, String(soundEnabled));
  }, [soundEnabled]);
  useEffect(() => {
    localStorage.setItem(K.streak, String(streak));
    if (lastDone) localStorage.setItem(K.lastDone, lastDone);
    if (skipWeek) localStorage.setItem(K.weeklySkipUsed, skipWeek);
  }, [streak, lastDone, skipWeek]);

  /* --- streak only als alle 4 timers gedaan zijn --- */
  useEffect(() => {
    if (done0 && done1 && done2 && done3) {
      const today = ymd();
      if (lastDone !== today) {
        const yest = ymd(new Date(Date.now() - 86400000));
        setStreak(lastDone === yest ? streak + 1 : 1);
        setLastDone(today);
      }
    }
  }, [done0, done1, done2, done3, lastDone, streak]);

  /* --- weekly skip handling --- */
  const canUseWeeklySkip = () => {
    const wk = getWeekKey();
    return skipWeek !== wk;
  };
  const useWeeklySkip = () => {
    if (!canUseWeeklySkip()) return;
    const today = ymd();
    if (lastDone !== today) {
      const yest = ymd(new Date(Date.now() - 86400000));
      setStreak(lastDone === yest ? streak + 1 : Math.max(1, streak));
      setLastDone(today);
    }
    setSkipWeek(getWeekKey());
  };

  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    [tab]
  );

  /* --- tab click --- */
  const goTab = (i) => {
    setTab(i);
    if (i <= 3) resetTimer(120);
  };

  /* --- statements selection --- */
  const toggleSelect = (line) =>
    setSelected((prev) =>
      prev.includes(line) ? prev.filter((l) => l !== line) : [...prev, line]
    );

  /* --- statements editor open/save --- */
  const openStatementsEditor = () => {
    setTempStatements(statements);
    setNewLine("");
    setEditStatements(true);
  };
  const persistStatements = () => {
    const cleaned = tempStatements
      .map((s) => (s || "").trim())
      .filter((s) => s.length > 0);
    setStatements(cleaned);
    setEditStatements(false);
  };
  const updateLine = (i, val) =>
    setTempStatements((list) => list.map((v, idx) => (idx === i ? val : v)));
  const removeLine = (i) =>
    setTempStatements((list) => list.filter((_, idx) => idx !== i));
  const addLine = () => {
    const s = newLine.trim();
    if (!s) return;
    setTempStatements((l) => [...l, s]);
    setNewLine("");
  };

  /* --- rewrites editor (max 15 stories, max 2 rewrites per story) --- */
  const openRewritesEditor = () => {
    setTempRewrites(rewrites);
    setEditRewrites(true);
  };

  const addRewriteRow = () => {
    setTempRewrites((list) =>
      list.length >= 15
        ? list
        : [
            ...list,
            {
              id: Date.now() + Math.random(),
              current: "",
              r1: "",
              r2: "",
            },
          ]
    );
  };

  const updateRewriteField = (id, field, value) => {
    setTempRewrites((list) =>
      list.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRewrite = (id) => {
    setTempRewrites((list) => list.filter((r) => r.id !== id));
  };

  const persistRewrites = () => {
    const cleaned = tempRewrites
      .map((r) => ({
        ...r,
        current: (r.current || "").trim(),
        r1: (r.r1 || "").trim(),
        r2: (r.r2 || "").trim(),
      }))
      .filter((r) => r.current || r.r1 || r.r2);
    setRewrites(cleaned);
    setEditRewrites(false);
  };

  /* --- future cast editor (template alleen eerste keer) --- */
  const openFC = () => {
    const existing = (futureCast || "").trim();
    setDraftFC(existing || FUTURECAST_TEMPLATE);
    setEditFC(true);
  };
  const saveFC = () => {
    setFutureCast(draftFC.trim());
    setEditFC(false);
  };

  /* --- reminder .ics --- */
  const downloadICS = () => {
    const [H, M] = remTime.split(":").map(Number);
    const d = new Date();
    d.setHours(H, M, 0, 0);
    const p = (n) => String(n).padStart(2, "0");
    const DTSTART = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(
      d.getDate()
    )}T${p(H)}${p(M)}00`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//2-2-2//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@222`,
      "SUMMARY:2-2-2 Morning Routine",
      "DESCRIPTION:Two minutes to align your day ✨",
      "RRULE:FREQ=DAILY",
      `DTSTART:${DTSTART}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "222-daily-reminder.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const proceedFromPrompt = () => {
    if (!nextPrompt) return;
    if (autoNextTimer) clearTimeout(autoNextTimer);
    setTab(nextPrompt.toTab);
    setTimeLeft(120);
    setNextPrompt(null);
  };

  /* ====================== UI ====================== */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${BRAND.bgFrom}, ${BRAND.bgTo})`,
      }}
    >
      <header
        style={{
          borderBottom: `1px solid ${BRAND.border}`,
          background: `linear-gradient(180deg,#FFF6F1,#FFECE5)`,
        }}
      >
        <div
          style={{
            maxWidth: 390,
            margin: "0 auto",
            padding: "16px 16px 8px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: BRAND.text,
              letterSpacing: ".2px",
            }}
          >
            Start Your Day
          </h1>
          <p style={{ marginTop: 4, color: BRAND.sub }}>
            with Energy & Intention
          </p>

          <div style={{ marginTop: 8, color: BRAND.coral, fontWeight: 700 }}>
            🔥 {streak} day streak{" "}
            {canUseWeeklySkip() && (
              <button
                onClick={useWeeklySkip}
                title="Use weekly skip"
                style={{
                  marginLeft: 8,
                  padding: "4px 10px",
                  borderRadius: 9999,
                  border: `1px solid ${BRAND.border}`,
                  background: "#fff",
                  color: BRAND.coral,
                }}
              >
                Skip this day
              </button>
            )}
          </div>

          {/* Tabs */}
          <nav
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 18,
              marginTop: 14,
              borderTop: `1px solid #F3E6DF`,
            }}
          >
            <Tab
              label="Breathing"
              icon={<Wind />}
              active={tab === 0}
              onClick={() => goTab(0)}
            />
            <Tab
              label="Power"
              icon={<Star />}
              active={tab === 1}
              onClick={() => goTab(1)}
            />
            <Tab
              label="Rewrites"
              icon={<Edit2 />}
              active={tab === 2}
              onClick={() => goTab(2)}
            />
            <Tab
              label="Future"
              icon={<Sparkles />}
              active={tab === 3}
              onClick={() => goTab(3)}
            />
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <main
        style={{
          maxWidth: 390,
          margin: "0 auto",
          padding: "12px 16px 48px",
          textAlign: "center",
        }}
      >
        {/* steps 0..3 share timer block */}
        {tab <= 3 && (
          <>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: BRAND.text,
                margin: "16px 0 6px",
              }}
            >
              {tab === 0 && "2 Minute Breathing"}
              {tab === 1 && "Power Statements"}
              {tab === 2 && "Rewrites"}
              {tab === 3 && "Future Casting"}
            </h3>
            <p style={{ color: BRAND.sub }}>
              {tab === 0 &&
                "Center yourself with mindful breathing. Inhale peace, exhale tension."}
              {tab === 1 && "Affirm your strength and potential."}
              {tab === 2 &&
                "Take old stories and lovingly rewrite them into something that serves you."}
              {tab === 3 && "Visualize and manifest your dreams."}
            </p>

            {/* Timer card */}
            <div
              style={{
                marginTop: 12,
                padding: 16,
                border: `1px solid ${BRAND.border}`,
                borderRadius: 16,
                background: `linear-gradient(180deg, ${BRAND.creamSoftTop}, ${BRAND.creamSoftBot})`,
                boxShadow: BRAND.shadowLg,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#fff",
                    padding: "12px 16px",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "800",
                      color: BRAND.text,
                      minWidth: "80px",
                    }}
                  >
                    {toMMSS(timeLeft)}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: "8px",
                      background: BRAND.ringBase,
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(timeLeft / 120) * 100}%`,
                        background: BRAND.ringFill,
                        transition: "width 1s linear",
                        boxShadow: running
                          ? "0 0 10px rgba(245,128,99,.35)"
                          : "none",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => setRunning((r) => !r)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 14px",
                      color: "#fff",
                      background: BRAND.coral,
                      boxShadow: BRAND.shadowMd,
                      fontWeight: 800,
                      flex: "1",
                      maxWidth: "120px",
                      gap: 6,
                    }}
                  >
                    {running ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {running ? "Pause" : "Start"}
                  </button>

                  <button
                    onClick={() => resetTimer(120)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid " + BRAND.border,
                      borderRadius: 10,
                      padding: "10px 14px",
                      background: "#fff",
                      color: BRAND.sub,
                      fontWeight: 600,
                      minWidth: "90px",
                      gap: 6,
                    }}
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>

                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid " + BRAND.border,
                      borderRadius: 10,
                      padding: "10px",
                      background: soundEnabled ? "#fff" : BRAND.pill,
                      color: soundEnabled ? BRAND.sub : BRAND.coral,
                      width: "42px",
                      height: "42px",
                    }}
                    title={soundEnabled ? "Mute sound" : "Unmute sound"}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* per-step extra UI */}
            {tab === 0 && (
              <>
                <ul
                  style={{
                    marginTop: 14,
                    paddingLeft: 0,
                    listStyle: "none",
                    color: BRAND.sub,
                  }}
                >
                  <Bullet>Find a comfortable position</Bullet>
                  <Bullet>Breathe in for 4 counts</Bullet>
                  <Bullet>Hold for 4 counts</Bullet>
                  <Bullet>Exhale for 6 counts</Bullet>
                </ul>

                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <LinkCard
                    title="Learn breathing"
                    href="https://www.youtube.com/results?search_query=2+minute+breathing"
                  />
                  <LinkCard
                    title="Morning yoga"
                    href="https://www.youtube.com/results?search_query=2+minute+yoga"
                  />
                  <LinkCard
                    title="Quick meditation"
                    href="https://www.youtube.com/results?search_query=2+minute+meditation"
                  />
                </div>
              </>
            )}

            {tab === 1 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 18,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 18,
                  background: "#FFF7E5",
                }}
              >
                <h4
                  style={{
                    textAlign: "left",
                    margin: "0 0 10px",
                    color: BRAND.text,
                  }}
                >
                  Your Power Statements
                </h4>
                {statements
                  .filter((line) => (line || "").trim().length > 0)
                  .map((line, i) => {
                    const active = selected.includes(line);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleSelect(line)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          background: "#fff",
                          border: `1px solid ${
                            active ? BRAND.coral : BRAND.border
                          }`,
                          color: active ? BRAND.coral : BRAND.text,
                          borderRadius: 12,
                          padding: "12px 14px",
                          margin: "8px 0",
                        }}
                      >
                        {line}
                      </button>
                    );
                  })}
                <button
                  onClick={openStatementsEditor}
                  style={{
                    marginTop: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: BRAND.coral,
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  <Plus className="w-4 h-4" /> Add / Edit Statements
                </button>
              </div>
            )}

            {tab === 2 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 18,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 18,
                  background: "#F6F0FF",
                }}
              >
                <h4
                  style={{
                    textAlign: "left",
                    margin: "0 0 10px",
                    color: BRAND.text,
                  }}
                >
                  Your Rewrites
                </h4>

                {rewrites.length ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      textAlign: "left",
                    }}
                  >
                    {rewrites.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: "#fff",
                          border: `1px solid ${BRAND.border}`,
                          borderRadius: 12,
                          padding: "10px 12px",
                        }}
                      >
                        {r.current && (
                          <div
                            style={{
                              fontSize: 13,
                              color: BRAND.sub,
                              marginBottom: 4,
                              fontWeight: 500,
                            }}
                          >
                            Current story:
                            <div style={{ color: BRAND.text }}>{r.current}</div>
                          </div>
                        )}
                        {r.r1 && (
                          <div
                            style={{
                              fontSize: 13,
                              marginTop: 4,
                              color: "#6F63F6",
                            }}
                          >
                            Rewrite 1:
                            <div style={{ color: "#3F35C0" }}>{r.r1}</div>
                          </div>
                        )}
                        {r.r2 && (
                          <div
                            style={{
                              fontSize: 13,
                              marginTop: 4,
                              color: "#6F63F6",
                            }}
                          >
                            Rewrite 2:
                            <div style={{ color: "#3F35C0" }}>{r.r2}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "left",
                      background: "#fff",
                      border: `1px solid ${BRAND.border}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      color: BRAND.sub,
                    }}
                  >
                    (Tap “Add / Edit Rewrites” to capture old stories and
                    rewrite them into something that serves you.)
                  </div>
                )}

                <button
                  onClick={openRewritesEditor}
                  style={{
                    marginTop: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: "#6F63F6",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  <Edit2 className="w-4 h-4" /> Add / Edit Rewrites
                </button>
              </div>
            )}

            {tab === 3 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 18,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 18,
                  background: "#F8F2FF",
                }}
              >
                <h4
                  style={{
                    textAlign: "left",
                    margin: "0 0 10px",
                    color: BRAND.text,
                  }}
                >
                  Your Future Vision
                </h4>
                {futureCast ? (
                  <div
                    style={{
                      textAlign: "left",
                      background: "#fff",
                      border: `1px solid ${BRAND.border}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      color: BRAND.text,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {futureCast}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "left",
                      background: "#fff",
                      border: `1px solid ${BRAND.border}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      color: BRAND.sub,
                    }}
                  >
                    (Tap “Edit Vision” to write your first Futurecast. Tip
                    prompts will appear.)
                  </div>
                )}
                <button
                  onClick={openFC}
                  style={{
                    marginTop: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: "#6F63F6",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  <Edit2 className="w-4 h-4" />{" "}
                  {futureCast ? "Edit Vision" : "Create Vision"}
                </button>
              </div>
            )}
          </>
        )}

        {/* FINAL screen */}
        {tab === DEV_DONE_TAB_INDEX && (
          <div
            style={{
              marginTop: 12,
              padding: 18,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 18,
              background: "#fff",
              boxShadow: BRAND.shadowLg,
            }}
          >
            <img
              src={import.meta.env.BASE_URL + "Alleah-500.png"}
              alt="Alleah"
              style={{
                width: 200,
                height: 200,
                objectFit: "cover",
                borderRadius: "36%",
                transform: "rotate(-6deg)",
                boxShadow: "0 8px 24px rgba(0,0,0,.08)",
              }}
            />
            <h2
              style={{
                marginTop: 10,
                fontSize: "1.4rem",
                fontWeight: 800,
                color: BRAND.text,
              }}
            >
              Great job! ✨
            </h2>
            <p style={{ color: BRAND.sub, marginBottom: 12 }}>
              You completed your 2-2-2 today. See you tomorrow.
            </p>

            <figure
              style={{
                margin: "0 auto 12px",
                maxWidth: 420,
                background: "#E9F7EF",
                color: "#1B5E20",
                borderRadius: 14,
                padding: "10px 12px",
              }}
            >
              <blockquote style={{ fontStyle: "italic" }}>
                “{quote.text}”
              </blockquote>
              <figcaption style={{ fontSize: 12 }}>
                — {quote.author}
              </figcaption>
            </figure>

            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setRemOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 16px",
                  border: "none",
                  borderRadius: 9999,
                  color: "#fff",
                  background: BRAND.coral,
                  fontWeight: 800,
                }}
              >
                <Calendar className="w-4 h-4" /> Remind me daily
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===== Modals ===== */}

      {/* Next step prompt */}
      {nextPrompt && (
        <Modal title={nextPrompt.title} onClose={() => setNextPrompt(null)}>
          <p style={{ color: BRAND.sub, marginTop: 4 }}>
            <Info style={{ display: "inline", width: 16, height: 16 }} /> Auto
            advances in ~10s if you do nothing.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12,
            }}
          >
            <button onClick={() => setNextPrompt(null)} className="btn">
              Later
            </button>
            <button
              onClick={proceedFromPrompt}
              style={{
                border: "none",
                borderRadius: 9999,
                padding: "10px 16px",
                background: BRAND.coral,
                color: "#fff",
                fontWeight: 800,
              }}
            >
              {nextPrompt.cta}
            </button>
          </div>
        </Modal>
      )}

      {/* Statements editor */}
      {editStatements && (
        <Modal
          title="Customize power statements"
          onClose={() => setEditStatements(false)}
        >
          <div className="editor-card">
            <div className="editor-scroll">
              {tempStatements.map((line, i) => (
                <div key={i} className="statement-row">
                  <textarea
                    value={line}
                    onChange={(e) => updateLine(i, e.target.value)}
                    placeholder="Type your statement…"
                  />
                  <button onClick={() => removeLine(i)} className="delete-btn">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setTempStatements([...tempStatements, ""])}
                className="add-btn"
              >
                + Add new statement
              </button>

              <div className="add-inline">
                <input
                  value={newLine}
                  onChange={(e) => setNewLine(e.target.value)}
                  placeholder="Quick add…"
                />
                <button onClick={addLine} className="primary">
                  Add
                </button>
              </div>
            </div>

            <div className="editor-footer">
              <button
                onClick={() => setEditStatements(false)}
                className="secondary"
              >
                Cancel
              </button>
              <button onClick={persistStatements} className="primary">
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rewrites editor */}
      {editRewrites && (
        <Modal
          title="Rewrite your stories"
          onClose={() => setEditRewrites(false)}
        >
          <div
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {tempRewrites.map((r) => (
              <div
                key={r.id}
                style={{
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                  background: "#FFF9FF",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <label style={{ fontSize: 12, color: BRAND.sub }}>
                  Current story
                </label>
                <textarea
                  value={r.current || ""}
                  onChange={(e) =>
                    updateRewriteField(r.id, "current", e.target.value)
                  }
                  style={{
                    width: "100%",
                    minHeight: 50,
                    padding: 8,
                    borderRadius: 8,
                    border: `1px solid ${BRAND.border}`,
                  }}
                />
                <label style={{ fontSize: 12, color: BRAND.sub }}>
                  Rewrite 1
                </label>
                <textarea
                  value={r.r1 || ""}
                  onChange={(e) =>
                    updateRewriteField(r.id, "r1", e.target.value)
                  }
                  style={{
                    width: "100%",
                    minHeight: 50,
                    padding: 8,
                    borderRadius: 8,
                    border: `1px solid ${BRAND.border}`,
                  }}
                />
                <label style={{ fontSize: 12, color: BRAND.sub }}>
                  Rewrite 2 (optional)
                </label>
                <textarea
                  value={r.r2 || ""}
                  onChange={(e) =>
                    updateRewriteField(r.id, "r2", e.target.value)
                  }
                  style={{
                    width: "100%",
                    minHeight: 50,
                    padding: 8,
                    borderRadius: 8,
                    border: `1px solid ${BRAND.border}`,
                  }}
                />
                <button
                  onClick={() => removeRewrite(r.id)}
                  style={{
                    alignSelf: "flex-end",
                    marginTop: 4,
                    border: "none",
                    background: "transparent",
                    color: "#CC0000",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            ))}

            <button
              onClick={addRewriteRow}
              disabled={tempRewrites.length >= 15}
              style={{
                border: "none",
                borderRadius: 9999,
                padding: "8px 12px",
                background:
                  tempRewrites.length >= 15 ? "#ddd" : BRAND.coral,
                color: "#fff",
                fontWeight: 600,
                alignSelf: "flex-start",
                opacity: tempRewrites.length >= 15 ? 0.7 : 1,
              }}
            >
              + Add story ({tempRewrites.length}/15)
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12,
            }}
          >
            <button
              onClick={() => setEditRewrites(false)}
              className="btn secondary"
            >
              Cancel
            </button>
            <button
              onClick={persistRewrites}
              className="btn primary"
              style={{
                borderRadius: 9999,
                padding: "8px 16px",
                border: "none",
                background: "#6F63F6",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* Futurecast editor */}
      {editFC && (
        <Modal
          title="Edit your future-cast"
          onClose={() => setEditFC(false)}
        >
          <textarea
            value={draftFC}
            onChange={(e) => setDraftFC(e.target.value)}
            style={{
              width: "100%",
              height: 280,
              padding: 12,
              border: `2px solid ${BRAND.border}`,
              borderRadius: 12,
              background: "#FFF9F5",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12,
            }}
          >
            <button onClick={() => setEditFC(false)} className="btn">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={saveFC}
              style={{
                border: "none",
                borderRadius: 9999,
                padding: "10px 16px",
                background: "#6F63F6",
                color: "#fff",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </Modal>
      )}

      {/* Reminder modal */}
      {remOpen && (
        <Modal title="Daily reminder" onClose={() => setRemOpen(false)}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <label style={{ fontWeight: 600 }}>Time</label>
            <input
              type="time"
              value={remTime}
              onChange={(e) => setRemTime(e.target.value)}
              style={{
                padding: "10px 12px",
                border: `1px solid ${BRAND.border}`,
                borderRadius: 12,
              }}
            />
          </div>
          <p style={{ color: BRAND.sub, marginTop: 8 }}>
            Download an <code>.ics</code> and add it to Apple Calendar for a
            reliable daily iOS notification.
          </p>
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 10 }}
          >
            <button
              onClick={downloadICS}
              style={{
                border: "none",
                borderRadius: 9999,
                padding: "10px 16px",
                background: BRAND.coral,
                color: "#fff",
                fontWeight: 800,
              }}
            >
              Download .ics
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============== Presentational bits ============== */
function Tab({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "8px 6px",
        color: active ? BRAND.coral : BRAND.sub,
        fontWeight: 600,
        background: active ? BRAND.pill : "transparent",
        border: "none",
        borderRadius: 12,
        transition: "background 0.2s",
        fontSize: 12,
      }}
    >
      <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Bullet({ children }) {
  return (
    <li
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        margin: "8px 0",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          background: BRAND.coral,
          borderRadius: "9999px",
          marginTop: 7,
        }}
      />
      <span>{children}</span>
    </li>
  );
}

function LinkCard({ title, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 14px",
        border: `1px solid ${BRAND.border}`,
        borderRadius: 14,
        background: "#FFF9F5",
        color: BRAND.text,
        textDecoration: "none",
      }}
    >
      <span>{title}</span>
      <ExternalLink className="w-4 h-4" style={{ color: BRAND.coral }} />
    </a>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 358,
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 18px 60px rgba(0,0,0,.2)",
          padding: 16,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: BRAND.text,
            }}
          >
            {title}
          </h3>
          <button onClick={onClose} className="btn">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play, Pause, RotateCcw, Edit2, Save, X, Plus, Trash2,
  Wind, Star, Sparkles, CheckCircle2, Calendar, ExternalLink, Info,
  Volume2, VolumeX
} from "lucide-react";
import InstallBanner from "./components/InstallBanner.jsx";

/* ========= Brand (sampled from site look) =========
   Subtle cream bg + coral accents + deep slate text
   If you want to tweak exact hex later, change here.
   ------------------------------------------------- */
const BRAND = {
  bgFrom: "#FFF6F1",
  bgTo:   "#FDEEE8",
  text:   "#1C2A33",
  sub:    "#6A7A86",
  coral:  "#F4846C",
  coral2: "#E97159",
  cream:  "#FFFFFF",
  creamSoftTop: "#FFF7F2",
  creamSoftBot: "#FFF2EB",
  border: "#F1E5DD",
  ringBase: "#F1E2D9",
  ringFill: "#F4846C",
  pill:   "#FFE7DE",
  shadowLg: "0 24px 50px rgba(245,128,99,.18)",
  shadowMd: "0 12px 24px rgba(245,128,99,.12)",
};

const STEPS = ["Breathing", "Power", "Future"]; // tabs 0..2
const DEV_DONE_TAB_INDEX = 3; // "4" tab shows final screen

/* ===== Helpers ===== */
const ymd = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const toMMSS = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
const getWeekKey = (d=new Date()) => `${d.getFullYear()}-W${Math.ceil(((d - new Date(d.getFullYear(),0,1)) / 86400000 + new Date(d.getFullYear(),0,1).getDay()+1)/7)}`;

/* ===== Storage keys ===== */
const K = {
  statementsList: "flow222_statements_list",
  selectedToday:  "flow222_selected_today",
  futureCast:     "flow222_future_cast",
  streak:         "flow222_streak",
  lastDone:       "flow222_last_done",
  reminderTime:   "flow222_rem_time",
  weeklySkipUsed: "flow222_skip_week", // stores week key when skip used
  soundEnabled:   "flow222_sound_enabled",
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

const QUOTES = [
  { text: "Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Your life does not get better by chance, it gets better by change.", author: "Jim Rohn" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
];

/* ================================================== */

export default function App() {
  /* --- step & timer --- */
  const [tab, setTab] = useState(0);          // 0..2, 3=final screen (dev tab "4")
  const [timeLeft, setTimeLeft] = useState(120);
  const [running, setRunning] = useState(false);
  const tRef = useRef(null);

  // completion flags ONLY set by finishing timers
  const [done0, setDone0] = useState(false);
  const [done1, setDone1] = useState(false);
  const [done2, setDone2] = useState(false);

  /* --- popup after each step --- */
  const [nextPrompt, setNextPrompt] = useState(null); // {title, cta, toTab}
  const [autoNextTimer, setAutoNextTimer] = useState(null);

  /* --- streak + weekly skip --- */
  const [streak, setStreak] = useState(() => Number(localStorage.getItem(K.streak)) || 0);
  const [lastDone, setLastDone] = useState(localStorage.getItem(K.lastDone) || "");
  const [skipWeek, setSkipWeek] = useState(localStorage.getItem(K.weeklySkipUsed) || "");

  /* --- statements --- */
  const [statements, setStatements] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(K.statementsList) || "[]"); return s.length?s:DEFAULT_STATEMENTS; }
    catch { return DEFAULT_STATEMENTS; }
  });
  const [selected, setSelected] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(K.selectedToday) || "[]"); return Array.isArray(s)?s:[]; }
    catch { return []; }
  });
  const [editStatements, setEditStatements] = useState(false);
  const [newLine, setNewLine] = useState("");

  /* --- future-cast --- */
  const [futureCast, setFutureCast] = useState(localStorage.getItem(K.futureCast) || "");
  const [editFC, setEditFC] = useState(false);
  const [draftFC, setDraftFC] = useState("");

  /* --- reminder --- */
  const [remOpen, setRemOpen] = useState(false);
  const [remTime, setRemTime] = useState(localStorage.getItem(K.reminderTime) || "08:00");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(K.soundEnabled);
    return stored === null ? true : stored === "true";
  });

  /* --- notification feedback on finish --- */
  const notifyComplete = () => {
    // Play sound if enabled
    if (soundEnabled) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = 528; o.connect(g); g.connect(ctx.destination);
        const now = ctx.currentTime;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.16, now+.25);
        g.gain.exponentialRampToValueAtTime(0.001, now+1.2);
        o.start(now); o.stop(now+1.25);
      } catch {}
    }
    
    // Gentle vibration (if supported)
    try {
      if ("vibrate" in navigator) {
        navigator.vibrate([100, 30, 100]); // gentle pulse pattern
      }
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
          // mark done
          if (tab === 0) setDone0(true);
          if (tab === 1) setDone1(true);
          if (tab === 2) setDone2(true);
          notifyComplete();

          // open next step prompt
          const nextMap = { 0: "Power Statements", 1: "Future-Casting", 2: "Wrap-up" };
          const toTab = tab < 2 ? tab + 1 : DEV_DONE_TAB_INDEX;
          setNextPrompt({
            title: `Ready for your ${nextMap[tab]}?`,
            cta: "Let’s do it",
            toTab
          });

          // auto-move after 10s if user does nothing
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

  const resetTimer = (s=120) => { setRunning(false); setTimeLeft(s); };

  /* --- persist --- */
  useEffect(() => { localStorage.setItem(K.statementsList, JSON.stringify(statements)); }, [statements]);
  useEffect(() => { localStorage.setItem(K.selectedToday, JSON.stringify(selected)); }, [selected]);
  useEffect(() => { localStorage.setItem(K.futureCast, futureCast || ""); }, [futureCast]);
  useEffect(() => { localStorage.setItem(K.reminderTime, remTime); }, [remTime]);
  useEffect(() => { localStorage.setItem(K.soundEnabled, String(soundEnabled)); }, [soundEnabled]);
  useEffect(() => {
    localStorage.setItem(K.streak, String(streak));
    if (lastDone) localStorage.setItem(K.lastDone, lastDone);
    if (skipWeek) localStorage.setItem(K.weeklySkipUsed, skipWeek);
  }, [streak, lastDone, skipWeek]);

  /* --- compute streak when all 3 timers done --- */
  useEffect(() => {
    if (done0 && done1 && done2) {
      const today = ymd();
      if (lastDone !== today) {
        const yest = ymd(new Date(Date.now()-86400000));
        setStreak(lastDone === yest ? streak + 1 : 1);
        setLastDone(today);
      }
    }
  }, [done0, done1, done2, lastDone, streak]);

  /* --- weekly skip handling --- */
  const canUseWeeklySkip = () => {
    const wk = getWeekKey();
    return skipWeek !== wk; // not used yet this week
  };
  const useWeeklySkip = () => {
    if (!canUseWeeklySkip()) return;
    const today = ymd();
    if (lastDone !== today) {
      const yest = ymd(new Date(Date.now()-86400000));
      setStreak(lastDone === yest ? streak + 1 : Math.max(1, streak)); // keep or set to 1
      setLastDone(today);
    }
    setSkipWeek(getWeekKey());
  };

  /* --- ring visuals --- */
  const R=94, CIRC=2*Math.PI*R, total=120;
  const dash = CIRC * (1 - (total-timeLeft)/total);
  const quote = useMemo(() => QUOTES[Math.floor(Math.random()*QUOTES.length)], [tab===DEV_DONE_TAB_INDEX]);

  /* --- tab click (dev) --- */
  const goTab = (i) => {
    setTab(i);
    if (i <= 2) resetTimer(120);
  };

  /* --- statements editing (does NOT affect auto-advance) --- */
  const toggleSelect = (line) =>
    setSelected((prev) => prev.includes(line) ? prev.filter(l=>l!==line) : [...prev, line]);
  const updateLine = (i,val) => setStatements(list => list.map((v,idx)=> idx===i?val:v));
  const removeLine = (i) => setStatements(list => list.filter((_,idx)=> idx!==i));
  const addLine = () => { const s=newLine.trim(); if(!s) return; setStatements(l=>[...l,s]); setNewLine(""); };

  /* --- future cast edit (does NOT affect auto-advance) --- */
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
    setEditFC(true);
  };
  const saveFC = () => { setFutureCast(draftFC); setEditFC(false); };

  /* --- reminder .ics --- */
  const downloadICS = () => {
    const [H,M] = remTime.split(":").map(Number);
    const d=new Date(); d.setHours(H,M,0,0);
    const p=(n)=>String(n).padStart(2,"0");
    const DTSTART = `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}T${p(H)}${p(M)}00`;
    const ics = [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//2-2-2//EN","BEGIN:VEVENT",
      `UID:${Date.now()}@222`,
      "SUMMARY:2-2-2 Morning Routine","DESCRIPTION:Two minutes to align your day ✨",
      "RRULE:FREQ=DAILY",`DTSTART:${DTSTART}`,"END:VEVENT","END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([ics], {type:"text/calendar;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="222-daily-reminder.ics"; a.click();
    URL.revokeObjectURL(url);
  };

  /* --- handle prompt CTA --- */
  const proceedFromPrompt = () => {
    if (!nextPrompt) return;
    if (autoNextTimer) clearTimeout(autoNextTimer);
    setTab(nextPrompt.toTab);
    setTimeLeft(120);
    setNextPrompt(null);
  };

  /* ====================== UI ====================== */
  return (
    <div style={{minHeight:"100vh", background:`linear-gradient(180deg, ${BRAND.bgFrom}, ${BRAND.bgTo})`}}>
      {/* HERO */}
      <header style={{borderBottom:`1px solid ${BRAND.border}`, background:`linear-gradient(180deg,#FFF6F1,#FFECE5)`}}>
        <div style={{maxWidth:390, margin:"0 auto", padding:"16px 16px 8px", textAlign:"center"}}>
          <h1 style={{fontSize:"1.6rem", fontWeight:800, color:BRAND.text, letterSpacing:".2px"}}>Start Your Day</h1>
          <p style={{marginTop:4, color:BRAND.sub}}>with Energy & Intention</p>

          <div style={{marginTop:8, color:BRAND.coral, fontWeight:700}}>
            🔥 {streak} day streak
            {" "}
            {canUseWeeklySkip() && (
              <button onClick={useWeeklySkip}
                title="Use weekly skip"
                style={{marginLeft:8, padding:"4px 10px", borderRadius:9999, border:`1px solid ${BRAND.border}`, background:"#fff", color:BRAND.coral}}>
                Skip this day
              </button>
            )}
          </div>

          {/* Tabs (clickable) */}
          <nav style={{display:"flex", justifyContent:"center", gap:24, marginTop:14, borderTop:`1px solid #F3E6DF`}}>
            <Tab label="Breathing" icon={<Wind/>} active={tab===0} onClick={()=>goTab(0)} />
            <Tab label="Power"     icon={<Star/>} active={tab===1} onClick={()=>goTab(1)} />
            <Tab label="Future"    icon={<Sparkles/>} active={tab===2} onClick={()=>goTab(2)} />
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <main style={{maxWidth:390, margin:"0 auto", padding:"12px 16px 48px", textAlign:"center"}}>
        {/* steps 0..2 share timer block */}
        {tab<=2 && (
          <>
            <h3 style={{fontSize:"1.25rem", fontWeight:800, color:BRAND.text, margin:"16px 0 6px"}}>
              {tab===0 ? "2 Minute Breathing" : tab===1 ? "Power Statements" : "Future Casting"}
            </h3>
            <p style={{color:BRAND.sub}}>
              {tab===0 && "Center yourself with mindful breathing. Inhale peace, exhale tension."}
              {tab===1 && "Affirm your strength and potential."}
              {tab===2 && "Visualize and manifest your dreams."}
            </p>

            {/* Timer card */}
            <div style={{
              marginTop:12, padding:16, border:`1px solid ${BRAND.border}`, borderRadius:16,
              background:`linear-gradient(180deg, ${BRAND.creamSoftTop}, ${BRAND.creamSoftBot})`,
              boxShadow: BRAND.shadowLg
            }}>
              <div style={{display:"flex", flexDirection:"column", gap:6}}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#fff",
                  padding: "12px 16px",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}>
                  <div style={{
                    fontSize: "28px",
                    fontWeight: "800",
                    color: BRAND.text,
                    minWidth: "80px"
                  }}>
                    {toMMSS(timeLeft)}
                  </div>
                  
                  <div style={{
                    flex: 1,
                    height: "8px",
                    background: BRAND.ringBase,
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(timeLeft/120) * 100}%`,
                      background: BRAND.ringFill,
                      transition: "width 1s linear",
                      boxShadow: running ? "0 0 10px rgba(245,128,99,.35)" : "none"
                    }} />
                  </div>
                </div>

                <div style={{display:"flex", gap:6, width:"100%", justifyContent:"center", alignItems:"center"}}>
                    <button onClick={()=>setRunning(r=>!r)}
                            style={{
                              display:"inline-flex", alignItems:"center", justifyContent:"center",
                              border:"none", borderRadius:10, padding:"10px 14px", color:"#fff",
                              background:BRAND.coral, boxShadow:BRAND.shadowMd, fontWeight:800,
                              flex: "1",
                              maxWidth: "120px"
                            }}>
                      {running ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4" />}
                      {running ? "Pause" : "Start"}
                    </button>

                    <button onClick={()=>resetTimer(120)}
                            style={{
                              display:"inline-flex", alignItems:"center", justifyContent:"center",
                              border:"1px solid " + BRAND.border,
                              borderRadius:10, padding:"10px 14px",
                              background:"#fff",
                              color:BRAND.sub,
                              fontWeight:600,
                              minWidth: "90px"
                            }}>
                      <RotateCcw className="w-4 h-4" /> Reset
                    </button>

                    <button onClick={() => setSoundEnabled(!soundEnabled)}
                            style={{
                              display:"inline-flex", alignItems:"center", justifyContent:"center",
                              border:"1px solid " + BRAND.border,
                              borderRadius:10, padding:"10px",
                              background: soundEnabled ? "#fff" : BRAND.pill,
                              color: soundEnabled ? BRAND.sub : BRAND.coral,
                              width: "42px", height: "42px"
                            }}
                            title={soundEnabled ? "Mute sound" : "Unmute sound"}>
                      {soundEnabled ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4"/>}
                    </button>
                </div>
              </div>
            </div>

            {/* per-step extra UI */}
            {tab===0 && (
              <>
                <ul style={{marginTop:14, paddingLeft:0, listStyle:"none", color:BRAND.sub}}>
                  <Bullet>Find a comfortable position</Bullet>
                  <Bullet>Breathe in for 4 counts</Bullet>
                  <Bullet>Hold for 4 counts</Bullet>
                  <Bullet>Exhale for 6 counts</Bullet>
                </ul>

                <div style={{display:"grid", gap:10, marginTop:10}}>
                  <LinkCard title="Learn breathing" href="https://www.youtube.com/results?search_query=2+minute+breathing" />
                  <LinkCard title="Morning yoga" href="https://www.youtube.com/results?search_query=2+minute+yoga" />
                  <LinkCard title="Quick meditation" href="https://www.youtube.com/results?search_query=2+minute+meditation" />
                </div>
              </>
            )}

            {tab===1 && (
              <div style={{marginTop:16, padding:18, border:`1px solid ${BRAND.border}`, borderRadius:18, background:"#FFF7E5"}}>
                <h4 style={{textAlign:"left", margin:"0 0 10px", color:BRAND.text}}>Your Power Statements</h4>
                {statements.map((line, i) => {
                  const active = selected.includes(line);
                  return (
                    <button key={i} onClick={()=>toggleSelect(line)}
                      style={{
                        display:"block", width:"100%", textAlign:"left",
                        background:"#fff", border:`1px solid ${active? BRAND.coral : BRAND.border}`,
                        color: active? BRAND.coral : BRAND.text,
                        borderRadius:12, padding:"12px 14px", margin:"8px 0"
                      }}>
                      {line}
                    </button>
                  );
                })}
                <button onClick={()=>setEditStatements(true)}
                        style={{marginTop:10, display:"inline-flex", alignItems:"center", gap:8,
                                border:"none", borderRadius:12, padding:"12px 14px", background:BRAND.coral, color:"#fff", fontWeight:700}}>
                  <Plus className="w-4 h-4" /> Add / Edit Statements
                </button>
              </div>
            )}

            {tab===2 && (
              <div style={{marginTop:16, padding:18, border:`1px solid ${BRAND.border}`, borderRadius:18, background:"#F8F2FF"}}>
                <h4 style={{textAlign:"left", margin:"0 0 10px", color:BRAND.text}}>Your Future Vision</h4>
                {futureCast ? (
                  <div style={{textAlign:"left", background:"#fff", border:`1px solid ${BRAND.border}`, borderRadius:12, padding:"12px 14px", color:BRAND.text, whiteSpace:"pre-wrap"}}>
                    {futureCast}
                  </div>
                ) : (
                  <div style={{textAlign:"left", background:"#fff", border:`1px solid ${BRAND.border}`, borderRadius:12, padding:"12px 14px", color:BRAND.sub}}>
                    (Tap “Edit Vision” to write your first Futurecast. Tip prompts will appear.)
                  </div>
                )}
                <button onClick={openFC}
                        style={{marginTop:10, display:"inline-flex", alignItems:"center", gap:8,
                                border:"none", borderRadius:12, padding:"12px 14px", background:"#6F63F6", color:"#fff", fontWeight:700}}>
                  <Edit2 className="w-4 h-4" /> {futureCast ? "Edit Vision" : "Create Vision"}
                </button>
              </div>
            )}
          </>
        )}

        {/* FINAL screen (tab 3 or auto after future) */}
        {tab===DEV_DONE_TAB_INDEX && (
          <div style={{marginTop:12, padding:18, border:`1px solid ${BRAND.border}`, borderRadius:18, background:"#fff", boxShadow:BRAND.shadowLg}}>
            <img src="/Alleah-500.png" alt="Alleah" style={{width:200, height:200, objectFit:"cover", borderRadius:"36%", transform:"rotate(-6deg)", boxShadow:"0 8px 24px rgba(0,0,0,.08)"}} />
            <h2 style={{marginTop:10, fontSize:"1.4rem", fontWeight:800, color:BRAND.text}}>Great job! ✨</h2>
            <p style={{color:BRAND.sub, marginBottom:12}}>You completed your 2-2-2 today. See you tomorrow.</p>

            <figure style={{margin:"0 auto 12px", maxWidth:420, background:"#E9F7EF", color:"#1B5E20", borderRadius:14, padding:"10px 12px"}}>
              <blockquote style={{fontStyle:"italic"}}>“{quote.text}”</blockquote>
              <figcaption style={{fontSize:12}}>— {quote.author}</figcaption>
            </figure>

            <div style={{marginTop:12}}>
              <button onClick={()=>setRemOpen(true)}
                      style={{display:"inline-flex", alignItems:"center", gap:8, padding:"12px 16px", border:"none", borderRadius:9999, color:"#fff", background:BRAND.coral, fontWeight:800}}>
                <Calendar className="w-4 h-4" /> Remind me daily
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===== Modals ===== */}

      {/* Next step prompt */}
      {nextPrompt && (
        <Modal title={nextPrompt.title} onClose={() => { setNextPrompt(null); }}>
          <p style={{color:BRAND.sub, marginTop:4}}><Info style={{display:"inline", width:16, height:16}}/> Auto-advances in ~10s if you do nothing.</p>
          <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:12}}>
            <button onClick={()=>setNextPrompt(null)} className="btn">Later</button>
            <button onClick={proceedFromPrompt}
              style={{border:"none", borderRadius:9999, padding:"10px 16px", background:BRAND.coral, color:"#fff", fontWeight:800}}>
              {nextPrompt.cta}
            </button>
          </div>
        </Modal>
      )}

      {/* Statements editor */}
      {editStatements && (
        <Modal title="Customize power statements" onClose={()=>setEditStatements(false)}>
          <div className="space-y-3">
            {statements.map((line,i)=>(
              <div key={i} style={{display:"flex", gap:8, margin:"8px 0"}}>
                <input value={line} onChange={e=>updateLine(i,e.target.value)}
                       style={{flex:1, padding:"10px 12px", border:`1px solid ${BRAND.border}`, borderRadius:12}} />
                <button onClick={()=>removeLine(i)} className="btn"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
            <div style={{display:"flex", gap:8, marginTop:8}}>
              <input value={newLine} onChange={e=>setNewLine(e.target.value)} placeholder="Add new statement…"
                     style={{flex:1, padding:"10px 12px", border:`1px solid ${BRAND.border}`, borderRadius:12}} />
              <button onClick={addLine} style={{border:"none", borderRadius:12, padding:"10px 12px", background:BRAND.coral, color:"#fff", fontWeight:700}}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div style={{display:"flex", justifyContent:"flex-end", marginTop:10}}>
              <button onClick={()=>setEditStatements(false)} className="btn">Done</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Futurecast editor */}
      {editFC && (
        <Modal title="Edit your future-cast" onClose={()=>setEditFC(false)}>
          <textarea value={draftFC} onChange={(e)=>setDraftFC(e.target.value)}
                    style={{width:"100%", height:280, padding:12, border:`2px solid ${BRAND.border}`, borderRadius:12, background:"#FFF9F5"}} />
          <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:12}}>
            <button onClick={()=>setEditFC(false)} className="btn"><X className="w-4 h-4" /> Cancel</button>
            <button onClick={saveFC}
                    style={{border:"none", borderRadius:9999, padding:"10px 16px", background:"#6F63F6", color:"#fff", fontWeight:800}}>
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
          <div style={{marginTop:10, color:BRAND.sub, fontSize:14}}>
            <strong>Tips:</strong> write in present tense, feel it in your body, include money & relationships, and finish with “I did it! I did it! I did it!”.
          </div>
        </Modal>
      )}

      {/* Reminder modal */}
      {remOpen && (
        <Modal title="Daily reminder" onClose={()=>setRemOpen(false)}>
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10}}>
            <label style={{fontWeight:600}}>Time</label>
            <input type="time" value={remTime} onChange={(e)=>setRemTime(e.target.value)}
                   style={{padding:"10px 12px", border:`1px solid ${BRAND.border}`, borderRadius:12}} />
          </div>
          <p style={{color:BRAND.sub, marginTop:8}}>Download an <code>.ics</code> and add it to Apple Calendar for a reliable daily iOS notification.</p>
          <div style={{display:"flex", justifyContent:"center", marginTop:10}}>
            <button onClick={downloadICS}
              style={{border:"none", borderRadius:9999, padding:"10px 16px", background:BRAND.coral, color:"#fff", fontWeight:800}}>
              Download .ics
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============== Small presentational bits ============== */
function Tab({label, icon, active, onClick}) {
  return (
    <button onClick={onClick}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"10px 6px",
        color: active ? BRAND.coral : BRAND.sub, fontWeight:600, background: active ? BRAND.pill : "transparent",
        border:"none", borderRadius: 12, transition: "background 0.2s"
      }}>
      <span style={{opacity: active?1:.7}}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
function Bullet({children}) {
  return (
    <li style={{display:"flex", gap:10, alignItems:"flex-start", margin:"8px 0"}}>
      <span style={{width:8,height:8,background:BRAND.coral,borderRadius:"9999px",marginTop:7}} />
      <span>{children}</span>
    </li>
  );
}
function LinkCard({title, href}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
       style={{display:"flex", justifyContent:"space-between", alignItems:"center",
               padding:"12px 14px", border:`1px solid ${BRAND.border}`, borderRadius:14,
               background:"#FFF9F5", color:BRAND.text, textDecoration:"none"}}>
      <span>{title}</span>
      <ExternalLink className="w-4 h-4" style={{color:BRAND.coral}} />
    </a>
  );
}
function Modal({title, children, onClose}) {
  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", padding:12, zIndex:50}}>
      <div style={{width:"100%", maxWidth:358, background:"#fff", borderRadius:20, boxShadow:"0 18px 60px rgba(0,0,0,.2)", padding:16}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
          <h3 style={{fontSize:"1.1rem", fontWeight:800, color:BRAND.text}}>{title}</h3>
          <button onClick={onClose} className="btn"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";

// Music served from /public/music.mp3 — no base64, clean build
const MUSIC_SRC = "/music.mp3";

const STATIONS = [
  {
    id: 1, icon: "🌶️", name: "The Spice Bazaar", loc: "Hotel Lobby",
    npc: "Merchant Yusuf", role: "The Cryptic Spice Trader",
    puzzle: "Merchant Yusuf speaks only in trade codes:\n\nPEPPER = 16\nSILK = 9\nGOLD = ?\n\nDecipher the pattern to claim your first fragment.",
    answer: "9", letter: "G",
    win: '"Sharp as Damascus steel!" Yusuf exclaims, pressing a weathered parchment into your palm. The letter on it reads...',
  },
  {
    id: 2, icon: "🐪", name: "Silk Road Checkpoint", loc: "Main Corridor",
    npc: "Caravaneer Farouk", role: "The Desert Route Master",
    puzzle: "Three caravans approach Constantinople.\nOnly one carries exactly 100 gold dinars.\n\nCaravan A:  45 + 35 + 25\nCaravan B:  30 + 55 + 25\nCaravan C:  35 + 40 + 25\n\nWhich caravan? Answer A, B, or C.",
    answer: "C", letter: "O",
    win: 'Farouk nods beneath his keffiyeh. "Only the worthy find the right route." He slides you a worn fragment marked...',
  },
  {
    id: 3, icon: "⚖️", name: "The Royal Mint", loc: "Restaurant Entrance",
    npc: "Treasurer Ibrahim", role: "Keeper of the Sultan's Gold",
    puzzle: "The Sultan's treasury holds 800 gold dinars.\n\nHe keeps half for the royal reserves.\n\nThe remainder is divided equally\namong his 4 loyal generals.\n\nHow many dinars does each general receive?",
    answer: "100", letter: "L",
    win: 'Ibrahim stamps your document with the royal seal. "Worthy of the treasury." He reveals a golden fragment bearing...',
  },
  {
    id: 4, icon: "🏛️", name: "Grand Vizier's Chamber", loc: "Conference Room",
    npc: "Grand Vizier Selim", role: "Keeper of Ancient Riddles",
    puzzle: '"I am always before you,\nyet can never be seen.\n\nKings build empires for me.\nNone can truly possess me.\n\nWhat am I?"',
    answer: "FUTURE", letter: "D",
    win: '"The wisest answer in the realm," Selim murmurs, slowly unfolding the final parchment fragment...',
  },
];

const VAULT_WORD = "GOLD";
const HOST_EMAIL = "shenoymathews@gmail.com";
const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const C = {
  bg: "#0a0600", panel: "#1a0d04", mid: "#221208",
  border: "#6b4a1e", bGold: "#c9a84c",
  gold: "#d4a017", goldHi: "#f0c040",
  red: "#cc0000", redHi: "#ff4444",
  cream: "#f5e6c8", dim: "#9a7850",
  green: "#2d6a24", greenBg: "#080f06",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input, button { font-family: inherit; }
  button { cursor: pointer; }
  button:not(:disabled):hover { opacity: 0.86; }
  button:not(:disabled):active { transform: scale(0.97); }
  input:focus { outline: none; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
  @keyframes glow   { 0%,100% { box-shadow:0 0 10px #d4a01740; } 50% { box-shadow:0 0 26px #d4a01790; } }
`;

// ── Shared primitives ─────────────────────────────────────────────────────────

function Page({ children, bar }) {
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 50% 0%, #1e0d02, ${C.bg} 65%)`, fontFamily: "'Crimson Text', Georgia, serif", color: C.cream }}>
      <style>{CSS}</style>
      {bar}
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "14px 14px 56px" }}>
        {children}
      </div>
    </div>
  );
}

function Bar({ elapsed, penalty, muted, setMuted }) {
  const hot = elapsed > 480;
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 99, background: "#050200f2", borderBottom: `1px solid ${hot ? C.red : C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px" }}>
      <span style={{ fontFamily: "'Cinzel',serif", color: hot ? C.redHi : C.gold, fontSize: 14, letterSpacing: 1 }}>
        ⏱ {fmt(elapsed)}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {penalty > 0 && <span style={{ color: C.red, fontSize: 12, fontStyle: "italic" }}>+{fmt(penalty)} penalty</span>}
        <button onClick={() => setMuted(!muted)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 8px", color: muted ? C.dim : C.gold, fontSize: 14 }}>
          {muted ? "🔇" : "🎵"}
        </button>
      </div>
    </div>
  );
}

function Box({ children, gold, green, dash, sx }) {
  return (
    <div style={{ background: green ? C.greenBg : C.panel, border: `1px ${dash ? "dashed" : "solid"} ${gold ? C.bGold : green ? C.green : C.border}`, borderRadius: 8, padding: 18, marginBottom: 12, animation: "fadeUp .3s ease", ...sx }}>
      {children}
    </div>
  );
}

const Lbl = ({ c }) => (
  <div style={{ fontFamily: "'Cinzel',serif", color: C.dim, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>{c}</div>
);

const Sep = () => (
  <div style={{ textAlign: "center", color: C.bGold, fontSize: 15, margin: "14px 0" }}>✦ ─── ✦ ─── ✦</div>
);

function GBtn({ label, onClick, off }) {
  return (
    <button onClick={onClick} disabled={off} style={{ width: "100%", padding: "13px 16px", background: off ? "#221208" : `linear-gradient(135deg,#6a4c10,${C.gold},#6a4c10)`, color: off ? C.border : "#080400", border: `1px solid ${off ? C.border : C.goldHi}`, borderRadius: 6, fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 13, letterSpacing: 1.5 }}>
      {label}
    </button>
  );
}

function RBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "13px 16px", background: `linear-gradient(135deg,#7a0000,${C.red},#7a0000)`, color: C.cream, border: `1px solid ${C.redHi}`, borderRadius: 6, fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 13, letterSpacing: 1.5 }}>
      {label}
    </button>
  );
}

function Tile({ letter, unlocked, big }) {
  const sz = big ? 56 : 46, fs = big ? 26 : 20;
  return (
    <div style={{ width: sz, height: sz, border: `2px solid ${unlocked ? C.bGold : C.border}`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: fs, color: unlocked ? C.goldHi : C.border, background: unlocked ? "#261600" : "transparent", animation: unlocked ? "glow 2.5s infinite" : "none", transition: "all .4s ease" }}>
      {letter}
    </div>
  );
}

// ── Screens ───────────────────────────────────────────────────────────────────

function Intro({ name, setName, onStart }) {
  return (
    <Page>
      <div style={{ textAlign: "center", paddingTop: 32 }}>
        <div style={{ fontSize: 56 }}>🏰</div>
        <div style={{ fontFamily: "'Cinzel',serif", color: C.red, fontSize: 10, letterSpacing: 4, marginTop: 14 }}>WEAR 2026 · TEAM RED BULLS</div>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 30, fontWeight: 900, color: C.cream, margin: "8px 0 4px", lineHeight: 1.25 }}>
          The Red Bull<br />of Constantinople
        </h1>
        <div style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 11, letterSpacing: 2.5 }}>
          SULTAN'S TREASURE HUNT
        </div>
        <Sep />
        <Box>
          <p style={{ fontStyle: "italic", lineHeight: 1.8, fontSize: 15, color: C.cream, marginBottom: 12 }}>
            "The Sultan's legendary treasure has vanished from the royal vault. Intelligence suggests it was hidden across four ancient trade hubs. You have been summoned to recover it."
          </p>
          <div style={{ color: C.dim, fontSize: 13 }}>Visit 4 stations · Collect 4 fragments · Unlock the vault</div>
        </Box>
        <Box>
          <Lbl c="Enter Your Team Name" />
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onStart()}
            placeholder="e.g. Team Red Bulls"
            style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px", color: C.cream, fontSize: 16, marginBottom: 12 }}
          />
          <GBtn label="BEGIN THE HUNT ⚔️" onClick={onStart} off={!name.trim()} />
        </Box>
        <div style={{ color: C.dim, fontSize: 12, fontStyle: "italic" }}>🎵 Hüseynî Peşrev · Alla Turca Kollektif plays as you hunt</div>
      </div>
    </Page>
  );
}

function MapView({ name, done, elapsed, penalty, muted, setMuted, onStation, onVault }) {
  const all = done.length === STATIONS.length;
  return (
    <Page bar={<Bar elapsed={elapsed} penalty={penalty} muted={muted} setMuted={setMuted} />}>
      <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
        <div style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 10, letterSpacing: 3 }}>{name.toUpperCase()}</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 20, color: C.cream, marginTop: 4 }}>Trade Hub Map</h2>
      </div>
      <Sep />
      <Box sx={{ textAlign: "center" }}>
        <Lbl c="Fragments Collected" />
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          {STATIONS.map((s) => <Tile key={s.id} letter={done.includes(s.id) ? s.letter : "?"} unlocked={done.includes(s.id)} />)}
        </div>
        {done.length > 0 && !all && <div style={{ fontSize: 12, color: C.dim, marginTop: 10, fontStyle: "italic" }}>Arrange all 4 letters to unlock the vault</div>}
      </Box>
      {STATIONS.map((s) => {
        const ok = done.includes(s.id);
        return (
          <div key={s.id} onClick={() => !ok && onStation(s)} style={{ background: ok ? C.greenBg : C.mid, border: `1px solid ${ok ? C.green : C.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, cursor: ok ? "default" : "pointer", opacity: ok ? 0.72 : 1 }}>
            <span style={{ fontSize: 24 }}>{ok ? "✅" : s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 600, color: ok ? "#5aaa48" : C.cream }}>{s.name}</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>📍 {s.loc}</div>
            </div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: ok ? "#5aaa48" : C.gold }}>{ok ? "DONE" : "GO →"}</div>
          </div>
        );
      })}
      {all && (
        <Box gold sx={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Cinzel',serif", color: C.goldHi, fontSize: 15, marginBottom: 8 }}>All fragments collected!</div>
          <p style={{ fontStyle: "italic", fontSize: 14, color: C.cream, marginBottom: 14 }}>"Proceed to the Sultan's Vault and claim the treasure."</p>
          <GBtn label="⚔️ ENTER THE VAULT" onClick={onVault} />
        </Box>
      )}
      <div style={{ textAlign: "center", color: C.dim, fontSize: 12, fontStyle: "italic", marginTop: 4 }}>
        {all ? "All stations complete — the vault awaits" : `${STATIONS.length - done.length} station${STATIONS.length - done.length !== 1 ? "s" : ""} remaining`}
      </div>
    </Page>
  );
}

function StationView({ station, elapsed, penalty, muted, setMuted, onBack, onDone, onPenalty }) {
  const [ans, setAns] = useState("");
  const [fb, setFb] = useState(null);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [penDone, setPenDone] = useState(false);

  const submit = () => {
    if (ans.trim().toUpperCase() === station.answer.toUpperCase()) {
      setFb("right");
      setTimeout(() => onDone(station), 3000);
    } else {
      setFb("wrong");
      setTimeout(() => setFb(null), 1400);
    }
  };

  const askHint = async () => {
    if (loading || hint) return;
    setLoading(true);
    if (!penDone) { setPenDone(true); onPenalty(30); }
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 100,
          messages: [{ role: "user", content: `You are ${station.npc}, ${station.role}, in an Ottoman treasure hunt. A player needs a hint for: "${station.puzzle}". Give ONE cryptic in-character hint in 2 sentences. Do NOT reveal the answer. Start: "${station.npc} whispers:"` }]
        })
      });
      const d = await r.json();
      setHint(d.content?.[0]?.text || `${station.npc} whispers: "The answer hides in plain sight. Look again, merchant..."`);
    } catch {
      setHint(`${station.npc} whispers: "Patience, merchant. The pattern reveals itself to those who look carefully..."`);
    }
    setLoading(false);
  };

  return (
    <Page bar={<Bar elapsed={elapsed} penalty={penalty} muted={muted} setMuted={setMuted} />}>
      <div style={{ display: "flex", alignItems: "center", paddingTop: 12, marginBottom: 10 }}>
        <button onClick={onBack} disabled={fb === "right"} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.dim, borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>← Map</button>
        <div style={{ marginLeft: 12, fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 10, letterSpacing: 2 }}>{station.icon} {station.name.toUpperCase()}</div>
      </div>
      <Box gold sx={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🧔‍♂️</div>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 17, color: C.goldHi }}>{station.npc}</div>
        <div style={{ fontSize: 12, color: C.dim, fontStyle: "italic", marginTop: 3 }}>{station.role}</div>
        <div style={{ fontSize: 11, color: C.border, marginTop: 4 }}>📍 {station.loc}</div>
      </Box>
      <Box>
        <Lbl c="The Challenge" />
        <p style={{ whiteSpace: "pre-line", lineHeight: 1.9, fontSize: 15, fontStyle: "italic", color: C.cream }}>{station.puzzle}</p>
      </Box>
      {fb !== "right" ? (
        <Box>
          <Lbl c="Your Answer" />
          <input
            value={ans} onChange={(e) => setAns(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Type your answer..."
            style={{ width: "100%", background: C.bg, border: `1px solid ${fb === "wrong" ? C.red : C.border}`, borderRadius: 6, padding: "13px 14px", marginBottom: 8, color: C.cream, fontSize: 20, textAlign: "center", letterSpacing: 3, fontFamily: "'Cinzel',serif" }}
          />
          {fb === "wrong" && <div style={{ color: C.red, fontSize: 13, textAlign: "center", marginBottom: 8, fontStyle: "italic" }}>✗ Not quite, merchant. Try again.</div>}
          <GBtn label="SUBMIT ANSWER" onClick={submit} />
        </Box>
      ) : (
        <Box green>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
            <div style={{ fontFamily: "'Cinzel',serif", color: C.goldHi, fontSize: 15, marginBottom: 10 }}>Fragment Revealed!</div>
            <p style={{ fontStyle: "italic", fontSize: 14, color: C.cream, lineHeight: 1.75, marginBottom: 16 }}>{station.win}</p>
            <div style={{ width: 72, height: 72, margin: "0 auto", border: `2px solid ${C.bGold}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel',serif", fontSize: 44, fontWeight: 900, color: C.goldHi, background: "#200e00", animation: "glow 1.5s infinite" }}>{station.letter}</div>
            <div style={{ color: C.dim, fontSize: 12, marginTop: 14, fontStyle: "italic" }}>Returning to the trade map...</div>
          </div>
        </Box>
      )}
      {fb !== "right" && (
        <div style={{ marginTop: 4 }}>
          {!hint ? (
            <button onClick={askHint} disabled={loading} style={{ width: "100%", padding: "11px 16px", background: "transparent", color: loading ? C.border : C.dim, border: `1px dashed ${loading ? "#2a1408" : C.border}`, borderRadius: 6, fontSize: 13, fontStyle: "italic", cursor: "pointer" }}>
              {loading ? "⏳ Consulting the oracle..." : `🔮 Ask ${station.npc} for a hint  (+30 sec penalty)`}
            </button>
          ) : (
            <Box dash>
              <Lbl c="🔮 Oracle Speaks" />
              <p style={{ fontStyle: "italic", fontSize: 14, lineHeight: 1.75, color: C.cream }}>{hint}</p>
            </Box>
          )}
        </div>
      )}
    </Page>
  );
}

function VaultView({ done, elapsed, penalty, muted, setMuted, onWin }) {
  const letters = done.map((id) => STATIONS.find((s) => s.id === id)?.letter).filter(Boolean);
  const [word, setWord] = useState("");
  const [fb, setFb] = useState(null);

  const submit = () => {
    if (word.trim().toUpperCase() === VAULT_WORD) { setFb("right"); setTimeout(onWin, 2500); }
    else { setFb("wrong"); setTimeout(() => setFb(null), 1500); }
  };

  return (
    <Page bar={<Bar elapsed={elapsed} penalty={penalty} muted={muted} setMuted={setMuted} />}>
      <div style={{ textAlign: "center", paddingTop: 24 }}>
        <div style={{ fontSize: 56, animation: "pulse 2s infinite" }}>🏛️</div>
        <div style={{ fontFamily: "'Cinzel',serif", color: C.dim, fontSize: 10, letterSpacing: 4, marginTop: 12 }}>THE SULTAN'S</div>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, fontWeight: 900, color: C.cream, margin: "4px 0" }}>ROYAL VAULT</h1>
      </div>
      <Sep />
      <Box gold sx={{ textAlign: "center" }}>
        <p style={{ fontStyle: "italic", lineHeight: 1.8, fontSize: 15, color: C.cream, marginBottom: 18 }}>
          "You have traversed the great trade hubs and gathered four ancient parchment fragments. Arrange the letters to reveal the sacred word — and claim the Sultan's treasure."
        </p>
        <Lbl c="Your Collected Fragments" />
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          {letters.map((l, i) => <Tile key={i} letter={l} unlocked big />)}
        </div>
      </Box>
      {fb !== "right" ? (
        <Box>
          <Lbl c="Speak the Sacred Word" />
          <input
            value={word} onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Arrange the letters..."
            style={{ width: "100%", background: C.bg, border: `2px solid ${fb === "wrong" ? C.red : C.bGold}`, borderRadius: 6, padding: "15px 14px", marginBottom: 8, color: C.goldHi, fontSize: 28, textAlign: "center", letterSpacing: 8, fontFamily: "'Cinzel',serif", fontWeight: 700 }}
          />
          {fb === "wrong" && <div style={{ color: C.red, textAlign: "center", fontSize: 13, marginBottom: 8, fontStyle: "italic" }}>✗ The vault remains sealed. Reconsider the arrangement.</div>}
          <RBtn label="⚔️ UNLOCK THE VAULT" onClick={submit} />
        </Box>
      ) : (
        <Box gold sx={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, animation: "pulse 1s infinite" }}>🔓</div>
          <div style={{ fontFamily: "'Cinzel',serif", color: C.goldHi, fontSize: 20, marginTop: 10 }}>THE VAULT OPENS...</div>
          <div style={{ color: C.cream, fontStyle: "italic", fontSize: 14, marginTop: 8 }}>The Sultan's treasure is revealed...</div>
        </Box>
      )}
    </Page>
  );
}

function WinView({ name, total, penalty, done }) {
  const pts = done.length * 10 + 100 - Math.floor(penalty / 6);
  const achs = [
    { icon: "📜", label: "Cipher Sage", ok: true },
    { icon: "🐪", label: "Desert Pathfinder", ok: true },
    { icon: "⭐", label: "Sultan's Favorite", ok: total < 360 },
    { icon: "💰", label: "Master Merchant", ok: penalty === 0 },
    { icon: "🏆", label: "Legendary Treasure Hunter", ok: true },
  ];
  const earnedList = achs.filter((a) => a.ok).map((a) => a.label).join(", ");
  const body =
    `SULTAN'S TREASURE HUNT — WEAR 2026 SCORE REPORT\n\n` +
    `Team:               ${name}\n` +
    `Final Time:         ${fmt(total)}\n` +
    `Hint Penalties:     ${fmt(penalty)}\n` +
    `Points Scored:      ${pts}\n` +
    `Stations Completed: ${done.length} / 4\n\n` +
    `Achievements:\n${earnedList}\n\n` +
    `— Team Red Bulls · The Great Silk Road · WEAR 2026 —`;
  const mailto = `mailto:${HOST_EMAIL}?subject=${encodeURIComponent("WEAR 2026 Score — " + name + " — " + fmt(total))}&body=${encodeURIComponent(body)}`;

  return (
    <Page>
      <div style={{ textAlign: "center", paddingTop: 36 }}>
        <div style={{ fontSize: 72, animation: "pulse 1.5s infinite" }}>🏆</div>
        <div style={{ fontFamily: "'Cinzel',serif", color: C.red, fontSize: 10, letterSpacing: 4, marginTop: 14 }}>THE SULTAN'S TREASURE IS YOURS</div>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 34, fontWeight: 900, color: C.goldHi, margin: "6px 0 2px" }}>VICTORY!</h1>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 17, color: C.cream }}>{name}</div>
      </div>
      <Sep />
      <Box gold sx={{ textAlign: "center" }}>
        <Lbl c="Final Time" />
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 50, fontWeight: 900, color: C.goldHi, letterSpacing: 2 }}>{fmt(total)}</div>
        <div style={{ color: C.dim, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
          {Math.floor(total / 60) < 6 ? "Extraordinary speed — the Sultan is honoured" : "A worthy hunt well completed"}
        </div>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Lbl c="Points Scored" />
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 48, fontWeight: 900, color: C.goldHi }}>{pts}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, fontSize: 12, color: C.dim, flexWrap: "wrap" }}>
          <span>🏛️ {done.length}×10 stations</span>
          <span>🏆 +100 vault bonus</span>
          {penalty > 0 && <span style={{ color: C.red }}>🔮 −{Math.floor(penalty / 6)} hint pts</span>}
        </div>
      </Box>
      <Box>
        <Lbl c="Achievements Unlocked" />
        {achs.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < achs.length - 1 ? `1px solid ${C.border}` : "none", opacity: a.ok ? 1 : 0.28 }}>
            <span style={{ fontSize: 20 }}>{a.icon}</span>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: a.ok ? C.gold : C.dim }}>{a.label}</span>
            {a.ok && <span style={{ marginLeft: "auto", color: "#5aaa48", fontSize: 16 }}>✓</span>}
          </div>
        ))}
      </Box>
      <Box gold sx={{ textAlign: "center" }}>
        <Lbl c="Send Score to Host" />
        <p style={{ fontSize: 13, color: C.dim, fontStyle: "italic", marginBottom: 14 }}>
          Tap below — score pre-filled and ready to send to {HOST_EMAIL}
        </p>
        <a href={mailto} style={{ textDecoration: "none", display: "block" }}>
          <div style={{ background: `linear-gradient(135deg,#6a4c10,${C.gold},#6a4c10)`, color: "#080400", border: `1px solid ${C.goldHi}`, borderRadius: 6, padding: "13px 16px", fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 13, letterSpacing: 1.5, textAlign: "center" }}>
            📧 EMAIL SCORE TO HOST
          </div>
        </a>
        <div style={{ fontSize: 11, color: C.border, marginTop: 8 }}>Opens mail app · Pre-filled · One tap to send</div>
      </Box>
      <Box sx={{ textAlign: "center", borderColor: C.red }}>
        <div style={{ fontFamily: "'Cinzel',serif", color: C.red, fontSize: 12, letterSpacing: 2 }}>🔴 TEAM RED BULLS</div>
        <div style={{ color: C.dim, fontStyle: "italic", fontSize: 13, marginTop: 5 }}>The Red Bull of Constantinople · WEAR 2026</div>
        <div style={{ color: C.border, fontSize: 11, marginTop: 3 }}>The Great Silk Road — Trading Hubs</div>
      </Box>
    </Page>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]   = useState("intro");
  const [name, setName]       = useState("");
  const [done, setDone]       = useState([]);
  const [cur, setCur]         = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [ticking, setTicking] = useState(false);
  const [muted, setMuted]     = useState(false);
  const audioRef              = useRef(null);

  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!muted && ticking) a.play().catch(() => {});
    else a.pause();
  }, [muted, ticking]);

  const start = () => {
    if (!name.trim()) return;
    setTicking(true);
    setScreen("map");
    if (audioRef.current) {
      audioRef.current.volume = 0.35;
      audioRef.current.play().catch(() => {});
    }
  };

  const openStation = (s) => { setCur(s); setScreen("station"); };

  const completeStation = (s) => {
    const nd = [...done, s.id];
    setDone(nd);
    if (nd.length === STATIONS.length) setScreen("vault");
    else setScreen("map");
  };

  const win = () => { setTicking(false); setScreen("win"); };
  const mp = { muted, setMuted };

  return (
    <>
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="auto" />
      {screen === "intro"   && <Intro   name={name} setName={setName} onStart={start} />}
      {screen === "map"     && <MapView name={name} done={done} elapsed={elapsed} penalty={penalty} {...mp} onStation={openStation} onVault={() => setScreen("vault")} />}
      {screen === "station" && <StationView station={cur} elapsed={elapsed} penalty={penalty} {...mp} onBack={() => setScreen("map")} onDone={completeStation} onPenalty={(sec) => setPenalty((p) => p + sec)} />}
      {screen === "vault"   && <VaultView done={done} elapsed={elapsed} penalty={penalty} {...mp} onWin={win} />}
      {screen === "win"     && <WinView  name={name} total={elapsed + penalty} penalty={penalty} done={done} />}
    </>
  );
}

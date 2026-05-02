const { useState, useRef, useCallback, useEffect, useReducer } = React;

/* ═══════════════════════════════════════════════════════════════════════════
   PALETTE
═══════════════════════════════════════════════════════════════════════════ */
const C = {
  bar:"#04050b",   b950:"#06070e",  b900:"#09091a",  b850:"#0c0d18",
  b800:"#0e0f1c",  b750:"#111222",  b700:"#141527",  b650:"#17182c",
  b600:"#1b1c32",  b550:"#1e2038",  b500:"#232440",  b450:"#29294e",
  b400:"#30315c",  b300:"#3d3f68",  b200:"#545880",  b100:"#757aaa",
  arch:"#1793d1",  archB:"#3aaee5",
  snow:"#cdd6f4",  snowD:"#bac2de", snowM:"#a6adc8",
  snowG:"#7f849c", snowF:"#45475a", snowFt:"#313244",
  red:"#f38ba8",   yellow:"#f9e2af", green:"#a6e3a1",
  cyan:"#89dceb",  blue:"#89b4fa",  mag:"#cba6f7",
  orange:"#fab387", teal:"#94e2d5",
};
const BAR_H = 28;

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL FONT + KEYFRAMES  (injected once)
═══════════════════════════════════════════════════════════════════════════ */
function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById("_dwm_st")) return;
    const lnk = Object.assign(document.createElement("link"), {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap",
    });
    document.head.appendChild(lnk);

    const st = document.createElement("style");
    st.id = "_dwm_st";
    st.textContent = `
      @keyframes _win  { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
      @keyframes _tile { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes _wave { 0%,80%,100%{transform:scaleY(.35)} 40%{transform:scaleY(1)} }
      ._win  { animation: _win  .2s cubic-bezier(.2,.8,.4,1) both }
      ._tile { animation: _tile .28s cubic-bezier(.2,.8,.4,1) both }
      .dwm * { box-sizing: border-box }
      .dwm ::-webkit-scrollbar       { width:3px; height:3px }
      .dwm ::-webkit-scrollbar-track { background:transparent }
      .dwm ::-webkit-scrollbar-thumb { background:#1793d130; border-radius:2px }
      .dwm ::-webkit-scrollbar-thumb:hover { background:#1793d155 }
    `;
    document.head.appendChild(st);
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLOCK
═══════════════════════════════════════════════════════════════════════════ */
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const p = n => String(n).padStart(2, "0");
  return (
    <span style={{ color: C.snowD, letterSpacing: ".1em", fontSize: 11 }}>
      {p(t.getHours())}:{p(t.getMinutes())}:{p(t.getSeconds())}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════════════════════════════════════ */
function TopBar({ wins, activeId, onFocus, onToggleMin }) {
  const date = new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: BAR_H, zIndex: 9999,
      background: C.bar, borderBottom: `1px solid ${C.arch}1a`,
      display: "flex", alignItems: "center",
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Arch glyph */}
      <div style={{
        width: 44, height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRight: `1px solid ${C.b500}`, flexShrink: 0,
        background: `${C.arch}09`,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill={C.arch}>
          <path d="M12 2L2 20h4.5l1.5-4h8l1.5 4H22L12 2zm0 6 2.5 6.5h-5L12 8z"/>
        </svg>
      </div>

      {/* Taskbar */}
      <div style={{ display: "flex", alignItems: "center", height: "100%", flex: 1, overflow: "hidden" }}>
        {wins.map(w => {
          const act = w.id === activeId && !w.minimized;
          return (
            <button key={w.id}
              onClick={() => w.minimized ? onFocus(w.id) : act ? onToggleMin(w.id) : onFocus(w.id)}
              style={{
                height: "100%", padding: "0 14px",
                display: "flex", alignItems: "center", gap: 7,
                background: act ? `${C.arch}1e` : "transparent",
                borderTop: `2px solid ${act ? C.arch : "transparent"}`,
                borderRight: `1px solid ${C.b500}`,
                borderLeft: "none", borderBottom: "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: 11,
                color: act ? C.snowD : C.snowF,
                transition: "all .11s", flexShrink: 0, outline: "none",
              }}
              onMouseEnter={e => { if (!act) { e.currentTarget.style.background = C.b700; e.currentTarget.style.color = C.snowG; } }}
              onMouseLeave={e => { if (!act) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.snowF; } }}
            >
              <span
                style={{ width: 12, height: 12, display: "flex", alignItems: "center", justifyContent: "center", color: act ? w.app.accent : C.snowF, flexShrink: 0, transition: "color .11s" }}
                dangerouslySetInnerHTML={{ __html: w.app.icon }}
              />
              <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {w.app.name}
              </span>
              {w.minimized && (
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.snowF, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Date + clock */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "0 16px", borderLeft: `1px solid ${C.b500}`, flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: C.snowF }}>{date}</span>
        <Clock />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LAUNCHER
═══════════════════════════════════════════════════════════════════════════ */
function Launcher({ apps, onOpen }) {
  const [hov, setHov]   = useState(null);
  const lastTap = useRef({});

  const handleClick = useCallback(id => {
    const now = Date.now();
    if (lastTap.current[id] && now - lastTap.current[id] < 340) {
      onOpen(id);
      lastTap.current[id] = 0;
    } else {
      lastTap.current[id] = now;
    }
  }, [onOpen]);

  return (
    <div style={{
      position: "absolute", inset: 0, overflowY: "auto",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "36px 28px 28px",
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: ".22em", color: C.b300, marginBottom: 10 }}>
          APPLICATIONS
        </div>
        <div style={{ width: 40, height: 1, background: `${C.arch}33`, margin: "0 auto" }} />
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
        gap: 14, width: "100%", maxWidth: 720,
      }}>
        {apps.map((app, i) => {
          const h = hov === app.id;
          return (
            <div key={app.id}
              className="_tile"
              style={{
                animationDelay: `${i * 0.035}s`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 9,
                padding: "18px 8px 14px", borderRadius: 10, cursor: "pointer",
                background: h ? C.b700 : C.b850,
                border: `1px solid ${h ? C.b450 : C.b750}`,
                transition: "all .13s",
                transform: h ? "translateY(-2px)" : "none",
              }}
              onClick={() => handleClick(app.id)}
              onMouseEnter={() => setHov(app.id)}
              onMouseLeave={() => setHov(null)}
            >
              {/* Icon box */}
              <div style={{
                width: 46, height: 46, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `${app.accent}${h ? "18" : "0c"}`,
                border: `1px solid ${app.accent}${h ? "55" : "2a"}`,
                color: app.accent, transition: "all .13s",
              }}>
                <span
                  style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}
                  dangerouslySetInnerHTML={{ __html: app.icon }}
                />
              </div>

              {/* Label */}
              <span style={{
                fontSize: 10, color: h ? C.snowG : C.snowF,
                textAlign: "center", lineHeight: 1.3,
                wordBreak: "break-word", transition: "color .13s",
              }}>
                {app.name}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 36, fontSize: 9.5, color: C.b400, letterSpacing: ".08em" }}>
        double-clic pour ouvrir
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP LAYOUT — generic orchestrator
   · url ends with .js/.mjs  →  dynamic import(), calls default export fn(container)
   · anything else            →  <iframe src={url}>
═══════════════════════════════════════════════════════════════════════════ */
function AppLayout({ app, isActive }) {
  const { url } = app;
  const mountRef = useRef(null);
  const [phase, setPhase] = useState("loading"); // "loading" | "ready" | "error" | "empty"
  const [errMsg, setErrMsg] = useState("");

  /* Detect ESM module by extension */
  const isEsm = url
    ? /\.(m?js)(\?[^#]*)?(#.*)?$/.test(url.trim())
    : false;

  useEffect(() => {
    if (!url) { setPhase("empty"); return; }
    setPhase("loading"); setErrMsg("");

    if (isEsm) {
      let cancelled = false;
      import(/* webpackIgnore: true */ url)
        .then(mod => {
          if (cancelled) return;
          const fn = mod.default;
          if (typeof fn !== "function") throw new Error("Le module n'exporte pas de fonction par défaut (export default fn(container)).");
          if (mountRef.current) { mountRef.current.innerHTML = ""; fn(mountRef.current); }
          setPhase("ready");
        })
        .catch(err => {
          if (!cancelled) { setErrMsg(err.message || String(err)); setPhase("error"); }
        });
      return () => { cancelled = true; };
    }

    /* iframe: no async work needed; just mark ready */
    setPhase("ready");
  }, [url, isEsm]);

  /* ── Toolbar ── */
  const toolbar = (
    <div style={{
      height: 34, display: "flex", alignItems: "center", gap: 8,
      background: isActive ? C.b800 : C.b900,
      borderBottom: `1px solid ${isActive ? C.b550 : C.b700}`,
      padding: "0 10px", flexShrink: 0, transition: "background .12s",
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* App badge pill */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "2px 8px 2px 6px", borderRadius: 5, flexShrink: 0,
        border: `1px solid ${app.accent}${isActive ? "44" : "1e"}`,
        background: `${app.accent}${isActive ? "12" : "08"}`,
        transition: "all .12s",
      }}>
        <span
          style={{ width: 11, height: 11, display: "flex", alignItems: "center", color: app.accent }}
          dangerouslySetInnerHTML={{ __html: app.icon }}
        />
        <span style={{ fontSize: 9, letterSpacing: ".14em", fontWeight: 600, color: app.accent }}>
          {app.short || app.name.slice(0, 3).toUpperCase()}
        </span>
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 14, background: C.b500, flexShrink: 0 }} />

      {/* URL */}
      <span style={{
        fontSize: 10, color: C.b200, flex: 1,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {url || "—"}
      </span>

      {/* Type chip */}
      {url && (
        <span style={{
          fontSize: 9, letterSpacing: ".1em", padding: "1px 7px", borderRadius: 4, flexShrink: 0,
          border: `1px solid ${isEsm ? C.green : C.blue}44`,
          color: isEsm ? C.green : C.blue,
        }}>
          {isEsm ? "ESM" : "IFRAME"}
        </span>
      )}
    </div>
  );

  /* ── Body states ── */
  const spinner = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
      {[0, .14, .28].map((d, i) => (
        <div key={i} style={{
          width: 4, height: 20, borderRadius: 3, background: app.accent,
          animation: `_wave .9s ${d}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );

  const errorView = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 32 }}>
      <div style={{ fontSize: 10, color: `${C.red}99`, letterSpacing: ".1em" }}>ESM_LOAD_ERROR</div>
      <div style={{ fontSize: 10, color: C.b300, maxWidth: 340, textAlign: "center", lineHeight: 1.9 }}>{errMsg}</div>
    </div>
  );

  const emptyView = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        border: `1px solid ${app.accent}33`, background: `${app.accent}0c`,
        display: "flex", alignItems: "center", justifyContent: "center", color: app.accent,
      }}>
        <span style={{ width: 26, height: 26, display: "flex", alignItems: "center" }}
          dangerouslySetInnerHTML={{ __html: app.icon }} />
      </div>
      <div style={{ fontSize: 11, color: C.snowG }}>{app.name}</div>
      <div style={{ fontSize: 10, color: C.b300, maxWidth: 280, textAlign: "center", lineHeight: 1.9 }}>
        Aucune <code style={{ color: C.arch, fontSize: 10 }}>url</code> définie — ajoutez-en une dans la config APPS.
      </div>
    </div>
  );

  /* ── Status bar ── */
  const statusBar = (
    <div style={{
      height: 19, display: "flex", alignItems: "center", justifyContent: "space-between",
      background: C.b900, borderTop: `1px solid ${C.b700}`,
      padding: "0 10px", flexShrink: 0,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <span style={{ fontSize: 9.5, color: C.b300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {url || app.name}
      </span>
      <span style={{ fontSize: 9.5, color: C.b400, flexShrink: 0, marginLeft: 8 }}>
        {!url ? "—" : isEsm ? "esm" : "iframe"}
      </span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", flex: 1 }}>
      {toolbar}

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", background: C.b800 }}>
        {phase === "loading" && spinner}
        {phase === "error"   && errorView}
        {phase === "empty"   && emptyView}

        {/* ESM mount */}
        {isEsm && (
          <div
            ref={mountRef}
            style={{ flex: 1, overflow: "auto", width: "100%", height: "100%", display: phase === "ready" ? "block" : "none" }}
          />
        )}

        {/* Iframe */}
        {!isEsm && phase === "ready" && url && (
          <iframe
            src={url}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ flex: 1, width: "100%", height: "100%", border: "none", display: "block", background: "#fff" }}
          />
        )}
      </div>

      {statusBar}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WINDOW BUTTON
═══════════════════════════════════════════════════════════════════════════ */
function WBtn({ onClick, hoverColor, symbol, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hov ? `${hoverColor}18` : "transparent",
        border: "none", borderLeft: `1px solid ${C.b600}`,
        cursor: "pointer", fontFamily: "inherit", fontSize: 12,
        color: hov ? hoverColor : C.snowF,
        transition: "all .1s", outline: "none",
      }}
    >
      {symbol}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP WINDOW
═══════════════════════════════════════════════════════════════════════════ */
function AppWindow({ win, isActive, onClose, onMin, onMax, onFocus }) {
  const { app, x, y, width, height, maximized } = win;
  const elRef = useRef(null);
  const geo   = useRef({ x, y, width, height });

  /* ── drag ── */
  const startDrag = useCallback(e => {
    if (e.target.closest("[data-nb]") || maximized) return;
    e.preventDefault(); onFocus();
    const ox = e.clientX - geo.current.x;
    const oy = e.clientY - geo.current.y;
    const mv = ev => {
      geo.current.x = ev.clientX - ox;
      geo.current.y = ev.clientY - oy;
      if (elRef.current) {
        elRef.current.style.left = geo.current.x + "px";
        elRef.current.style.top  = geo.current.y + "px";
      }
    };
    const up = () => {
      win.x = geo.current.x; win.y = geo.current.y;
      document.removeEventListener("mousemove", mv);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
  }, [maximized, onFocus, win]);

  /* ── resize ── */
  const startResize = useCallback(e => {
    if (maximized) return;
    e.preventDefault(); e.stopPropagation();
    const sw = geo.current.width, sh = geo.current.height;
    const sx = e.clientX, sy = e.clientY;
    const mv = ev => {
      geo.current.width  = Math.max(380, sw + ev.clientX - sx);
      geo.current.height = Math.max(260, sh + ev.clientY - sy);
      if (elRef.current) {
        elRef.current.style.width  = geo.current.width  + "px";
        elRef.current.style.height = geo.current.height + "px";
      }
    };
    const up = () => {
      win.width = geo.current.width; win.height = geo.current.height;
      document.removeEventListener("mousemove", mv);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
  }, [maximized, win]);

  const maxStyle = maximized
    ? { left: 0, top: 0, width: "100%", height: "100%", borderRadius: 0 }
    : { left: x,  top: y,  width,       height,          borderRadius: 8 };

  return (
    <div
      ref={elRef}
      className="_win"
      onMouseDown={onFocus}
      style={{
        position: "absolute", ...maxStyle,
        display: "flex", flexDirection: "column",
        background: C.b850,
        border: `1px solid ${isActive ? app.accent + "55" : C.b500}`,
        overflow: "hidden", zIndex: win.z,
        transition: "border-color .12s",
        boxShadow: isActive ? `0 0 0 1px ${app.accent}12, 0 20px 60px #00000058` : "none",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* ── Title bar ── */}
      <div
        onMouseDown={startDrag}
        onDoubleClick={() => !maximized && onMax()}
        style={{
          height: 32, display: "flex", alignItems: "center",
          background: isActive ? C.b800 : C.b900,
          borderBottom: `1px solid ${isActive ? app.accent + "22" : C.b700}`,
          cursor: maximized ? "default" : "move",
          userSelect: "none", flexShrink: 0, transition: "background .12s",
        }}
      >
        {/* Accent stripe */}
        <div style={{
          width: 2, height: "100%",
          background: isActive ? app.accent : C.b500,
          flexShrink: 0, transition: "background .12s",
        }} />

        {/* Icon + title */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, padding: "0 10px", overflow: "hidden" }}>
          <span
            style={{ width: 13, height: 13, display: "flex", alignItems: "center", color: isActive ? app.accent : C.snowF, flexShrink: 0, transition: "color .12s" }}
            dangerouslySetInnerHTML={{ __html: app.icon }}
          />
          <span style={{
            fontSize: 11, letterSpacing: ".04em",
            color: isActive ? C.snowD : C.snowF,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color .12s",
          }}>
            {app.name}
          </span>
        </div>

        {/* Buttons */}
        <div data-nb style={{ display: "flex", height: "100%" }}>
          <WBtn onClick={onMin}   hoverColor={C.yellow} symbol="─" title="Minimiser" />
          <WBtn onClick={onMax}   hoverColor={C.green}  symbol={maximized ? "⇲" : "⇱"} title={maximized ? "Restaurer" : "Maximiser"} />
          <WBtn onClick={onClose} hoverColor={C.red}    symbol="×" title="Fermer" />
        </div>
      </div>

      {/* ── AppLayout (the only content renderer) ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <AppLayout app={app} isActive={isActive} />
      </div>

      {/* ── Resize grip ── */}
      {!maximized && (
        <div
          onMouseDown={startResize}
          style={{
            position: "absolute", bottom: 0, right: 0, width: 18, height: 18,
            cursor: "se-resize", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 4,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <line x1="8" y1="1" x2="1" y2="8" stroke={C.b400} strokeWidth="1.2"/>
            <line x1="8" y1="4.5" x2="4.5" y2="8" stroke={C.b400} strokeWidth="1.2"/>
          </svg>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WINDOWS REDUCER
═══════════════════════════════════════════════════════════════════════════ */
function winsReducer(s, a) {
  switch (a.type) {
    case "OPEN": {
      const ex = s.wins.find(w => w.id === a.id);
      if (ex) {
        return { z: s.z + 1, activeId: a.id, wins: s.wins.map(w => w.id === a.id ? { ...w, minimized: false, z: s.z + 1 } : w) };
      }
      const idx = s.wins.length;
      return {
        z: s.z + 1, activeId: a.id,
        wins: [...s.wins, {
          id: a.id, app: a.app,
          x: 60 + idx * 28, y: 8 + idx * 22,
          width: 720, height: 500,
          minimized: false, maximized: false,
          z: s.z + 1,
        }],
      };
    }
    case "CLOSE":
      return {
        ...s,
        activeId: s.activeId === a.id ? (s.wins.find(w => w.id !== a.id)?.id ?? null) : s.activeId,
        wins: s.wins.filter(w => w.id !== a.id),
      };
    case "MIN":
      return { ...s, activeId: s.activeId === a.id ? null : s.activeId, wins: s.wins.map(w => w.id === a.id ? { ...w, minimized: true } : w) };
    case "MAX":
      return { ...s, wins: s.wins.map(w => w.id === a.id ? { ...w, maximized: !w.maximized } : w) };
    case "FOCUS":
      return { z: s.z + 1, activeId: a.id, wins: s.wins.map(w => w.id === a.id ? { ...w, minimized: false, z: s.z + 1 } : w) };
    default:
      return s;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT — Desktop
═══════════════════════════════════════════════════════════════════════════ */
export function Desktop({ apps = [] }) {
  useGlobalStyles();

  const [{ wins, activeId }, dispatch] = useReducer(winsReducer, { wins: [], z: 100, activeId: null });

  const open  = useCallback(id => { const app = apps.find(a => a.id === id); if (app) dispatch({ type: "OPEN", id, app }); }, [apps]);
  const close = useCallback(id => dispatch({ type: "CLOSE", id }), []);
  const min   = useCallback(id => dispatch({ type: "MIN",   id }), []);
  const max   = useCallback(id => dispatch({ type: "MAX",   id }), []);
  const focus = useCallback(id => dispatch({ type: "FOCUS", id }), []);

  return (
    <div className="dwm" style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      position: "relative", background: C.b950,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Subtle scanline texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${C.b900}10 3px, ${C.b900}10 4px)`,
      }} />

      {/* Workspace */}
      <div style={{ position: "absolute", top: BAR_H, left: 0, right: 0, bottom: 0, zIndex: 2, overflow: "hidden" }}>
        {/* Launcher — always behind windows */}
        <Launcher apps={apps} onOpen={open} />

        {/* Open windows */}
        {wins.filter(w => !w.minimized).map(w => (
          <AppWindow
            key={w.id} win={w} isActive={w.id === activeId}
            onClose={() => close(w.id)}
            onMin={()    => min(w.id)}
            onMax={()    => max(w.id)}
            onFocus={()  => focus(w.id)}
          />
        ))}
      </div>

      {/* Top bar */}
      <TopBar
        wins={wins} activeId={activeId}
        onFocus={focus}
        onToggleMin={id => {
          const w = wins.find(x => x.id === id);
          if (w?.minimized) focus(id); else min(id);
        }}
      />
    </div>
  );
}

const APPS = [
  {
    id: "browser", name: "Navigator", short: "WEB", accent: "#89b4fa",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg>`,
    url: "https://apps.intranet.local/browser/main.js",
  },
  {
    id: "terminal", name: "Terminal", short: "TTY", accent: "#a6e3a1",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    url: "https://apps.intranet.local/terminal/bundle.mjs",
  },
  {
    id: "files", name: "Files", short: "DIR", accent: "#f9e2af",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    url: "https://apps.intranet.local/filemanager/app.js",
  },
  {
    id: "editor", name: "Editor", short: "EDI", accent: "#cba6f7",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`,
    url: "https://apps.intranet.local/editor/index.js",
  },
  {
    id: "settings", name: "Settings", short: "CFG", accent: "#89dceb",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    url: "https://apps.intranet.local/settings/index.js",
  },
  {
    id: "music", name: "Music", short: "AUD", accent: "#fab387",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    url: "https://music.intranet.local/",
  },
  {
    id: "calendar", name: "Calendar", short: "CAL", accent: "#f38ba8",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    url: "https://calendar.intranet.local/",
  },
  {
    id: "maps", name: "Maps", short: "MAP", accent: "#94e2d5",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`,
    url: "https://apps.intranet.local/maps/bundle.mjs",
  },
];
  
export default function App(props) {
  // Parse JSON string values in props if present
  const parsedProps = Object.keys(props).reduce((acc, key) => {
    const value = props[key];
    if (typeof value === 'string') {
      try {
        acc[key] = JSON.parse(value);
      } catch {
        acc[key] = value;
      }
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  if(!parsedProps.apps){
    parsedProps.apps = APPS;
  }

  return (
    <Desktop {...parsedProps} />
  );
}
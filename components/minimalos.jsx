const { useState, useRef, useCallback, useEffect } = React;

function Bootstrap() {
  useEffect(() => {
    if (document.getElementById("mos-tw")) return;

    const cfg = document.createElement("script");
    cfg.textContent = `window.tailwind.config = {
      theme: {
        extend: {
          colors: {
            bar: "#090a12",
            base: {
              950: "#090a12",
              900: "#0d0e17", 
              850: "#101119",
              800: "#13141f",
              750: "#15162a",
              700: "#181928",
              650: "#1a1b2e",
              600: "#1e1f35",
              550: "#222340",
              500: "#252545",
              450: "#2a2b50",
              400: "#30315a",
              300: "#3d3f68",
              200: "#565f89",
              100: "#7a83b8"
            },
            arch: {
              DEFAULT: "#1793d1",
              dark: "#0f6fa8", 
              bright: "#4ab0e8"
            },
            snow: {
              bright: "#cdd6f4",
              DEFAULT: "#bac2de",
              dim: "#a6adc8",
              muted: "#7f849c",
              ghost: "#45475a",
              faint: "#313244"
            },
            syn: {
              red: "#f38ba8",
              yellow: "#f9e2af",
              green: "#a6e3a1",
              cyan: "#89dceb",
              blue: "#89b4fa",
              magenta: "#cba6f7",
              orange: "#fab387",
              teal: "#94e2d5"
            }
          },
          fontFamily: {
            mono: ["'JetBrains Mono'", "monospace"]
          }
        }
      }
    }`;
    document.head.appendChild(cfg);

    const tw = Object.assign(document.createElement("script"), { id:"mos-tw", src:"https://cdn.tailwindcss.com/4.0.0-alpha.15" });
    document.head.appendChild(tw);

    const gf = Object.assign(document.createElement("link"), { rel:"stylesheet", href:"https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" });
    document.head.appendChild(gf);

    const st = document.createElement("style");
    st.textContent = `
      ::-webkit-scrollbar{width:3px;height:3px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:#1793d144;border-radius:2px}
      ::-webkit-scrollbar-thumb:hover{background:#1793d188}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      @keyframes winIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
      @keyframes pulse-arch{0%,100%{opacity:.6}50%{opacity:1}}
      .win-in{animation:winIn .15s cubic-bezier(.2,.8,.4,1) both}
      iframe{border:none;width:100%;height:100%;display:block}
      input,textarea{color:#bac2de!important;background:transparent}
      input::placeholder,textarea::placeholder{color:#45475a!important}
      button{font-family:inherit}
    `;
    document.head.appendChild(st);
  }, []);
  return null;
}

const P = {
  bar:"#090a12", b900:"#0d0e17", b850:"#101119", b800:"#13141f",
  b700:"#181928", b650:"#1a1b2e", b600:"#1e1f35", b550:"#222340",
  b500:"#252545", b450:"#2a2b50", b400:"#30315a", b300:"#3d3f68",
  b200:"#565f89", b100:"#7a83b8",
  arch:"#1793d1", archB:"#4ab0e8",
  sBright:"#cdd6f4", s:"#bac2de", sDim:"#a6adc8",
  sMuted:"#7f849c", sGhost:"#45475a", sFaint:"#313244",
  red:"#f38ba8", yellow:"#f9e2af", green:"#a6e3a1",
  cyan:"#89dceb", blue:"#89b4fa", mag:"#cba6f7", orange:"#fab387",
};

/* ══════════════════════════════════════════════════════
   APP REGISTRY
══════════════════════════════════════════════════════ */
const APPS = [
  { id:"browser",   label:"Firefox",    short:"WEB",  glyph:"🌐",  accent:P.blue   },
];

function AppLayout({ app, sidebar, toolbar, statusLeft, statusRight, children }) {
  return (
    <div className="flex flex-col w-full h-full bg-base-800 font-mono text-snow overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex items-center h-[34px] bg-base-850 border-b border-base-450 flex-shrink-0 px-2.5 gap-2.5">
        {/* App badge pill */}
        <div className="flex items-center gap-1.5 p-0.5 rounded border border-opacity-33 flex-shrink-0" style={{ borderColor: app.accent + '55', backgroundColor: app.accent + '12' }}>
          <span style={{ fontSize:"11px", color:app.accent }}>{app.glyph}</span>
          <span style={{ fontSize:"10px", fontWeight:600, letterSpacing:"0.12em", color:app.accent }}>{app.short || app.label.toUpperCase()}</span>
        </div>
        <div className="w-0.5 h-4 bg-base-400 opacity-50 flex-shrink-0" />
        {/* Toolbar content slot */}
        <div className="flex items-center gap-2 flex-1 overflow-hidden text-xs text-snow-dim">
          {toolbar}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <div className="w-[148px] flex-shrink-0 bg-base-950 border-r border-base-450 overflow-y-auto flex flex-col">
            {sidebar}
          </div>
        )}
        {/* Main */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-base-800">
          {children}
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between h-[20px] bg-base-850 border-t border-base-450 flex-shrink-0 px-2.5">
        <span className="text-[10px] text-snow-muted">{statusLeft || "Prêt"}</span>
        {statusRight && <span className="text-[10px] text-base-200">{statusRight}</span>}
      </div>
    </div>
  );
}

/* ── Small toolbar button ── */
function TbBtn({ label, active, onClick, accent }) {
  const [hov, setHov] = useState(false);
  const ac = accent || P.arch;
  return (
    <button onClick={onClick}
      className="px-2 py-0.5 rounded text-[10px] cursor-pointer font-mono transition-all"
      style={{
        borderColor: active || hov ? ac + '55' : P.b400,
        backgroundColor: active ? ac + '22' : hov ? P.b600 : 'transparent',
        color: active ? ac : P.sDim
      }}
      onMouseEnter={e => { if(!active) { e.currentTarget.style.backgroundColor = P.b600; e.currentTarget.style.borderColor = ac + '55'; e.currentTarget.style.color = P.s; } }}
      onMouseLeave={e => { if(!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = P.b400; e.currentTarget.style.color = P.sDim; } }}>
      {label}
    </button>
  );
}

/* Browser */
function BrowserApp({ app }) {
  const [url, setUrl] = useState("https://wiki.archlinux.org");
  const [draft, setDraft] = useState(url);
  const [loading, setLoading] = useState(false);
  const go = useCallback(() => {
    let u = draft.startsWith("http") ? draft : `https://${draft}`;
    setUrl(u); setDraft(u); setLoading(true);
    setTimeout(()=>setLoading(false), 1000);
  }, [draft]);
  return (
    <AppLayout app={app}
      toolbar={
        <div className="flex gap-1.5 items-center flex-1">
          <TbBtn label="←" /><TbBtn label="→" /><TbBtn label="↻" onClick={()=>go()} accent={app.accent} />
          <div className="flex-1 flex items-center gap-1.5 bg-base-700 border border-base-400 rounded px-2 py-0.5">
            <span className="text-syn-green text-[10px]">🔒</span>
            <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}
              className="flex-1 bg-transparent border-0 outline-0 text-[11px] text-snow font-mono" />
          </div>
          <TbBtn label="Go" active onClick={go} accent={app.accent} />
        </div>
      }
      statusLeft={loading?"Chargement…":url} statusRight="Firefox 125">
      {loading
        ? <div className="flex items-center justify-center h-full text-snow-muted text-[12px]">Chargement…</div>
        : <iframe src={url} title="Browser" sandbox="allow-scripts allow-same-origin allow-forms" />}
    </AppLayout>
  );
}

const CONTENT_MAP = {
  browser:BrowserApp,
};

/* ══════════════════════════════════════════════════════
   CLOCK
══════════════════════════════════════════════════════ */
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(()=>{ const id=setInterval(()=>setT(new Date()),1000); return ()=>clearInterval(id); },[]);
  const p = n=>String(n).padStart(2,"0");
  return <span className="font-mono text-[12px] text-snow tracking-[0.1em]">{p(t.getHours())}:{p(t.getMinutes())}:{p(t.getSeconds())}</span>;
}

/* ══════════════════════════════════════════════════════
   DWM TOP BAR
══════════════════════════════════════════════════════ */
const BAR_H = 26;
function DwmBar({ openWindows, windows, onFocus, onToggleMin, activeId }) {
  const date = new Date().toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"});
  return (
    <div className="fixed top-0 left-0 right-0 h-[26px] bg-bar border-b border-[#1793d128] flex items-center z-[9999] font-mono" style={{ height: BAR_H + 'px' }}>
      {/* Open apps */}
      {openWindows.map(id=>{
        const a = APPS.find(x=>x.id===id);
        const w = windows.find(x=>x.id===id);
        const isAct = id===activeId;
        return (
          <button key={id} onClick={()=>w?.minimized?onToggleMin(id):onFocus(id)}
            className="h-full px-2.5 flex items-center gap-1.5 border-0 border-r cursor-pointer font-inherit text-[11px] transition-all flex-shrink-0"
            style={{ 
              borderRightColor: '#1793d115',
              backgroundColor: isAct ? P.arch : 'transparent',
              color: isAct ? '#fff' : P.sGhost,
              opacity: w?.minimized ? 0.7 : 1
            }}
            onMouseEnter={e=>{ if(!isAct) e.currentTarget.style.backgroundColor=P.b700; }}
            onMouseLeave={e=>{ if(!isAct) e.currentTarget.style.backgroundColor='transparent'; }}>
            <span>{a?.glyph}</span>
            <span>{a?.label}</span>
            {w?.minimized&&<span className="text-[8px] opacity-70">▼</span>}
          </button>
        );
      })}
      {/* Separator */}
      <div className="w-px h-[14px] bg-base-300 mx-2 opacity-40 flex-shrink-0 ml-auto" />
      {/* Date + clock */}
      <div className="flex items-center gap-3 px-3.5 flex-shrink-0">
        <span className="text-[11px] text-snow-ghost">{date}</span>
        <Clock />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   APP WINDOW  — dwm chrome + maximise mode
══════════════════════════════════════════════════════ */
function AppWindow({ win, app, onClose, onMinimize, onMaximize, onFocus, zIndex, isActive }) {
  const { id, x, y, width, height, minimized, maximized } = win;
  const elRef  = useRef(null);
  const posRef = useRef({ x, y });
  const sizRef = useRef({ width, height });
  const prevRef = useRef(null);   // stores pre-maximize geometry

  const startDrag = useCallback(e => {
    if (e.target.closest("[data-nd]") || win.maximized) return;
    e.preventDefault(); onFocus(id);
    const ox=e.clientX-posRef.current.x, oy=e.clientY-posRef.current.y;
    const mv=ev=>{
      posRef.current={x:ev.clientX-ox, y:ev.clientY-oy};
      if(elRef.current){ elRef.current.style.left=posRef.current.x+"px"; elRef.current.style.top=posRef.current.y+"px"; }
    };
    const up=()=>{ win.x=posRef.current.x; win.y=posRef.current.y; document.removeEventListener("mousemove",mv); document.removeEventListener("mouseup",up); };
    document.addEventListener("mousemove",mv); document.addEventListener("mouseup",up);
  }, [id, onFocus, win]);

  const startResize = useCallback(e => {
    if (win.maximized) return;
    e.preventDefault(); e.stopPropagation();
    const sw=sizRef.current.width, sh=sizRef.current.height, sx=e.clientX, sy=e.clientY;
    const mv=ev=>{
      sizRef.current={width:Math.max(340,sw+ev.clientX-sx), height:Math.max(240,sh+ev.clientY-sy)};
      if(elRef.current){ elRef.current.style.width=sizRef.current.width+"px"; elRef.current.style.height=sizRef.current.height+"px"; }
    };
    const up=()=>{ win.width=sizRef.current.width; win.height=sizRef.current.height; document.removeEventListener("mousemove",mv); document.removeEventListener("mouseup",up); };
    document.addEventListener("mousemove",mv); document.addEventListener("mouseup",up);
  }, [win]);

  if (minimized) return null;
  const Content = CONTENT_MAP[id];

  // Maximized: fill the entire workspace below the bar
  const maxStyle = maximized ? {
    left: 0, top: BAR_H,
    width: '100vw',
    height: `calc(100vh - ${BAR_H}px)`,
    borderRadius: 0,
  } : {
    left: x, top: y, width, height, borderRadius: "6px",
  };

  const borderCol = isActive ? app.accent : P.b450;

  return (
    <div ref={elRef} onMouseDown={()=>onFocus(id)}
      className={`absolute flex flex-col overflow-hidden bg-base-800 border transition-colors ${isActive ? 'border-arch' : 'border-base-500'}`}
      style={{ ...maxStyle, zIndex, minWidth:'340px', minHeight:'240px' }}>

      {/* ── Title bar ── */}
      <div onMouseDown={startDrag} data-titlebar
        className={`h-7 flex items-center border-b flex-shrink-0 select-none transition-colors ${isActive ? 'bg-base-850 border-arch' : 'bg-base-900 border-base-500'}`}
        style={{ cursor: maximized ? 'default' : 'move' }}>
        {/* Left accent stripe */}
        <div className={`w-0.5 h-full flex-shrink-0 transition-colors ${isActive ? 'bg-arch' : 'bg-base-400'}`} />
        {/* Glyph + title */}
        <span className={`flex-1 px-2.5 text-[11px] tracking-[0.05em] overflow-hidden text-ellipsis whitespace-nowrap transition-colors ${isActive ? 'text-snow' : 'text-snow-muted'}`}>
          <span className="mr-1.5">{app.glyph}</span>{app.label}
        </span>
        {/* Buttons */}
        <div className="flex h-full" data-nd>
          {/* Minimize */}
          <WinBtn onClick={()=>onMinimize(id)} color={P.yellow} hoverBg="#f9e2af18" title="Minimiser">─</WinBtn>
          {/* Maximize / restore */}
          <WinBtn onClick={()=>onMaximize(id)} color={maximized?P.green:P.b100} hoverBg="#a6e3a118" title={maximized?"Restaurer":"Maximiser"}>
            {maximized?"⇲":"⇱"}
          </WinBtn>
          {/* Close */}
          <WinBtn onClick={()=>onClose(id)} color={P.red} hoverBg="#f38ba818" title="Fermer">×</WinBtn>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">
        {Content ? <Content app={app}/> : <div className="p-4 text-[12px] text-snow-muted">{app.label}</div>}
      </div>

      {/* Resize grip (only when not maximized) */}
      {!maximized && (
        <div onMouseDown={startResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5">
          <svg width="8" height="8" viewBox="0 0 8 8">
            <line x1="8" y1="1" x2="1" y2="8" stroke={P.b300} strokeWidth="1.2"/>
            <line x1="8" y1="5" x2="5" y2="8" stroke={P.b300} strokeWidth="1.2"/>
          </svg>
        </div>
      )}
    </div>
  );
}

function WinBtn({ onClick, color, hoverBg, title, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      className="w-[30px] h-full bg-transparent border-0 border-l cursor-pointer font-mono text-[13px] flex items-center justify-center transition-colors"
      style={{ 
        borderLeftColor: P.b450,
        backgroundColor: hov ? hoverBg : 'transparent',
        color
      }}>
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT DESKTOP
══════════════════════════════════════════════════════ */
export default function Desktop() {
  const [windows,  setWindows]  = useState([]);
  const [zCount,   setZCount]   = useState(100);
  const [activeId, setActiveId] = useState(null);

  const openWindow = useCallback(appId => {
    setWindows(prev => {
      const ex = prev.find(w=>w.id===appId);
      if (ex) {
        setZCount(z=>z+1);
        setActiveId(appId);
        return prev.map(w=>w.id===appId?{...w,minimized:false,z:zCount+1}:w);
      }
      const idx = prev.length;
      setZCount(z=>z+1);
      setActiveId(appId);
      return [...prev,{id:appId, x:80+idx*32, y:BAR_H+8+idx*26, width:660, height:460, minimized:false, maximized:false, z:zCount+1}];
    });
  }, [zCount]);

  const closeWindow   = useCallback(id=>{ setWindows(p=>p.filter(w=>w.id!==id)); setActiveId(p=>p===id?null:p); },[]);
  const toggleMin     = useCallback(id=>{ setWindows(p=>p.map(w=>w.id===id?{...w,minimized:!w.minimized}:w)); setActiveId(p=>p===id?null:p); },[]);
  const toggleMax     = useCallback(id=>{ setWindows(p=>p.map(w=>w.id===id?{...w,maximized:!w.maximized}:w)); },[]);
  const focusWindow   = useCallback(id=>{ setZCount(z=>{ const n=z+1; setWindows(p=>p.map(w=>w.id===id?{...w,z:n}:w)); setActiveId(id); return n; }); },[]);

  const openIds = windows.map(w=>w.id);

  return (
    <>
      <Bootstrap />
      <div className="w-screen h-screen overflow-hidden relative bg-base-950 font-mono select-none cursor-default">

        {/* Flat background accent */}
        <div className="absolute inset-0 pointer-events-none bg-base-950" />

        {/* Workspace */}
        <div className="absolute overflow-hidden" style={{ top: BAR_H + 'px', left: 0, right: 0, bottom: 0 }}>
          {/* App launcher grid - always visible */}
          <div className="absolute inset-0 p-8 overflow-y-auto">
            <div className="text-center mb-8">
              <div className="text-[38px] text-base-400 tracking-[0.12em] mb-2">arch</div>
              <div className="text-[11px] text-base-300 tracking-[0.1em] mb-6">Applications disponibles</div>
            </div>
            <div className="grid grid-cols-5 gap-6 max-w-6xl mx-auto">
              {APPS.map(app => (
                <div key={app.id} className="flex flex-col items-center gap-3 p-4 rounded-lg bg-base-800 border border-base-700 cursor-pointer transition-all hover:bg-base-750 hover:border-base-600"
                  onDoubleClick={() => openWindow(app.id)}>
                  <div className="w-14 h-14 rounded-lg bg-base-700 border flex items-center justify-center text-[22px] transition-all"
                    style={{ borderColor: app.accent, color: app.accent }}>
                    {app.glyph}
                  </div>
                  <span className="text-[11px] text-center text-snow-muted">{app.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Windows */}
          {windows.map(win => {
            const app = APPS.find(a => a.id === win.id);
            return (
              <AppWindow
                key={win.id}
                win={win}
                app={app}
                onClose={closeWindow}
                onMinimize={toggleMin}
                onMaximize={toggleMax}
                onFocus={focusWindow}
                zIndex={win.z || 100}
                isActive={win.id === activeId}
              />
            );
          })}
        </div>

        {/* DWM Bar */}
        <DwmBar
          openWindows={openIds}
          windows={windows}
          onFocus={focusWindow}
          onToggleMin={toggleMin}
          activeId={activeId}
        />
      </div>
    </>
  );
}
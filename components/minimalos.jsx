/* ═══════════════════════════════════════════════════════════
   MinimalOS — Dark Flat Design — Single JSX File
   Props: apps = [{ nom, color, url }]
   Dépendances CDN : Font Awesome 6 (chargé dynamiquement)
═══════════════════════════════════════════════════════════ */

const { useState, useEffect, useMemo, useCallback, useRef } = React;

/* ─────────────────────────────────────────────────────────
   CONSTANTES & CONFIG
───────────────────────────────────────────────────────── */
const PIN_CORRECT = "1234";
const DB_NAME = "MinimalOS_DB";
const DB_VERSION = 1;
const STORE_NAME = "app_history";
const MAX_RECENT = 20;

const DEFAULT_APPS = [
  { nom: "Navigateur",  color: "#38BDF8", url: "browser.js",   icon: "fa-globe"         },
  { nom: "Terminal",    color: "#4ADE80", url: "terminal.js",  icon: "fa-terminal"      },
  { nom: "Fichiers",    color: "#FBBF24", url: "files.js",     icon: "fa-folder"        },
  { nom: "Éditeur",     color: "#A78BFA", url: "editor.js",    icon: "fa-pen-nib"       },
  { nom: "Musique",     color: "#F472B6", url: "music.js",     icon: "fa-music"         },
  { nom: "Galerie",     color: "#2DD4BF", url: "gallery.js",   icon: "fa-images"        },
  { nom: "Paramètres",  color: "#94A3B8", url: "settings.js",  icon: "fa-cog"           },
  { nom: "Jeux",        color: "#FB923C", url: "games.js",     icon: "fa-gamepad"       },
  { nom: "Calendrier",  color: "#34D399", url: "calendar.js",  icon: "fa-calendar-days" },
  { nom: "Notes",       color: "#FDE68A", url: "notes.js",     icon: "fa-note-sticky"   },
];

/* ─────────────────────────────────────────────────────────
   FONT AWESOME LOADER
───────────────────────────────────────────────────────── */
function useFontAwesome() {
  useEffect(() => {
    const id = "fa-cdn";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
      document.head.appendChild(link);
    }
  }, []);
}

/* ─────────────────────────────────────────────────────────
   INDEXED DB HOOK
───────────────────────────────────────────────────────── */
function useAppHistory() {
  const dbRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("url", "url", { unique: false });
        store.createIndex("openedAt", "openedAt", { unique: false });
      }
    };

    req.onsuccess = (e) => {
      dbRef.current = e.target.result;
      loadHistory();
      setReady(true);
    };

    req.onerror = () => {
      // Fallback to localStorage if IndexedDB fails
      try {
        const saved = localStorage.getItem("os_app_history");
        if (saved) setHistory(JSON.parse(saved));
      } catch {}
      setReady(true);
    };
  }, []);

  const loadHistory = useCallback(() => {
    if (!dbRef.current) return;
    const tx = dbRef.current.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("openedAt");
    const req = index.openCursor(null, "prev");
    const items = [];
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor && items.length < MAX_RECENT) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        setHistory(items);
      }
    };
  }, []);

  const recordOpen = useCallback((app) => {
    const entry = {
      url: app.url,
      nom: app.nom,
      color: app.color,
      openedAt: Date.now(),
    };

    if (dbRef.current) {
      const tx = dbRef.current.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.add(entry);
      tx.oncomplete = () => loadHistory();
    } else {
      // Fallback localStorage
      try {
        const saved = localStorage.getItem("os_app_history");
        const arr = saved ? JSON.parse(saved) : [];
        arr.unshift({ ...entry, id: Date.now() });
        if (arr.length > MAX_RECENT) arr.pop();
        localStorage.setItem("os_app_history", JSON.stringify(arr));
        setHistory(arr);
      } catch {}
    }
  }, [loadHistory]);

  const clearHistory = useCallback(() => {
    if (dbRef.current) {
      const tx = dbRef.current.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => setHistory([]);
    } else {
      localStorage.removeItem("os_app_history");
      setHistory([]);
    }
  }, []);

  return { history, recordOpen, clearHistory, ready };
}

/* ─────────────────────────────────────────────────────────
   UTILITAIRES
───────────────────────────────────────────────────────── */
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
}

function getAppIcon(app) {
  // Si l'objet app a une propriété icon, l'utiliser directement
  if (app && app.icon) {
    return app.icon;
  }
  return "fa-window-maximize";
}

/* ─────────────────────────────────────────────────────────
   GLOBAL CSS INJECTION
───────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

  :root {
    --os-bg:        #0D0F14;
    --os-surface:   #141720;
    --os-surface2:  #1C2030;
    --os-surface3:  #232840;
    --os-border:    rgba(255,255,255,0.06);
    --os-border2:   rgba(255,255,255,0.10);
    --os-text:      #E8ECF4;
    --os-text2:     #8892A4;
    --os-text3:     #4E5566;
    --os-accent:    #6C63FF;
    --os-r-sm:      10px;
    --os-r-md:      16px;
    --os-r-lg:      22px;
    --os-r-xl:      30px;
  }

  .os-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .os-root { font-family: 'Sora', sans-serif; background: var(--os-bg); color: var(--os-text); min-height: 100vh; }

  /* scrollbar */
  .os-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .os-root ::-webkit-scrollbar-track { background: transparent; }
  .os-root ::-webkit-scrollbar-thumb { background: var(--os-border2); border-radius: 99px; }

  /* animations */
  @keyframes os-fadein {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes os-shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-8px); }
    40%      { transform: translateX(8px); }
    60%      { transform: translateX(-5px); }
    80%      { transform: translateX(5px); }
  }
  @keyframes os-pulse-dot {
    0%,100% { opacity: 0.4; transform: scale(0.85); }
    50%     { opacity: 1;   transform: scale(1.1); }
  }

  .os-fadein { animation: os-fadein 0.3s ease both; }
  .os-shake  { animation: os-shake 0.4s ease; }

  /* global btn reset */
  .os-root button { font-family: 'Sora', sans-serif; cursor: pointer; border: none; outline: none; background: none; }
  .os-root input  { font-family: 'Sora', sans-serif; outline: none; }
`;

function useGlobalCSS() {
  useEffect(() => {
    const id = "os-global-css";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }, []);
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENT: PinDot
───────────────────────────────────────────────────────── */
function PinDot({ filled, animating }) {
  return (
    <div style={{
      width: 14, height: 14,
      borderRadius: "50%",
      background: filled ? "var(--os-accent)" : "var(--os-surface3)",
      border: `1.5px solid ${filled ? "var(--os-accent)" : "rgba(255,255,255,0.08)"}`,
      transition: "all 0.18s cubic-bezier(.34,1.56,.64,1)",
      transform: filled ? "scale(1.15)" : "scale(0.9)",
      boxShadow: filled ? "0 0 10px rgba(108,99,255,0.5)" : "none",
      animation: animating && !filled ? "os-pulse-dot 1.2s ease infinite" : "none",
    }} />
  );
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENT: NumKey
───────────────────────────────────────────────────────── */
function NumKey({ label, icon, onClick, variant = "default" }) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
    onClick();
  };

  const bg = {
    default: "var(--os-surface2)",
    accent:  "var(--os-accent)",
    ghost:   "transparent",
  }[variant];

  return (
    <button
      onClick={handleClick}
      style={{
        background: bg,
        border: variant === "ghost"
          ? "1.5px solid var(--os-border2)"
          : "1.5px solid var(--os-border)",
        borderRadius: "var(--os-r-md)",
        padding: "16px 0",
        fontSize: icon ? 16 : 20,
        fontWeight: 500,
        color: variant === "accent" ? "#fff" : "var(--os-text)",
        transition: "all 0.12s",
        transform: pressed ? "scale(0.92)" : "scale(1)",
        width: "100%",
      }}
    >
      {icon ? <i className={`fas ${icon}`} /> : label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   VIEW: Login
───────────────────────────────────────────────────────── */
function LoginView({ onLogin, onGuest }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");

  const pushDigit = (d) => {
    if (pin.length < 4) setPin((p) => p + d);
  };

  const del = () => setPin((p) => p.slice(0, -1));

  const confirm = () => {
    if (pin === PIN_CORRECT) {
      onLogin({ name: "Utilisateur" });
    } else {
      setShake(true);
      setError("Code incorrect");
      setPin("");
      setTimeout(() => { setShake(false); setError(""); }, 600);
    }
  };

  const keys = [
    { label: "1", d: "1" }, { label: "2", d: "2" }, { label: "3", d: "3" },
    { label: "4", d: "4" }, { label: "5", d: "5" }, { label: "6", d: "6" },
    { label: "7", d: "7" }, { label: "8", d: "8" }, { label: "9", d: "9" },
    { label: null, icon: "fa-delete-left", action: del, variant: "ghost" },
    { label: "0", d: "0" },
    { label: null, icon: "fa-check", action: confirm, variant: "accent" },
  ];

  return (
    <div className="os-fadein" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 30%, rgba(108,99,255,0.12) 0%, var(--os-bg) 65%)",
      padding: "1.5rem",
    }}>
      <div style={{ width: "100%", maxWidth: 280 }}>

        {/* Avatar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "var(--os-surface2)",
            border: "1px solid rgba(108,99,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: "var(--os-accent)",
            boxShadow: "0 0 20px rgba(108,99,255,0.1)",
          }}>
            <i className="fas fa-user-shield" />
          </div>
        </div>

        {/* Title */}
        <h1 style={{ textAlign: "center", fontSize: 18, fontWeight: 500, marginBottom: 4 }}>
          Bienvenue
        </h1>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--os-text2)", marginBottom: "1.5rem" }}>
          Entrez votre code PIN pour continuer
        </p>

        {/* PIN dots */}
        <div className={shake ? "os-shake" : ""} style={{
          display: "flex", justifyContent: "center", gap: 16, marginBottom: "0.75rem",
        }}>
          {[0, 1, 2, 3].map((i) => (
            <PinDot key={i} filled={i < pin.length} animating={pin.length === 0} />
          ))}
        </div>

        {/* Error */}
        <p style={{
          textAlign: "center", fontSize: 12,
          color: "#F87171",
          minHeight: 20, marginBottom: "1.5rem",
          transition: "opacity 0.2s",
          opacity: error ? 1 : 0,
        }}>
          {error || " "}
        </p>

        {/* Numpad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {keys.map((k, idx) => (
            <NumKey
              key={idx}
              label={k.label}
              icon={k.icon}
              variant={k.variant || "default"}
              onClick={k.action || (() => pushDigit(k.d))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENT: AppTile (grille complète)
───────────────────────────────────────────────────────── */
function AppTile({ app, onClick, size = "md" }) {
  const [hovered, setHovered] = useState(false);
  const iconClass = getAppIcon(app);
  const iconSize = size === "lg" ? 26 : size === "sm" ? 16 : 20;
  const tileSize = size === "lg" ? 72 : size === "sm" ? 44 : 56;
  const nameSize = size === "sm" ? 11 : 12;

  return (
    <div
      onClick={() => onClick(app)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: size === "sm" ? 5 : 8,
        cursor: "pointer",
        padding: size === "sm" ? "8px 4px" : "12px 8px",
        borderRadius: "var(--os-r-md)",
        background: hovered ? "var(--os-surface2)" : "transparent",
        transition: "background 0.15s, transform 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        userSelect: "none",
      }}
    >
      <div style={{
        width: tileSize, height: tileSize,
        borderRadius: size === "lg" ? "var(--os-r-lg)" : "var(--os-r-md)",
        background: hexToRgba(app.color, 0.12),
        border: `1.5px solid ${hexToRgba(app.color, hovered ? 0.35 : 0.18)}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: app.color,
        fontSize: iconSize,
        transition: "all 0.15s",
        boxShadow: hovered ? `0 4px 20px ${hexToRgba(app.color, 0.25)}` : "none",
      }}>
        <i className={`fas ${iconClass}`} />
      </div>
      <span style={{
        fontSize: nameSize,
        fontWeight: 500,
        color: hovered ? "var(--os-text)" : "var(--os-text2)",
        textAlign: "center",
        lineHeight: 1.3,
        maxWidth: tileSize + 16,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        transition: "color 0.15s",
      }}>
        {app.nom}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENT: RecentCard (historique)
───────────────────────────────────────────────────────── */
function RecentCard({ entry, onClick }) {
  const [hovered, setHovered] = useState(false);
  const iconClass = getAppIcon(entry);

  return (
    <div
      onClick={() => onClick(entry)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: "var(--os-r-md)",
        background: hovered ? "var(--os-surface2)" : "var(--os-surface)",
        border: `1px solid ${hovered ? hexToRgba(entry.color, 0.2) : "var(--os-border)"}`,
        cursor: "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
        minWidth: 180,
      }}
    >
      <div style={{
        width: 38, height: 38,
        borderRadius: "var(--os-r-sm)",
        background: hexToRgba(entry.color, 0.12),
        display: "flex", alignItems: "center", justifyContent: "center",
        color: entry.color,
        fontSize: 16,
        flexShrink: 0,
      }}>
        <i className={`fas ${iconClass}`} />
      </div>
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {entry.nom}
        </div>
        <div style={{ fontSize: 11, color: "var(--os-text3)", marginTop: 2 }}>
          {timeAgo(entry.openedAt)}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENT: SearchBar
───────────────────────────────────────────────────────── */
function SearchBar({ value, onChange }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "var(--os-surface)",
      border: "1px solid var(--os-border)",
      borderRadius: 99,
      padding: "10px 18px",
    }}>
      <i className="fas fa-magnifying-glass" style={{ color: "var(--os-text3)", fontSize: 13 }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher…"
        style={{
          flex: 1,
          background: "none",
          border: "none",
          fontSize: 14,
          color: "var(--os-text)",
          caretColor: "var(--os-accent)",
        }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{ color: "var(--os-text3)", fontSize: 12 }}>
          <i className="fas fa-xmark" />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENT: SectionLabel
───────────────────────────────────────────────────────── */
function SectionLabel({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--os-text3)" }}>
        {children}
      </span>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   VIEW: Home (recent + all apps)
───────────────────────────────────────────────────────── */
function HomeView({ apps, history, onAppClick, onClearHistory, onLogout }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home"); // "home" | "all"

  const filteredApps = useMemo(() => {
    if (!query) return apps;
    const q = query.toLowerCase();
    return apps.filter((a) => a.nom.toLowerCase().includes(q));
  }, [apps, query]);

  // Deduplicated recent apps (most recent per url)
  const recentUniq = useMemo(() => {
    const seen = new Set();
    return history.filter((h) => {
      if (seen.has(h.url)) return false;
      seen.add(h.url);
      return true;
    }).slice(0, 8);
  }, [history]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── TOP HEADER ── */}
      <div style={{
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--os-border)",
        background: "var(--os-surface)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--os-surface2)",
            border: "1px solid rgba(108,99,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "var(--os-accent)",
          }}>
            <i className="fas fa-user" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Utilisateur</div>
            <div style={{ fontSize: 10, color: "var(--os-text3)", textTransform: "capitalize" }}>{dateStr}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={onLogout}
            style={{
              background: "var(--os-surface2)",
              border: "1px solid var(--os-border)",
              borderRadius: "6px",
              padding: "5px 8px",
              fontSize: 10,
              color: "#F87171",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <i className="fas fa-right-from-bracket" />
          </button>
        </div>
      </div>

      {/* ── NAV TABS ── */}
      <div style={{
        display: "flex",
        gap: 3,
        padding: "0.75rem 1rem 0",
      }}>
        {[
          { id: "home", icon: "fa-house",        label: "Accueil" },
          { id: "all",  icon: "fa-border-all",   label: "Applications" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 500,
              color: activeTab === tab.id ? "#fff" : "var(--os-text2)",
              background: activeTab === tab.id ? "var(--os-accent)" : "transparent",
              border: "none",
              transition: "all 0.15s",
            }}
          >
            <i className={`fas ${tab.icon}`} style={{ fontSize: 10 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="os-fadein" style={{ flex: 1, padding: "1rem 1rem", overflow: "auto" }}>

        {activeTab === "home" && (
          <>
            {/* Recent section */}
            {recentUniq.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <SectionLabel
                  action={
                    <button
                      onClick={onClearHistory}
                      style={{ fontSize: 11, color: "var(--os-text3)", textDecoration: "underline" }}
                    >
                      Effacer
                    </button>
                  }
                >
                  Récemment ouverts
                </SectionLabel>

                <div style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  paddingBottom: 6,
                }}>
                  {recentUniq.map((h, i) => (
                    <RecentCard
                      key={`${h.url}-${i}`}
                      entry={h}
                      onClick={(entry) => {
                        const app = apps.find((a) => a.url === entry.url);
                        if (app) onAppClick(app);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick apps */}
            <div>
              <SectionLabel>
                Applications
              </SectionLabel>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
                gap: 4,
              }}>
                {apps.slice(0, 10).map((app) => (
                  <AppTile key={app.url} app={app} onClick={onAppClick} size="md" />
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "all" && (
          <>
            <div style={{ marginBottom: "1.25rem" }}>
              <SearchBar value={query} onChange={setQuery} />
            </div>

            {query && (
              <p style={{ fontSize: 12, color: "var(--os-text3)", marginBottom: "1rem" }}>
                {filteredApps.length} résultat{filteredApps.length !== 1 ? "s" : ""} pour « {query} »
              </p>
            )}

            {!query && (
              <div style={{ marginBottom: "2rem" }}>
                <SectionLabel>Toutes les applications</SectionLabel>
              </div>
            )}

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: 4,
            }}>
              {filteredApps.map((app) => (
                <AppTile key={app.url} app={app} onClick={onAppClick} size="md" />
              ))}
              {filteredApps.length === 0 && (
                <div style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "3rem 1rem",
                  color: "var(--os-text3)",
                  fontSize: 14,
                }}>
                  <i className="fas fa-magnifying-glass" style={{ fontSize: 28, marginBottom: 12, display: "block" }} />
                  Aucune application trouvée
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   VIEW: App Page
───────────────────────────────────────────────────────── */
function AppView({ app, onBack }) {
  const iconClass = getAppIcon(app);
  const isJSFile = app.url && (app.url.endsWith(".js") || app.url.endsWith(".jsx") || app.url.endsWith(".mjs"));
  const isURL = app.url && (app.url.startsWith("http://") || app.url.startsWith("https://"));

  return (
    <div className="os-fadein" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "0.75rem 1rem",
        background: "var(--os-surface)",
        borderBottom: "1px solid var(--os-border)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 28, height: 28,
            borderRadius: "6px",
            background: "var(--os-surface2)",
            border: "1px solid var(--os-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--os-text2)", fontSize: 11,
          }}
        >
          <i className="fas fa-chevron-left" />
        </button>

        <div style={{
          width: 24, height: 24,
          borderRadius: 6,
          background: hexToRgba(app.color, 0.15),
          display: "flex", alignItems: "center", justifyContent: "center",
          color: app.color, fontSize: 11,
        }}>
          <i className={`fas ${iconClass}`} />
        </div>

        <span style={{ fontSize: 13, fontWeight: 500 }}>{app.nom}</span>
      </div>

      {/* Content */}
      {isURL ? (
        <iframe
          src={app.url}
          title={app.nom}
          style={{ flex: 1, border: "none", width: "100%", minHeight: "calc(100vh - 60px)" }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : (
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "1.5rem",
          gap: "1rem",
        }}>
          <div style={{
            width: 70, height: 70,
            borderRadius: "var(--os-r-lg)",
            background: hexToRgba(app.color, 0.1),
            border: `1px solid ${hexToRgba(app.color, 0.2)}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: app.color, fontSize: 28,
            boxShadow: `0 0 25px ${hexToRgba(app.color, 0.1)}`,
          }}>
            <i className={`fas ${iconClass}`} />
          </div>

          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>{app.nom}</h2>
            <p style={{ fontSize: 11, color: "var(--os-text2)", maxWidth: 240, lineHeight: 1.5 }}>
              {isJSFile
                ? `Chargement du module ${app.url} en cours…`
                : "Cette application est en cours de développement."}
            </p>
          </div>

          <div style={{
            background: "var(--os-surface2)",
            border: "1px solid var(--os-border)",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: 10,
            color: "var(--os-text3)",
            fontFamily: "monospace",
            maxWidth: 280,
            wordBreak: "break-all",
            textAlign: "center",
          }}>
            {app.url}
          </div>

          <button
            onClick={onBack}
            style={{
              background: "var(--os-surface2)",
              border: "1px solid var(--os-border)",
              borderRadius: 99,
              padding: "8px 20px",
              fontSize: 11, fontWeight: 500,
              color: "var(--os-text)",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <i className="fas fa-arrow-left" /> Retour
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────── */
export default function App({ apps: appsProp }) {
  useFontAwesome();
  useGlobalCSS();

  const apps = useMemo(() => {
    if (!appsProp) return DEFAULT_APPS;
    if (typeof appsProp === "string") {
      try { return JSON.parse(appsProp); } catch { return DEFAULT_APPS; }
    }
    if (Array.isArray(appsProp) && appsProp.length > 0) return appsProp;
    return DEFAULT_APPS;
  }, [appsProp]);

  const { history, recordOpen, clearHistory } = useAppHistory();

  const [view, setView] = useState("login");   // "login" | "home" | "app"
  const [currentApp, setCurrentApp] = useState(null);

  const handleLogin = useCallback(() => setView("home"), []);
  const handleGuest = useCallback(() => setView("home"), []);
  const handleLogout = useCallback(() => { setView("login"); setCurrentApp(null); }, []);

  const handleAppClick = useCallback((app) => {
    recordOpen(app);
    setCurrentApp(app);
    setView("app");
  }, [recordOpen]);

  const handleBack = useCallback(() => { setView("home"); setCurrentApp(null); }, []);

  return (
    <div className="os-root">
      {view === "login" && (
        <LoginView onLogin={handleLogin} onGuest={handleGuest} />
      )}
      {view === "home" && (
        <HomeView
          apps={apps}
          history={history}
          onAppClick={handleAppClick}
          onClearHistory={clearHistory}
          onLogout={handleLogout}
        />
      )}
      {view === "app" && currentApp && (
        <AppView app={currentApp} onBack={handleBack} />
      )}
    </div>
  );
}
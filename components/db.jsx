const { useState, useEffect, useCallback } = React;

// ─── API LAYER ────────────────────────────────────────────────────────────────
const API_URL   = "";

async function api(method, params = {}, body = null) {
  const url = new URL(API_URL, window.location.href);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const opts = {
    method,
    headers: {
      ...(body !== null ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  };

  const res  = await fetch(url.toString(), opts);
  let data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  data = data.data;
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

const API = {
  // Single API: POST / with raw SQL or array of SQL statements
  execute: (sql) => {
    // Check if sql is an array (multiple statements) or string (single statement)
    if (Array.isArray(sql)) {
      return api("POST",{}, sql);
    } else {
      return api("POST",{}, [sql]);
    }
  },

  // Tables
  list: () => API.execute("SHOW TABLES").then(res => {
    const rows = res.data || [];
    return rows.map(row => Object.values(row)[0]); // première colonne = nom table
  }),

  describe: (table) => {
    if (!table) {
      // Lister toutes les tables avec leur structure
      return API.list().then(tables => {
        if (!tables.length) return [];
        return API.execute(tables.map(t=>`DESCRIBE \`${t}\``)).
        then((res) => {
          return res.map((r,i)=>({table: tables[i] , columns:r.data}));
        })
      });
    } else {
      // Structure d'une table spécifique
      return API.execute(`DESCRIBE \`${table}\``).then(res => ({
        table,
        columns: res.data || []
      }));
    }
  },

  create: (table) => API.execute(`SHOW CREATE TABLE \`${table}\``).then(res => {
    const row = (res.data || [])[0];
    const createTable = row ? Object.values(row)[1] : null; // CREATE TABLE
    // Ajouter IF NOT EXISTS si ce n'est pas déjà présent
    if (createTable && !createTable.includes('IF NOT EXISTS')) {
      return createTable.replace(/CREATE TABLE `/gi, 'CREATE TABLE IF NOT EXISTS `');
    }
    return createTable;
  }),

  // Rows
  rows: (table, p = {}) => {
    let sql = `SELECT * FROM \`${table}\``;
    const values = [];

    // Pagination simple
    if (p.limit) {
      sql += ` LIMIT ${parseInt(p.limit)}`;
      if (p.offset) sql += ` OFFSET ${parseInt(p.offset)}`;
    }

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM \`${table}\``;

    return Promise.all([
      API.execute(sql).then(res => ({ rows: res.data || [] })),
      API.execute(countSql).then(res => ({ total: (res.data || [])[0]?.total || 0 }))
    ]).then(([data, count]) => ({
      rows: data.rows,
      total: count.total
    }));
  },

  insertRow: (table, row) => {
    const cols = Object.keys(row);
    const vals = cols.map(col => {
      const val = row[col];
      if (val === null) return 'NULL';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      if (typeof val === 'number') return val;
      return `'${val}'`;
    });
    const sql = `INSERT INTO \`${table}\` (\`${cols.join('`,`')}\`) VALUES (${vals.join(',')})`;
    return API.execute(sql);
  },

  updateRow: (table, row) => {
    const pk = row.id; // simple: suppose 'id' comme PK
    if (!pk) throw new Error('Primary key required for update');
    const cols = Object.keys(row).filter(k => k !== 'id');
    const setClause = cols.map(col => {
      const val = row[col];
      if (val === null) return `\`${col}\` = NULL`;
      if (typeof val === 'string') return `\`${col}\` = '${val.replace(/'/g, "''")}'`;
      if (typeof val === 'number') return `\`${col}\` = ${val}`;
      return `\`${col}\` = '${val}'`;
    }).join(', ');
    const sql = `UPDATE \`${table}\` SET ${setClause} WHERE \`id\` = ${pk}`;
    return API.execute(sql);
  },

  deleteRow: (table, pk) => {
    if (!pk.id) throw new Error('Primary key required for delete');
    const sql = `DELETE FROM \`${table}\` WHERE \`id\` = ${pk.id}`;
    return API.execute(sql);
  },

  // DDL
  postCreate: (data) => {
    const columns = data.columns.map(col => {
      const parts = [];
      parts.push(`\`${col.name}\` ${col.type}`);
      if (!col.nullable) parts.push('NOT NULL');
      if (col.default !== undefined && col.default !== '') parts.push(`DEFAULT ${col.default}`);
      if (col.primary && col.auto_increment) parts.push('AUTO_INCREMENT');
      if (col.primary) parts.push('PRIMARY KEY');
      return parts.join(' ');
    }).join(', ');
    const sql = `CREATE TABLE IF NOT EXISTS \`${data.table}\` (${columns})`;
    return API.execute(sql);
  },

  dropTable: (table) => API.execute(`DROP TABLE IF EXISTS \`${table}\``),

  dropAll: () => {
    // Désactiver les checks, drop toutes, réactiver
    return API.list().then(tables => {
      const sql = `
        SET FOREIGN_KEY_CHECKS = 0;
        ${tables.map(t => `DROP TABLE IF EXISTS \`${t}\`;`).join('\n')}
        SET FOREIGN_KEY_CHECKS = 1;
      `;
      return API.execute(sql);
    });
  },

  truncate: (table) => {
    // Exécuter chaque instruction séparément pour éviter les problèmes de multi-requêtes
    const commands = [
      'SET FOREIGN_KEY_CHECKS = 0',
      `TRUNCATE TABLE \`${table}\``,
      'SET FOREIGN_KEY_CHECKS = 1'
    ];
    return API.execute(commands);
  },

  initDb: (path) => {
    // Suppose que le front peut lire le fichier SQL et l'envoyer
    // Sinon, il faudrait un endpoint dédié
    throw new Error('initDb requires file reading capability');
  },

  // Structure modification
  addColumn: (data) => {
    const sql = `ALTER TABLE \`${data.table}\` ADD COLUMN \`${data.column}\` ${data.definition}`;
    return API.execute(sql);
  },

  dropColumn: (table, column) => API.execute(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``),

  modifyColumn: (data) => {
    const sql = `ALTER TABLE \`${data.table}\` MODIFY COLUMN \`${data.column}\` ${data.definition}`;
    return API.execute(sql);
  },

  // Foreign keys
  getForeignKeys: (table) => {
    const sql = `
      SELECT 
        CONSTRAINT_NAME, 
        COLUMN_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${table}' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `;
    return API.execute(sql).then(res => res.data || []);
  },

  addForeignKey: (data) => {
    const sql = `
      ALTER TABLE \`${data.table}\` 
      ADD CONSTRAINT \`${data.constraint_name}\` 
      FOREIGN KEY (\`${data.column}\`) 
      REFERENCES \`${data.referenced_table}\`(\`${data.referenced_column}\`)
    `;
    return API.execute(sql);
  },

  dropForeignKey: (table, constraint) => {
    const sql = `ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraint}\``;
    return API.execute(sql);
  }
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
const TYPES = [
  "INT","BIGINT","TINYINT","SMALLINT","FLOAT","DOUBLE","BOOLEAN",
  "VARCHAR(255)","VARCHAR(100)","VARCHAR(50)","CHAR(1)","CHAR(36)",
  "TEXT","MEDIUMTEXT","LONGTEXT",
  "DATE","DATETIME","TIMESTAMP",
  "DECIMAL(10,2)","DECIMAL(18,4)",
];

function cls(...args) { return args.filter(Boolean).join(" "); }

// ─── TOAST ───────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, success: msg => add(msg, "success"), error: msg => add(msg, "error"), info: msg => add(msg, "info") };
}

function Toasts({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={cls(
          "px-4 py-3 rounded-lg text-sm font-medium shadow-lg border pointer-events-auto",
          "animate-[slideIn_0.2s_ease] max-w-xs",
          t.type === "success" && "bg-emerald-950 border-emerald-700 text-emerald-300",
          t.type === "error"   && "bg-red-950   border-red-700   text-red-300",
          t.type === "info"    && "bg-sky-950    border-sky-700    text-sky-300",
        )}>
          {t.type === "success" && <i className="fas fa-check mr-1"></i>}
          {t.type === "error" && <i className="fas fa-times mr-1"></i>}
          {t.type === "info" && <i className="fas fa-info-circle mr-1"></i>}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-red-400 font-semibold mb-2">Confirmation requise</div>
        <p className="text-zinc-300 text-sm mb-5 leading-relaxed">{msg}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">Annuler</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors font-medium">Confirmer</button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-40 backdrop-blur-sm overflow-y-auto py-8">
      <div className={cls("bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl mx-4 w-full", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-sm tracking-wide">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 text-lg leading-none transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const t = (type ?? "").toUpperCase();
  const color =
    t.includes("INT") || t.includes("DECIMAL") || t.includes("FLOAT") || t.includes("DOUBLE") ? "bg-violet-950 text-violet-300 border-violet-800" :
    t.includes("VARCHAR") || t.includes("CHAR") || t.includes("TEXT") ? "bg-sky-950 text-sky-300 border-sky-800" :
    t.includes("DATE") || t.includes("TIME") ? "bg-amber-950 text-amber-300 border-amber-800" :
    t.includes("BOOL") ? "bg-emerald-950 text-emerald-300 border-emerald-800" :
    "bg-zinc-800 text-zinc-400 border-zinc-700";
  return <span className={cls("text-[10px] font-mono px-1.5 py-0.5 rounded border", color)}>{type}</span>;
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────
function Spinner({ sm }) {
  return (
    <span className={cls("inline-block border-2 border-zinc-600 border-t-white rounded-full animate-spin", sm ? "w-3.5 h-3.5" : "w-5 h-5")} />
  );
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs text-zinc-400 mb-1 font-medium">{label}</label>}
      <input
        {...props}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors"
      />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs text-zinc-400 mb-1 font-medium">{label}</label>}
      <select
        {...props}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

function Checkbox({ label, ...props }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" {...props} className="w-4 h-4 accent-sky-500 cursor-pointer" />
      <span className="text-xs text-zinc-400">{label}</span>
    </label>
  );
}

// ─── BTN ─────────────────────────────────────────────────────────────────────
function Btn({ children, variant = "default", size = "md", loading, className, ...props }) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-lg transition-all focus:outline-none disabled:opacity-40";
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    default:  "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700",
    primary:  "bg-sky-600   text-white   hover:bg-sky-500",
    danger:   "bg-red-600   text-white   hover:bg-red-500",
    ghost:    "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
    success:  "bg-emerald-700 text-white hover:bg-emerald-600",
  };
  return (
    <button {...props} disabled={loading || props.disabled} className={cls(base, sizes[size], variants[variant], className)}>
      {loading && <Spinner sm />}{children}
    </button>
  );
}

// ─── CREATE TABLE MODAL ───────────────────────────────────────────────────────
function CreateTableModal({ onClose, onDone, toast }) {
  const [name, setName]   = useState("");
  const [cols, setCols]   = useState([{ name: "", type: "INT", nullable: false, primary: true, auto_increment: true, default: "" }]);
  const [busy, setBusy]   = useState(false);

  const addCol = () => setCols(c => [...c, { name: "", type: "VARCHAR(255)", nullable: true, primary: false, auto_increment: false, default: "" }]);
  const remCol = i => setCols(c => c.filter((_, j) => j !== i));
  const setCol = (i, k, v) => setCols(c => c.map((col, j) => j === i ? { ...col, [k]: v } : col));

  async function submit() {
    if (!name.trim()) return toast.error("Nom de table requis");
    if (cols.some(c => !c.name.trim())) return toast.error("Noms de colonnes requis");
    setBusy(true);
    try {
      await API.postCreate({ table: name.trim(), columns: cols.map(c => ({ ...c, default: c.default || undefined })) });
      toast.success(`Table « ${name} » créée`);
      onDone();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Créer une table" onClose={onClose} wide>
      <div className="space-y-4">
        <Input label="Nom de la table" value={name} onChange={e => setName(e.target.value)} placeholder="ex: users" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Colonnes</span>
            <Btn size="sm" onClick={addCol}>
              <i className="fas fa-plus"></i> Colonne
            </Btn>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {cols.map((col, i) => (
              <div key={i} className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="nom_colonne" value={col.name} onChange={e => setCol(i, "name", e.target.value)} />
                  <Select value={col.type} onChange={e => setCol(i, "type", e.target.value)}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </Select>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <Checkbox label="Nullable"       checked={col.nullable}       onChange={e => setCol(i, "nullable",       e.target.checked)} />
                  <Checkbox label="Primary key"    checked={col.primary}        onChange={e => setCol(i, "primary",        e.target.checked)} />
                  <Checkbox label="Auto increment" checked={col.auto_increment} onChange={e => setCol(i, "auto_increment", e.target.checked)} />
                  <div className="ml-auto">
                    <input placeholder="Défaut" value={col.default} onChange={e => setCol(i, "default", e.target.value)}
                      className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-200 w-28 focus:outline-none focus:border-sky-500" />
                  </div>
                  {cols.length > 1 && (
                    <button onClick={() => remCol(i)} className="text-red-500 hover:text-red-400 text-xs ml-1">
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Btn onClick={onClose}>
            <i className="fas fa-times"></i> Annuler
          </Btn>
          <Btn variant="primary" loading={busy} onClick={submit}>
            <i className="fas fa-check"></i> Créer
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── SCHEMA VIEWER ───────────────────────────────────────────────────────────
function SchemaModal({ table, onClose }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    API.create(table).then(setData).finally(() => setBusy(false));
  }, [table]);

  const copyToClipboard = () => {
    if (data) {
      navigator.clipboard.writeText(data).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <Modal title={`DDL — ${table}`} onClose={onClose} wide>
      {busy ? <div className="flex justify-center py-8"><Spinner /></div> : (
        <div className="relative">
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 text-xs p-2 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-500 transition-all flex items-center gap-2"
          >
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
            {copied ? 'Copié!' : 'Copier'}
          </button>
          <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-emerald-300 font-mono overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed">
            {data ?? ""}
          </pre>
        </div>
      )}
    </Modal>
  );
}

// ─── INIT DB MODAL ────────────────────────────────────────────────────────────
function InitDbModal({ onClose, onDone, toast }) {
  const [sql, setSql] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  
  // Parse et exécute les requêtes SQL
  async function executeQueries() {
    if (!sql.trim()) {
      toast.error("Le contenu SQL est requis");
      return;
    }
    
    setBusy(true);
    setResults([]);
    
    try {
      // Découper les requêtes SQL en séparant par ; et en ignorant les commentaires
      const queries = sql
        .replace(/^--.*$/gm, '')  // Retirer les lignes commençant par --
        .split(/;\s*\n/)
        .map(q => q.trim())
        .filter(q => q && !q.startsWith('#'));
      
      if (queries.length === 0) {
        toast.error("Aucune requête SQL valide trouvée");
        return;
      }
      
      const queryResults = [];
      
      const results = await API.execute(queries);
      
      queries.forEach((query, i) => {
        const result = results[i];
        if (result.error) {
          queryResults.push({
            query,
            success: false,
            error: result.error,
            message: `Erreur dans la requête ${i + 1}`
          });
        } else {
          queryResults.push({
            query,
            success: true,
            data: result.data || [],
            message: result.message || `Requête ${i + 1} exécutée avec succès`,
            rowCount: result.data?.length || 0
          });
        }
      });
      
      setResults(queryResults);
      setShowResults(true);
      setActiveTab('results');
      
      const successCount = queryResults.filter(r => r.success).length;
      const errorCount = queryResults.filter(r => !r.success).length;
      
      if (errorCount === 0) {
        toast.success(`${successCount} requête${successCount > 1 ? 's' : ''} exécutée${successCount > 1 ? 's' : ''} avec succès`);
      } else {
        toast.warning(`${successCount} succès, ${errorCount} erreur${errorCount > 1 ? 's' : ''}`);
      }
      
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  
  async function submit() {
    await executeQueries();
  }
  
  function clearAll() {
    setSql("");
    setResults([]);
    setShowResults(false);
    setActiveTab('editor');
  }
  
  return (
    <Modal title="Gestionnaire de requêtes SQL" onClose={onClose} wide>
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <i className="fas fa-code mr-2"></i>
            Éditeur SQL
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'results'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
            disabled={results.length === 0}
          >
            <i className="fas fa-list mr-2"></i>
            Résultats ({results.length})
          </button>
        </div>
        
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="space-y-4">
            <div className="bg-sky-950/40 border border-sky-800/40 rounded-lg px-4 py-3 text-xs text-sky-300">
              <i className="fas fa-info-circle mr-1"></i>
              Exécute du SQL brut. Les requêtes multiples sont supportées (séparées par ;). Les résultats s'affichent dans l'onglet Résultats.
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-2 font-medium">Contenu SQL</label>
              <textarea
                value={sql}
                onChange={e => setSql(e.target.value)}
                placeholder="CREATE TABLE users (&#10;  id INT PRIMARY KEY AUTO_INCREMENT,&#10;  name VARCHAR(255) NOT NULL&#10;);&#10;&#10;INSERT INTO users (name) VALUES ('John');&#10;SELECT * FROM users;"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors font-mono resize-none"
                rows={12}
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Btn onClick={clearAll} variant="ghost">
                  <i className="fas fa-eraser"></i> Effacer
                </Btn>
              </div>
              <div className="flex gap-2">
                <Btn onClick={onClose}>
                  <i className="fas fa-times"></i> Annuler
                </Btn>
                <Btn variant="success" loading={busy} onClick={submit}>
                  <i className="fas fa-play"></i> Exécuter
                </Btn>
              </div>
            </div>
          </div>
        )}
        
        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-zinc-300">
                {results.length} requête{results.length > 1 ? 's' : ''} exécutée{results.length > 1 ? 's' : ''}
              </h3>
              <button
                onClick={() => setActiveTab('editor')}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                <i className="fas fa-arrow-left mr-1"></i>
                Retour à l'éditeur
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className={`border rounded-lg p-3 ${
                  result.success 
                    ? 'bg-emerald-950/20 border-emerald-800/50' 
                    : 'bg-red-950/20 border-red-800/50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <i className={`fas ${result.success ? 'fa-check-circle text-emerald-400' : 'fa-exclamation-circle text-red-400'}`}></i>
                      <span className="text-xs font-medium text-zinc-300">
                        Requête {index + 1}
                      </span>
                      {result.success && result.rowCount > 0 && (
                        <span className="text-xs text-zinc-500">
                          ({result.rowCount} ligne{result.rowCount > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.query)}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                  
                  {/* Query */}
                  <div className="mb-2">
                    <code className="text-xs text-zinc-400 font-mono bg-zinc-900 px-2 py-1 rounded block overflow-x-auto">
                      {result.query}
                    </code>
                  </div>
                  
                  {/* Message */}
                  <div className={`text-xs mb-2 ${
                    result.success ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    {result.message}
                  </div>
                  
                  {/* Error */}
                  {!result.success && (
                    <div className="text-xs text-red-400 bg-red-950/30 px-2 py-1 rounded">
                      {result.error}
                    </div>
                  )}
                  
                  {/* Data results */}
                  {result.success && result.data && result.data.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-zinc-500 mb-1">Résultats :</div>
                      <div className="bg-zinc-900 rounded border border-zinc-700 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-zinc-800">
                            <tr>
                              {Object.keys(result.data[0]).map(key => (
                                <th key={key} className="px-2 py-1 text-left font-medium text-zinc-300">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.data.slice(0, 10).map((row, i) => (
                              <tr key={i} className="border-t border-zinc-800">
                                {Object.values(row).map((value, j) => (
                                  <td key={j} className="px-2 py-1 text-zinc-400">
                                    {value === null ? (
                                      <span className="text-zinc-600 italic">NULL</span>
                                    ) : typeof value === 'string' ? (
                                      <span className="truncate max-w-[200px] block">{value}</span>
                                    ) : (
                                      String(value)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {result.data.length > 10 && (
                          <div className="text-xs text-zinc-500 px-2 py-1 bg-zinc-800">
                            ... et {result.data.length - 10} autres lignes
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Btn onClick={clearAll} variant="ghost">
                <i className="fas fa-eraser"></i> Nouvelle requête
              </Btn>
              <Btn onClick={onClose}>
                <i className="fas fa-times"></i> Fermer
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── ROW FORM MODAL ───────────────────────────────────────────────────────────
function RowFormModal({ table, describe, editRow, onClose, onDone, toast }) {
  const isEdit = !!editRow;
  const pkCols = describe.filter(c => c.Key === "PRI").map(c => c.Field);

  const initial = {};
  describe.forEach(col => {
    initial[col.Field] = isEdit ? (editRow[col.Field] ?? "") : (col.Default ?? "");
  });

  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      // Filtrer les champs vides pour éviter d'envoyer "" pour les colonnes numériques/auto_increment
      const cleanedForm = {};
      Object.keys(form).forEach(key => {
        const value = form[key];
        if (value !== "" && value !== null && value !== undefined) {
          cleanedForm[key] = value;
        }
      });

      if (isEdit) {
        await API.updateRow(table, cleanedForm);
        toast.success("Ligne mise à jour");
      } else {
        await API.insertRow(table, cleanedForm);
        toast.success("Ligne insérée");
      }
      onDone();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  const fieldsToDisplay = describe.filter(col => {
    const isAuto = (col.Extra ?? "").includes("auto_increment");
    if (showAllFields) return true;
    if (isAuto) return false;
    return col.Null === 'NO';
  });

  return (
    <Modal title={isEdit ? `Modifier — ${table}` : `Insérer dans ${table}`} onClose={onClose}>
      <div className="mb-3 flex items-center justify-between pb-3 border-b border-zinc-800">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showAllFields}
            onChange={e => setShowAllFields(e.target.checked)}
            className="w-4 h-4 accent-sky-500 cursor-pointer"
          />
          <span className="text-xs text-zinc-400">
            Afficher tous les champs ({describe.length})
          </span>
        </label>
        {!showAllFields && (
          <span className="text-[10px] text-zinc-600">
            {fieldsToDisplay.length} champ{fieldsToDisplay.length !== 1 ? 's' : ''} requis
          </span>
        )}
      </div>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {fieldsToDisplay.map(col => {
          const isPk   = pkCols.includes(col.Field);
          const isRequired = col.Null === 'NO';
          const isEnum = col.Type.startsWith('enum(');
          const enumValues = isEnum ? col.Type.match(/enum\((.*)\)/)?.[1]?.split(',').map(v => v.trim().replace(/^'|'$/g, '')) : [];
          
          return (
            <div key={col.Field}>
              <label className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-zinc-400">{col.Field}</span>
                <TypeBadge type={col.Type} />
                {isPk && <span className="text-[10px] text-amber-400 font-semibold">PK</span>}
                {isRequired && !isPk && <span className="text-[10px] text-red-400 font-semibold">*</span>}
              </label>
              {isEnum ? (
                <select
                  value={form[col.Field] ?? ""}
                  onChange={e => setForm(f => ({ ...f, [col.Field]: e.target.value }))}
                  disabled={isPk && isEdit}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {col.Null === 'YES' && <option value="">-- Sélectionner --</option>}
                  {enumValues.map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={form[col.Field] ?? ""}
                  onChange={e => setForm(f => ({ ...f, [col.Field]: e.target.value }))}
                  disabled={isPk && isEdit}
                  placeholder={col.Default ?? ""}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 pt-4 mt-1 border-t border-zinc-800">
        <Btn onClick={onClose}>
          <i className="fas fa-times"></i> Annuler
        </Btn>
        <Btn variant="primary" loading={busy} onClick={submit}>
          {isEdit ? <><i className="fas fa-save"></i> Mettre à jour</> : <><i className="fas fa-plus"></i> Insérer</>}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── TABLE DATA VIEW ─────────────────────────────────────────────────────────
function TableDataView({ table, toast, tables }) {
  // ... rest of the code remains the same ...
  const [describe, setDescribe] = useState([]);
  const [rows,     setRows]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [offset,   setOffset]   = useState(0);
  const [limit]                 = useState(50);
  const [orderBy,  setOrderBy]  = useState("");
  const [orderDir, setOrderDir] = useState("ASC");
  const [busy,     setBusy]     = useState(false);
  const [editRow,  setEditRow]  = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [showSchema, setShowSchema] = useState(false);
  const [showStructure, setShowStructure] = useState(false);

  const pkCols = describe.filter(c => c.Key === "PRI").map(c => c.Field);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [desc, rowsRes] = await Promise.all([
        API.describe(table),
        API.rows(table, { limit, offset, order_by: orderBy, order_dir: orderDir }),
      ]);
      setDescribe(desc.columns ?? []);
      setRows(rowsRes.rows ?? []);
      setTotal(rowsRes.total ?? 0);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  }, [table, offset, limit, orderBy, orderDir]);

  useEffect(() => { setOffset(0); }, [table]);
  useEffect(() => { load(); }, [load]);

  function toggleOrder(col) {
    if (orderBy === col) setOrderDir(d => d === "ASC" ? "DESC" : "ASC");
    else { setOrderBy(col); setOrderDir("ASC"); }
  }

  async function deleteRow(row) {
    const pk = {};
    pkCols.forEach(k => { pk[k] = row[k]; });
    try {
      await API.deleteRow(table, pk);
      toast.success("Ligne supprimée");
      load();
    } catch (e) { toast.error(e.message); }
  }

  const pages  = Math.ceil(total / limit);
  const curPage = Math.floor(offset / limit) + 1;
  const cols   = describe.map(c => c.Field);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Btn size="sm" variant="primary" onClick={() => { setEditRow(null); setShowForm(true); }}>
          <i className="fas fa-plus"></i> Insérer
        </Btn>
        <Btn size="sm" onClick={() => setShowStructure(true)}>
          <i className="fas fa-table"></i> Structure
        </Btn>
        <Btn size="sm" onClick={() => setShowSchema(true)}>
          <i className="fas fa-code"></i> DDL
        </Btn>
        <div className="flex-1" />
        <span className="text-xs text-zinc-500">{total} ligne{total !== 1 ? "s" : ""}</span>
        {busy && <Spinner sm />}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-950/50">
        <table className="w-full text-xs min-w-max">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0">
              {cols.map(col => {
                const isPk  = pkCols.includes(col);
                const isSorted = orderBy === col;
                return (
                  <th key={col} onClick={() => toggleOrder(col)}
                    className="px-3 py-2.5 text-left font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer select-none whitespace-nowrap group transition-colors">
                    <span className="flex items-center gap-1">
                      {isPk && <i className="fas fa-key text-amber-500 mr-1"></i>}
                      {col}
                      <span className={cls("transition-opacity", isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-50")}>
                        {isSorted ? (orderDir === "ASC" ? <i className="fas fa-arrow-up ml-1"></i> : <i className="fas fa-arrow-down ml-1"></i>) : <i className="fas fa-sort ml-1"></i>}
                      </span>
                    </span>
                  </th>
                );
              })}
              <th className="px-3 py-2.5 text-right font-semibold text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length + 1} className="text-center py-12 text-zinc-600 text-sm">Aucune donnée</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                {cols.map(col => (
                  <td key={col} className="px-3 py-2 text-zinc-300 font-mono max-w-[200px] truncate">
                    {row[col] === null ? <span className="text-zinc-600 italic">NULL</span> : String(row[col])}
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                    <Btn size="sm" onClick={() => { setEditRow(row); setShowForm(true); }}>
                      <i className="fas fa-edit"></i>
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => setConfirm({
                      msg: `Supprimer cette ligne de « ${table} » ?`,
                      onConfirm: () => { setConfirm(null); deleteRow(row); },
                    })}>
                      <i className="fas fa-trash"></i>
                    </Btn>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-zinc-500">Page {curPage} / {pages}</span>
          <div className="flex gap-1">
            <Btn size="sm" disabled={offset === 0} onClick={() => setOffset(0)}>
              <i className="fas fa-angle-double-left"></i>
            </Btn>
            <Btn size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - limit))}>
              <i className="fas fa-angle-left"></i>
            </Btn>
            <Btn size="sm" disabled={curPage >= pages} onClick={() => setOffset(o => o + limit)}>
              <i className="fas fa-angle-right"></i>
            </Btn>
            <Btn size="sm" disabled={curPage >= pages} onClick={() => setOffset((pages - 1) * limit)}>
              <i className="fas fa-angle-double-right"></i>
            </Btn>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSchema && <SchemaModal table={table} onClose={() => setShowSchema(false)} />}
      {showStructure && (
        <TableStructureModal
          table={table}
          describe={describe}
          tables={tables}
          onClose={() => setShowStructure(false)}
          onDone={() => { setShowStructure(false); load(); }}
          toast={toast}
        />
      )}
      {showForm && (
        <RowFormModal
          table={table} describe={describe} editRow={editRow}
          onClose={() => setShowForm(false)}
          onDone={() => { setShowForm(false); load(); }}
          toast={toast}
        />
      )}
      {confirm && <ConfirmModal msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── TABLE STRUCTURE MODAL ───────────────────────────────────────────────────
function TableStructureModal({ table, describe, tables, onClose, onDone, toast }) {
  const [activeTab, setActiveTab] = useState('columns');
  const [columns, setColumns] = useState([]);
  const [foreignKeys, setForeignKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [showAddFK, setShowAddFK] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnForm, setColumnForm] = useState({});
  const [fkForm, setFkForm] = useState({});
  const [refColumns, setRefColumns] = useState([]);

  const TYPES = [
    "INT","BIGINT","TINYINT","SMALLINT","FLOAT","DOUBLE","BOOLEAN",
    "VARCHAR(255)","VARCHAR(100)","VARCHAR(50)","CHAR(1)","CHAR(36)",
    "TEXT","MEDIUMTEXT","LONGTEXT",
    "DATE","DATETIME","TIMESTAMP",
    "DECIMAL(10,2)","DECIMAL(18,4)",
  ];

  useEffect(() => {
    setColumns(describe || []);
    loadForeignKeys();
  }, [describe]);

  async function loadForeignKeys() {
    setLoading(true);
    try {
      const fks = await API.getForeignKeys(table);
      setForeignKeys(fks);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddColumn() {
    if (!columnForm.name || !columnForm.type) {
      toast.error("Nom et type requis");
      return;
    }
    setLoading(true);
    try {
      await API.addColumn({
        table,
        column: columnForm.name,
        definition: `${columnForm.type}${columnForm.nullable ? '' : ' NOT NULL'}${columnForm.default ? ` DEFAULT ${columnForm.default}` : ''}`,
      });
      toast.success("Colonne ajoutée");
      setShowAddColumn(false);
      setColumnForm({});
      onDone();
    } catch (e) {
      console.error(e); // Add this line
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleModifyColumn() {
    if (!columnForm.old_name || !columnForm.new_name || !columnForm.type) {
      toast.error("Tous les champs sont requis");
      return;
    }
    setLoading(true);
    try {
      await API.modifyColumn({
        table,
        column: columnForm.old_name,
        definition: `${columnForm.new_name} ${columnForm.type}${columnForm.nullable ? '' : ' NOT NULL'}${columnForm.default ? ` DEFAULT ${columnForm.default}` : ''}`,
      });
      toast.success("Colonne modifiée");
      setShowEditColumn(false);
      setEditingColumn(null);
      setColumnForm({});
      onDone();
    } catch (e) {
      console.error(e); // Add this line
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDropColumn(columnName) {
    if (!confirm(`Supprimer la colonne "${columnName}" ?`)) return;
    setLoading(true);
    try {
      await API.dropColumn(table, columnName);
      toast.success("Colonne supprimée");
      onDone();
    } catch (e) {
      console.error(e); // Add this line
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddForeignKey() {
    if (!fkForm.column || !fkForm.ref_table || !fkForm.ref_column) {
      toast.error("Tous les champs sont requis");
      return;
    }
    setLoading(true);
    try {
      await API.addForeignKey({
        table,
        column: fkForm.column,
        ref_table: fkForm.ref_table,
        ref_column: fkForm.ref_column,
        name: fkForm.name || `fk_${table}_${fkForm.column}`,
        on_update: fkForm.on_update || 'CASCADE',
        on_delete: fkForm.on_delete || 'CASCADE',
      });
      toast.success("Clé étrangère ajoutée");
      setShowAddFK(false);
      setFkForm({});
      loadForeignKeys();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDropFK(constraint) {
    if (!confirm(`Supprimer la clé étrangère "${constraint}" ?`)) return;
    setLoading(true);
    try {
      await API.dropForeignKey(table, constraint);
      toast.success("Clé étrangère supprimée");
      loadForeignKeys();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRefTableColumns(refTable) {
    try {
      const desc = await API.describe(refTable);
      setRefColumns(desc.columns || []);
    } catch (e) {
      toast.error(e.message);
    }
  }

  function openEditColumn(col) {
    setEditingColumn(col);
    setColumnForm({
      old_name: col.Field,
      new_name: col.Field,
      type: col.Type.toUpperCase(),
      nullable: col.Null === 'YES',
      default: col.Default || '',
    });
    setShowEditColumn(true);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-40 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl mx-4 w-full max-w-4xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-sm tracking-wide">
            Structure — {table}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 text-lg leading-none transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-5">
          <button
            onClick={() => setActiveTab('columns')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'columns'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <i className="fas fa-columns mr-2"></i>
            Colonnes
          </button>
          <button
            onClick={() => setActiveTab('foreign_keys')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'foreign_keys'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <i className="fas fa-link mr-2"></i>
            Clés étrangères
          </button>
        </div>

        <div className="p-5">
          {/* Columns Tab */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-zinc-300">
                  {columns.length} colonne{columns.length !== 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => { setColumnForm({}); setShowAddColumn(true); }}
                  className="px-3 py-1.5 text-xs bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
                >
                  <i className="fas fa-plus mr-1"></i>
                  Ajouter une colonne
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-800/50 border-b border-zinc-700">
                    <tr>
                      <th className="text-left p-2 font-semibold text-zinc-400">Nom</th>
                      <th className="text-left p-2 font-semibold text-zinc-400">Type</th>
                      <th className="text-left p-2 font-semibold text-zinc-400">Null</th>
                      <th className="text-left p-2 font-semibold text-zinc-400">Clé</th>
                      <th className="text-left p-2 font-semibold text-zinc-400">Défaut</th>
                      <th className="text-left p-2 font-semibold text-zinc-400">Extra</th>
                      <th className="text-right p-2 font-semibold text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((col, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="p-2 font-mono text-zinc-300">{col.Field}</td>
                        <td className="p-2 text-zinc-400">{col.Type}</td>
                        <td className="p-2 text-zinc-400">{col.Null}</td>
                        <td className="p-2">
                          {col.Key === 'PRI' && <span className="text-amber-500"><i className="fas fa-key"></i></span>}
                          {col.Key === 'UNI' && <span className="text-blue-500"><i className="fas fa-star"></i></span>}
                          {col.Key === 'MUL' && <span className="text-green-500"><i className="fas fa-link"></i></span>}
                        </td>
                        <td className="p-2 text-zinc-500 font-mono text-[10px]">{col.Default || '-'}</td>
                        <td className="p-2 text-zinc-500 text-[10px]">{col.Extra || '-'}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => openEditColumn(col)}
                            className="px-2 py-1 text-sky-500 hover:bg-sky-950 rounded transition-colors mr-1"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {col.Key !== 'PRI' && (
                            <button
                              onClick={() => handleDropColumn(col.Field)}
                              className="px-2 py-1 text-red-500 hover:bg-red-950 rounded transition-colors"
                              disabled={loading}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Foreign Keys Tab */}
          {activeTab === 'foreign_keys' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-zinc-300">
                  {foreignKeys.length} clé{foreignKeys.length !== 1 ? 's' : ''} étrangère{foreignKeys.length !== 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => { setFkForm({}); setShowAddFK(true); }}
                  className="px-3 py-1.5 text-xs bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
                >
                  <i className="fas fa-plus mr-1"></i>
                  Ajouter une clé étrangère
                </button>
              </div>

              {foreignKeys.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 text-sm">
                  Aucune clé étrangère définie
                </div>
              ) : (
                <div className="space-y-2">
                  {foreignKeys.map((fk, i) => (
                    <div key={i} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-mono text-xs text-zinc-400 mb-1">{fk.CONSTRAINT_NAME}</div>
                          <div className="text-sm text-zinc-300">
                            <code className="bg-zinc-900 px-1.5 py-0.5 rounded">{fk.COLUMN_NAME}</code>
                            <i className="fas fa-arrow-right mx-2 text-zinc-600"></i>
                            <code className="bg-zinc-900 px-1.5 py-0.5 rounded">{fk.REFERENCED_TABLE_NAME}.{fk.REFERENCED_COLUMN_NAME}</code>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-1">
                            ON UPDATE: {fk.on_update} | ON DELETE: {fk.on_delete}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDropFK(fk.CONSTRAINT_NAME)}
                          className="px-2 py-1 text-red-500 hover:bg-red-950 rounded transition-colors"
                          disabled={loading}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Column Modal */}
        {showAddColumn && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-w-md w-full mx-4">
              <h4 className="font-semibold mb-3 text-white">Ajouter une colonne</h4>
              <div className="space-y-3">
                <input
                  placeholder="Nom de la colonne"
                  value={columnForm.name || ''}
                  onChange={e => setColumnForm({...columnForm, name: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                />
                <select
                  value={columnForm.type || 'VARCHAR(255)'}
                  onChange={e => setColumnForm({...columnForm, type: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                >
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  placeholder="Valeur par défaut (optionnel)"
                  value={columnForm.default || ''}
                  onChange={e => setColumnForm({...columnForm, default: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                />
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={columnForm.nullable ?? true}
                    onChange={e => setColumnForm({...columnForm, nullable: e.target.checked})}
                    className="accent-sky-500"
                  />
                  Nullable
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowAddColumn(false)}
                  className="flex-1 px-3 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddColumn}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-500 text-sm"
                >
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Column Modal */}
        {showEditColumn && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-w-md w-full mx-4">
              <h4 className="font-semibold mb-3 text-white">Modifier la colonne</h4>
              <div className="space-y-3">
                <input
                  placeholder="Nouveau nom"
                  value={columnForm.new_name || ''}
                  onChange={e => setColumnForm({...columnForm, new_name: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                />
                <select
                  value={columnForm.type || 'VARCHAR(255)'}
                  onChange={e => setColumnForm({...columnForm, type: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                >
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  placeholder="Valeur par défaut"
                  value={columnForm.default || ''}
                  onChange={e => setColumnForm({...columnForm, default: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                />
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={columnForm.nullable ?? true}
                    onChange={e => setColumnForm({...columnForm, nullable: e.target.checked})}
                    className="accent-sky-500"
                  />
                  Nullable
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setShowEditColumn(false); setEditingColumn(null); }}
                  className="flex-1 px-3 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleModifyColumn}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-500 text-sm"
                >
                  {loading ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Foreign Key Modal */}
        {showAddFK && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-w-md w-full mx-4">
              <h4 className="font-semibold mb-3 text-white">Ajouter une clé étrangère</h4>
              <div className="space-y-3">
                <select
                  value={fkForm.column || ''}
                  onChange={e => setFkForm({...fkForm, column: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">Sélectionner une colonne</option>
                  {columns.map(col => (
                    <option key={col.Field} value={col.Field}>{col.Field}</option>
                  ))}
                </select>
                <select
                  value={fkForm.ref_table || ''}
                  onChange={e => {
                    setFkForm({...fkForm, ref_table: e.target.value, ref_column: ''});
                    loadRefTableColumns(e.target.value);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">Table de référence</option>
                  {tables.filter(t => t !== table).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={fkForm.ref_column || ''}
                  onChange={e => setFkForm({...fkForm, ref_column: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                  disabled={!fkForm.ref_table}
                >
                  <option value="">Colonne de référence</option>
                  {refColumns.map(col => (
                    <option key={col.Field} value={col.Field}>{col.Field}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={fkForm.on_update || 'CASCADE'}
                    onChange={e => setFkForm({...fkForm, on_update: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="CASCADE">ON UPDATE CASCADE</option>
                    <option value="SET NULL">ON UPDATE SET NULL</option>
                    <option value="RESTRICT">ON UPDATE RESTRICT</option>
                    <option value="NO ACTION">ON UPDATE NO ACTION</option>
                  </select>
                  <select
                    value={fkForm.on_delete || 'CASCADE'}
                    onChange={e => setFkForm({...fkForm, on_delete: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="CASCADE">ON DELETE CASCADE</option>
                    <option value="SET NULL">ON DELETE SET NULL</option>
                    <option value="RESTRICT">ON DELETE RESTRICT</option>
                    <option value="NO ACTION">ON DELETE NO ACTION</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setShowAddFK(false); setRefColumns([]); }}
                  className="flex-1 px-3 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddForeignKey}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-500 text-sm"
                >
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ tables, active, onSelect, onRefresh, onCreateTable, onDropTable, onDropAll, onTruncate, onInitDb ,onExportSchema}) {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800 h-full">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center gap-2">
        <i className="fas fa-database text-lg text-sky-400"></i>
        <span className="text-sm font-semibold text-zinc-100 tracking-wide">DB Manager</span>
      </div>

      {/* Actions */}
      <div className="px-3 py-3 space-y-1 border-b border-zinc-800">
        <Btn size="sm" variant="primary" className="w-full justify-center" onClick={onCreateTable}>
          <i className="fas fa-plus"></i> Nouvelle table
        </Btn>
        <Btn size="sm" className="w-full justify-center" onClick={onInitDb}>
          <i className="fas fa-terminal"></i> Requêtes SQL
        </Btn>
        <Btn size="sm" className="w-full justify-center" onClick={onExportSchema}>
          <i className="fas fa-file-export"></i> Exporter DDL
        </Btn>
        <Btn size="sm" className="w-full justify-center" onClick={onRefresh}>
          <i className="fas fa-sync"></i> Rafraîchir
        </Btn>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto py-2">
        {tables.length === 0 ? (
          <p className="text-xs text-zinc-600 px-4 py-3">Aucune table</p>
        ) : tables.map(t => (
          <div key={t} className={cls(
            "group flex items-center justify-between px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors",
            active === t ? "bg-sky-600/20 text-sky-300" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          )} onClick={() => onSelect(t)}>
            <span className="text-xs font-medium truncate">{t}</span>
            <span className="opacity-0 group-hover:opacity-100 flex gap-0.5 ml-1 flex-shrink-0">
              <button title="Vider" onClick={e => { e.stopPropagation(); onTruncate(t); }}
                className="text-amber-500 hover:text-amber-300 text-[10px] px-1 rounded hover:bg-amber-950/40 transition-colors">
                <i className="fas fa-eraser"></i>
              </button>
              <button title="Supprimer" onClick={e => { e.stopPropagation(); onDropTable(t); }}
                className="text-red-500 hover:text-red-300 text-[10px] px-1 rounded hover:bg-red-950/40 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="px-3 py-3 border-t border-zinc-800">
        <Btn size="sm" variant="danger" className="w-full justify-center" onClick={onDropAll}>
          <i className="fas fa-exclamation-triangle"></i> Tout supprimer
        </Btn>
      </div>
    </aside>
  );
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function Overview({ tables, onSelect }) {
  const [schema, setSchema] = useState([]);
  const [busy, setBusy]     = useState(true);

  useEffect(() => {
    API.describe().then(d => setSchema(d)).catch(() => {}).finally(() => setBusy(false));
  }, [tables.join(",")]);

  if (busy) return <div className="flex items-center justify-center h-full"><Spinner /></div>;

  return (
    <div className="p-6 overflow-auto">
      <h1 className="text-xl font-bold text-zinc-100 mb-1">Vue d'ensemble</h1>
      <p className="text-sm text-zinc-500 mb-6">{tables.length} table{tables.length !== 1 ? "s" : ""} dans la base</p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {schema.map(s => (
          <div key={s.table} onClick={() => onSelect(s.table)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-sky-700/50 hover:bg-zinc-800/60 cursor-pointer transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-zinc-100 group-hover:text-sky-300 transition-colors">{s.table}</span>
              <span className="text-xs text-zinc-600">{s.columns?.length ?? 0} colonnes</span>
            </div>
            <div className="space-y-1">
              {(s.columns ?? []).slice(0, 5).map(col => (
                <div key={col.Field} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">{col.Field}</span>
                  <TypeBadge type={col.Type} />
                </div>
              ))}
              {(s.columns?.length ?? 0) > 5 && (
                <p className="text-[10px] text-zinc-600 pt-1">+{s.columns.length - 5} colonnes…</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EXPORT DDL MODAL ───────────────────────────────────────────────────────────
function ExportDDLModal({ tables, onClose, toast }) {
  const [selectedTables, setSelectedTables] = useState([]);
  const [ddl, setDdl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDDL, setShowDDL] = useState(false);
  
  const toggleTable = (table) => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };
  
  const selectAll = () => {
    setSelectedTables(tables);
  };
  
  const selectNone = () => {
    setSelectedTables([]);
  };
  
  const generateDDL = async () => {
    if (selectedTables.length === 0) {
      toast.error("Veuillez sélectionner au moins une table");
      return;
    }
    
    setLoading(true);
    try {
      const ddlPromises = selectedTables.map(async (table) => {
        const result = await API.create(table);
        return `-- Table: ${table}\n${result};\n\n`;
      });
      
      const ddlResults = await Promise.all(ddlPromises);
      const fullDDL = ddlResults.join('');
      setDdl(fullDDL);
      setShowDDL(true);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    if (ddl) {
      navigator.clipboard.writeText(ddl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };
  
  return (
    <Modal title="Exporter DDL" onClose={onClose} wide>
      <div className="space-y-4">
        {/* Table Selection */}
        {!showDDL ? (
          <>
            <div className="bg-sky-950/40 border border-sky-800/40 rounded-lg px-4 py-3 text-xs text-sky-300">
              <i className="fas fa-info-circle mr-1"></i>
              Sélectionnez les tables à exporter. Le DDL concaténé sera généré avec les instructions CREATE TABLE complètes.
            </div>
            
            {/* Selection Controls */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-300">
                {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} sélectionnée{selectedTables.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <Btn size="sm" onClick={selectAll} disabled={loading}>
                  <i className="fas fa-check-double"></i> Tout
                </Btn>
                <Btn size="sm" onClick={selectNone} disabled={loading}>
                  <i className="fas fa-times"></i> Aucun
                </Btn>
              </div>
            </div>
            
            {/* Table List */}
            <div className="max-h-64 overflow-y-auto border border-zinc-700 rounded-lg">
              <div className="space-y-1 p-2">
                {tables.map(table => (
                  <label key={table} className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table)}
                      onChange={() => toggleTable(table)}
                      className="w-4 h-4 accent-sky-500"
                    />
                    <span className="text-sm text-zinc-300">{table}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Btn onClick={onClose}>
                <i className="fas fa-times"></i> Annuler
              </Btn>
              <Btn variant="primary" loading={loading} onClick={generateDDL} disabled={selectedTables.length === 0}>
                <i className="fas fa-file-export"></i> Générer DDL
              </Btn>
            </div>
          </>
        ) : (
          /* DDL Display */
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-zinc-300">
                DDL généré pour {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDDL(false)}
                  className="text-xs text-sky-400 hover:text-sky-300"
                >
                  <i className="fas fa-arrow-left mr-1"></i>
                  Retour
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 text-xs bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors flex items-center gap-1"
                >
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  {copied ? 'Copié!' : 'Copier'}
                </button>
              </div>
            </div>
            
            <div className="relative">
              <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-emerald-300 font-mono overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                {ddl}
              </pre>
            </div>
            
            <div className="flex justify-end gap-2">
              <Btn onClick={onClose}>
                <i className="fas fa-times"></i> Fermer
              </Btn>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const toast  = useToast();
  const [tables,      setTables]      = useState([]);
  const [active,      setActive]      = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showInit,    setShowInit]    = useState(false);
  const [showExport,  setShowExport]  = useState(false);
  const [confirm,     setConfirm]     = useState(null);
  const [loadingList, setLoadingList] = useState(true);

  const loadTables = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await API.list();
      setTables(list);
    } catch (e) { toast.error(e.message); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  function confirmDrop(table) {
    setConfirm({
      msg: `Supprimer définitivement la table « ${table} » et toutes ses données ?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await API.dropTable(table);
          toast.success(`Table « ${table} » supprimée`);
          if (active === table) setActive(null);
          loadTables();
        } catch (e) { toast.error(e.message); }
      },
    });
  }

  function confirmDropAll() {
    setConfirm({
      msg: "Supprimer TOUTES les tables de la base ? Cette action est irréversible.",
      onConfirm: async () => {
        setConfirm(null);
        try {
          await API.dropAll();
          toast.success("Toutes les tables supprimées");
          setActive(null);
          loadTables();
        } catch (e) { toast.error(e.message); }
      },
    });
  }

  function confirmTruncate(table) {
    setConfirm({
      msg: `Vider toutes les lignes de « ${table} » ? Les données seront perdues.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await API.truncate(table);
          toast.success(`Table « ${table} » vidée`);
          setActive(t => t); // force reload
        } catch (e) { toast.error(e.message); }
      },
    });
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      <style>{`
        @keyframes slideIn { from { transform: translateY(8px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background:#3f3f46; border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover { background:#52525b; }
      `}</style>

      <Sidebar
        tables={tables}
        active={active}
        onSelect={setActive}
        onRefresh={loadTables}
        onCreateTable={() => setShowCreate(true)}
        onDropTable={confirmDrop}
        onDropAll={confirmDropAll}
        onTruncate={confirmTruncate}
        onInitDb={() => setShowInit(true)}
        onExportSchema={() => setShowExport(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-11 flex items-center px-5 border-b border-zinc-800 bg-zinc-900/60 flex-shrink-0">
          {active ? (
            <>
              <span className="text-xs text-zinc-500 mr-2">Table</span>
              <span className="text-sm font-semibold text-zinc-100">{active}</span>
            </>
          ) : (
            <span className="text-xs text-zinc-500">Sélectionnez une table dans la barre latérale</span>
          )}
          {loadingList && <Spinner sm />}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {active ? (
            <TableDataView key={active} table={active} toast={toast} tables={tables} />
          ) : (
            <Overview tables={tables} onSelect={setActive} />
          )}
        </div>
      </main>

      {/* Global modals */}
      {showCreate && (
        <CreateTableModal
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); loadTables(); }}
          toast={toast}
        />
      )}
      {showInit && (
        <InitDbModal
          onClose={() => setShowInit(false)}
          onDone={() => { setShowInit(false); loadTables(); }}
          toast={toast}
        />
      )}
      {showExport && (
        <ExportDDLModal
          tables={tables}
          onClose={() => setShowExport(false)}
          toast={toast}
        />
      )}
      {confirm && (
        <ConfirmModal msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
      )}

      <Toasts toasts={toast.toasts} />
    </div>
  );
}
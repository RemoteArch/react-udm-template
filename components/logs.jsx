const{ useState, useEffect } = React;

// ==========================================
// 1. COMPOSANT : LISTE DES FICHIERS (Sidebar)
// ==========================================
const LogFileList = ({ logs, selectedLogName, onLogClick }) => {
  const [fileSearch, setFileSearch] = useState('');

  // Filtrage local des fichiers par nom
  const filteredLogs = logs.filter((log) =>
    log.name.toLowerCase().includes(fileSearch.toLowerCase())
  );

  return (
    <div className="w-1/4 min-w-[320px] border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white">
        <h2 className="text-xl font-bold tracking-tight">📜 Log Viewer</h2>
        <p className="text-xs text-slate-400 mt-1">{logs.length} fichiers au total</p>
      </div>

      {/* Recherche locale de fichiers */}
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Filtrer par nom de fichier..."
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            className="w-full p-2 pl-8 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-2.5 top-2.5 text-slate-400 text-sm"></span>
        </div>
      </div>

      {/* Liste défilante */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const isErrorLog = log.name.includes('error');
            return (
              <button
                key={log.name}
                onClick={() => onLogClick(log.name)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedLogName === log.name
                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                    : 'border-slate-100 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`font-semibold text-sm truncate max-w-[180px] ${
                    isErrorLog ? 'text-red-600' : 'text-slate-700'
                  }`}>
                    {log.name}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                    {log.size_human}
                  </span>
                </div>
                <div className="mt-2 flex justify-between items-center text-xs text-slate-400">
                  <span>📅 {log.modified}</span>
                  <span className={`font-bold uppercase ${isErrorLog ? 'text-red-500' : 'text-blue-500'}`}>
                    {isErrorLog ? 'ERR' : 'API'}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center text-sm text-slate-400 mt-4">
            Aucun fichier trouvé
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPOSANT : DÉTAILS DU CONTENU (Main area)
// ==========================================
const LogContentDetails = ({ selectedLogName, logMeta, logEntries, loading, onSearch, searchText, setSearchText }) => {
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  if (!selectedLogName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50">
        <span className="text-5xl mb-4">👈</span>
        <p className="text-lg font-medium">Sélectionnez un fichier de log à gauche pour l'analyser.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Topbar: Fichier actif + Recherche de contenu */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm z-10">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            📂 {selectedLogName}
          </h3>
          {logMeta && (
            <p className="text-xs text-slate-500 mt-1">
              Lignes : <b>{logMeta.total_lines}</b> | Entrées : <b>{logMeta.total_entries}</b>
            </p>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Rechercher dans le contenu..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="p-2 text-sm border border-slate-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Rechercher
          </button>
        </form>
      </div>

      {/* Conteneur des lignes de logs */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full text-slate-500">
            Chargement des logs en cours...
          </div>
        ) : logEntries.length > 0 ? (
          logEntries.map((entry, index) => {
            const isTextType = entry.parsed.type === "text"; // Type 'error.log'
            const data = entry.parsed.data;

            return (
              <div key={index} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* 🏷️ Header du Log */}
                <div className={`px-4 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 ${
                  isTextType ? 'bg-red-50/50' : 'bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400">#{entry.line_start}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md tracking-wider uppercase ${
                      isTextType ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {isTextType ? data.level : data.type}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {isTextType ? data.function : data.action}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    🕒 {isTextType ? data.datetime : data.created_at}
                  </div>
                </div>

                {/* 📝 Body du Log */}
                <div className="p-4">
                  {isTextType ? (
                    // RENDU DES LOGS TYPE ERROR (TEXT)
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-800 font-medium">❌ Message: {data.message}</p>
                      {data.reference_line && (
                        <p className="text-xs text-slate-400 font-mono">Ligne de référence : {data.reference_line}</p>
                      )}
                    </div>
                  ) : (
                    // RENDU DES LOGS TYPE API (JSON)
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4 space-y-1 text-xs">
                        <p><span className="text-slate-400">🌍 IP:</span> <span className="font-mono text-slate-700 font-semibold">{data.ip_address}</span></p>
                        <p>
                          <span className="text-slate-400">⚙️ Params:</span> 
                          <code className="bg-slate-100 p-1 ml-1 rounded text-pink-600 font-mono text-[11px] break-all">
                            {data.params || '[]'}
                          </code>
                        </p>
                      </div>
                      
                      <div className="md:col-span-8">
                        <details className="text-xs group">
                          <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 select-none">
                            🔍 Voir les Headers HTTP
                          </summary>
                          <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed max-h-48">
                            {JSON.stringify(data.headers, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex justify-center items-center h-full text-slate-400">
            Aucun log trouvé dans ce fichier.
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. COMPOSANT PARENT : GESTIONNAIRE GLOBAL
// ==========================================
const LogsApiComponent = () => {
  const [logs, setLogs] = useState([]);
  const [selectedLogName, setSelectedLogName] = useState('');
  const [logMeta, setLogMeta] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger la liste des fichiers
  useEffect(() => {
    const fetchLogsList = async () => {
      try {
        const response = await fetch(`?action=list`);
        const resJson = await response.json();
        setLogs(resJson.data || []);
      } catch (error) {
        console.error("Erreur listing fichiers:", error);
      }
    };
    fetchLogsList();
  }, []);

  // Charger le contenu d'un fichier (via clic ou recherche de contenu)
  const fetchLogContent = async (logName, query = '') => {
    setLoading(true);
    try {
      const url = query 
        ? `?action=file&name=${logName}&q=${encodeURIComponent(query)}` 
        : `?action=file&name=${logName}`;
      
      const response = await fetch(url);
      const resJson = await response.json();

      if (resJson.success || resJson.data) {
        setLogEntries(resJson.data || []);
        setLogMeta(resJson.meta || null);
      } else {
        setLogEntries([]);
      }
    } catch (error) {
      console.error("Erreur chargement contenu:", error);
      setLogEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogClick = (logName) => {
    setSelectedLogName(logName);
    setSearchText(''); // On reset la recherche de contenu du fichier
    fetchLogContent(logName, '');
  };

  const handleSearchContent = () => {
    if (selectedLogName) {
      fetchLogContent(selectedLogName, searchText);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Composant 1 : Liste fichiers */}
      <LogFileList 
        logs={logs} 
        selectedLogName={selectedLogName} 
        onLogClick={handleLogClick} 
      />

      {/* Composant 2 : Détails du contenu */}
      <LogContentDetails 
        selectedLogName={selectedLogName}
        logMeta={logMeta}
        logEntries={logEntries}
        loading={loading}
        onSearch={handleSearchContent}
        searchText={searchText}
        setSearchText={setSearchText}
      />

    </div>
  );
};

export default LogsApiComponent;
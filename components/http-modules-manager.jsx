// Configuration globale de l'API
const API_BASE_URL = '';
document.title = 'Process and File Manager';

// Détection du type de fichier par extension
const getFileKind = (name) => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg','bmp','ico'].includes(ext)) return 'image';
  if (['mp4','webm','mkv','avi','mov','flv'].includes(ext)) return 'video';
  if (['mp3','wav','ogg','flac','m4a','aac','wma'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['doc','docx','odt','rtf'].includes(ext)) return 'word';
  if (['xls','xlsx','csv','ods','tsv'].includes(ext)) return 'excel';
  if (['ppt','pptx','odp'].includes(ext)) return 'powerpoint';
  if (['zip','rar','7z','tar','gz','bz2','xz','lzma'].includes(ext)) return 'archive';
  if (['js','jsx','ts','tsx','html','htm','css','scss','sass','less','json','xml','yaml','yml','toml','ini','cfg','conf','sh','bat','ps1','cmd','py','rb','go','rs','java','cpp','c','h','hpp','cs','swift','kt','php','sql','pl'].includes(ext)) return 'code';
  if (['txt','md','log','markdown'].includes(ext)) return 'text';
  if (['exe','dll','bin','iso','dmg','msi','deb','rpm'].includes(ext)) return 'binary';
  return 'binary';
};

const getFileIcon = (kind) => {
  switch (kind) {
    case 'image': return { icon: 'fa-file-image', color: 'text-emerald-500' };
    case 'video': return { icon: 'fa-file-video', color: 'text-rose-500' };
    case 'audio': return { icon: 'fa-file-audio', color: 'text-violet-500' };
    case 'pdf': return { icon: 'fa-file-pdf', color: 'text-red-500' };
    case 'word': return { icon: 'fa-file-word', color: 'text-blue-500' };
    case 'excel': return { icon: 'fa-file-excel', color: 'text-emerald-600' };
    case 'powerpoint': return { icon: 'fa-file-powerpoint', color: 'text-orange-500' };
    case 'archive': return { icon: 'fa-file-zipper', color: 'text-indigo-400' };
    case 'code': return { icon: 'fa-file-code', color: 'text-sky-400' };
    case 'text': return { icon: 'fa-file-lines', color: 'text-slate-300' };
    case 'binary': return { icon: 'fa-file-circle-question', color: 'text-slate-400' };
    default: return { icon: 'fa-file', color: 'text-slate-400' };
  }
};

// Composant Principal
const ProcessAndFileManager = () => {
  // Navigation & Design State
  const [currentTab, setCurrentTab] = React.useState('dashboard'); // dashboard, shell, processus, files
  const [isDarkMode, setIsDarkMode] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  // États de l'API et Synchronisation
  const [apiStatus, setApiStatus] = React.useState('checking'); // online, offline, checking
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  
  // États Globaux des Processus (Shell)
  const [jobs, setJobs] = React.useState([]); 
  const [selectedJobId, setSelectedJobId] = React.useState(null);
  const [selectedJobDetail, setSelectedJobDetail] = React.useState(null);
  const [isLoadingJobs, setIsLoadingJobs] = React.useState(false);
  
  // États Formulaire Commande
  const [command, setCommand] = React.useState('');
  const [cwd, setCwd] = React.useState('');
  const [commandHistory, setCommandHistory] = React.useState([]);
  const [lastLaunchedJobId, setLastLaunchedJobId] = React.useState(null);

  // États du Gestionnaire de Fichiers
  const [currentPath, setCurrentPath] = React.useState('/');
  const [explorerData, setExplorerData] = React.useState({ directories: [], files: [] });
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [fileContent, setFileContent] = React.useState('');
  const [isEditingFile, setIsEditingFile] = React.useState(false);

  // Système de Feedback (Toasts & Modales)
  const [toasts, setToasts] = React.useState([]);
  const [confirmModal, setConfirmModal] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // --- UTILS : GESTION DES NOTIFICATIONS (TOASTS) ---
  const triggerToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // --- API OPERATIONS : SHELL ---
  
  // GET /exec : Liste les jobs actifs
  const fetchActiveJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/exec`);
      if (!res.ok) throw new Error("Erreur serveur lors de la récupération des processus");
      const activeJobs = await res.json(); // attendu: [{ id, command, running }]
      
      setApiStatus('online');
      
      // Fusionner intelligemment avec l'état local pour conserver l'historique des jobs terminés
      setJobs((prevJobs) => {
        const merged = [...prevJobs];
        activeJobs.forEach((active) => {
          const idx = merged.findIndex((j) => j.id === active.id);
          if (idx > -1) {
            merged[idx] = { ...merged[idx], ...active };
          } else {
            merged.unshift({ ...active, status: null, stdout: '', stderr: '' });
          }
        });
        // Mettre à jour le statut running des jobs locaux qui ne sont plus renvoyés par l'API active
        return merged.map((j) => {
          const isActive = activeJobs.some((a) => a.id === j.id);
          if (!isActive && j.running) {
            // Le job s'est arrêté, on force une récupération finale de son état
            fetchJobDetailById(j.id);
            return { ...j, running: false };
          }
          return j;
        });
      });
    } catch (err) {
      setApiStatus('offline');
    }
  };

  // GET /exec/{id} : Récupère le détail d'un job spécifique
  const fetchJobDetailById = React.useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/exec/${id}`);
      if (!res.ok) throw new Error(`Impossible de charger le job ${id}`);
      const detail = await res.json(); // attendu: { stdout, stderr, status, running }
      
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...detail } : j))
      );
      
      if (selectedJobId === id) {
        setSelectedJobDetail((prev) => ({ ...prev, ...detail }));
      }
    } catch (err) {
      triggerToast('error', err.message);
    }
  }, [selectedJobId]);

  // POST /exec : Lance une commande
  const handleLaunchCommand = (cmdToLaunch, targetCwd) => {
    if (!cmdToLaunch.trim()) {
      triggerToast('warning', 'La commande ne peut pas être vide.');
      return;
    }

    const executePost = async () => {
      setIsLoadingJobs(true);
      try {
        const res = await fetch(`${API_BASE_URL}/exec`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmdToLaunch, cwd: targetCwd || undefined })
        });
        if (!res.ok) throw new Error("Échec du lancement de l'exécution de la commande");
        const data = await res.json(); // attendu: { job_id }
        
        const newJob = {
          id: data.job_id,
          command: cmdToLaunch,
          cwd: targetCwd,
          running: true,
          status: null,
          stdout: '',
          stderr: ''
        };
        
        setJobs((prev) => [newJob, ...prev]);
        setLastLaunchedJobId(data.job_id);
        setCommandHistory((prev) => [cmdToLaunch, ...prev.filter(c => c !== cmdToLaunch)].slice(0, 15));
        triggerToast('success', `Job ${data.job_id} initialisé avec succès.`);
        
        // Redirection vers le suivi de processus
        setSelectedJobId(data.job_id);
        setCurrentTab('processus');
        setCommand('');
        setCwd('');
      } catch (err) {
        triggerToast('error', err.message);
      } finally {
        setIsLoadingJobs(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    };

    setConfirmModal({
      isOpen: true,
      title: "Confirmation d'exécution",
      message: `Êtes-vous sûr de vouloir exécuter la commande suivante ?\n\n$ ${cmdToLaunch}\n\n${targetCwd ? `Dans le dossier : ${targetCwd}` : "Dans le dossier par défaut de l'API"}`,
      onConfirm: executePost
    });
  };

  // DELETE /exec/{id} : Tue un processus
  const handleKillProcess = (id) => {
    const executeDelete = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/exec/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Erreur lors de l'arrêt du processus ${id}`);
        
        triggerToast('success', `Le processus ${id} a reçu le signal d'arrêt.`);
        fetchActiveJobs();
        fetchJobDetailById(id);
      } catch (err) {
        triggerToast('error', err.message);
      } finally {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    };

    setConfirmModal({
      isOpen: true,
      title: "Forcer l'arrêt du processus",
      message: `Attention, vous allez envoyer un signal de terminaison au job ${id}. Cette action est irréversible. Continuer ?`,
      onConfirm: executeDelete
    });
  };

  // --- API OPERATIONS : FICHIERS ---

  // GET /files/read?path= : Lit un fichier ou liste un dossier
  const fetchFilesOrDirectory = React.useCallback(async (targetPath) => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch(`${API_BASE_URL}/files/read?path=${encodeURIComponent(targetPath)}`);
      if (!res.ok) throw new Error("Erreur d'accès au chemin spécifié ou fichier introuvable");
      
      const contentType = res.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // C'est un dossier (liste de répertoires et fichiers)
        const data = await res.json();
        // Le backend retourne un tableau plat [{name, path, is_dir, size}]
        const dirs = [];
        const files = [];
        const entries = Array.isArray(data) ? data : [];
        entries.forEach((e) => {
          if (e.is_dir) {
            dirs.push(e.name);
          } else {
            const kind = getFileKind(e.name);
            files.push({
              name: e.name,
              size: e.size != null ? `${e.size} o` : '-',
              kind
            });
          }
        });
        setExplorerData({ directories: dirs, files });
        setSelectedFile(null);
        setFileContent('');
        setIsEditingFile(false);
        setCurrentPath(targetPath);
      } else {
        // C'est un fichier brut
        const fileName = targetPath.split('/').pop() || 'Fichier';
        const kind = getFileKind(fileName);
        if (kind === 'text' || kind === 'code') {
          const text = await res.text();
          setFileContent(text);
          setIsEditingFile(true);
        } else {
          const blob = await res.blob();
          setFileContent(URL.createObjectURL(blob));
          setIsEditingFile(false);
        }
      }
    } catch (err) {
      triggerToast('error', err.message);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  // POST /files/write?path=&add= : Écrit ou ajoute un fichier
  const handleSaveFileContent = (appendMode = false) => {
    if (!selectedFile) return;
    const fullPath = currentPath === '/' ? `/${selectedFile.name}` : `${currentPath}/${selectedFile.name}`;

    const executeWrite = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/files/write?path=${encodeURIComponent(fullPath)}&add=${appendMode}`, {
          method: 'POST',
          body: fileContent
        });
        if (!res.ok) throw new Error("Impossible d'écrire ou de modifier le fichier");
        
        triggerToast('success', appendMode ? "Contenu ajouté à la fin du fichier avec succès." : "Fichier enregistré et remplacé avec succès.");
        fetchFilesOrDirectory(currentPath);
      } catch (err) {
        triggerToast('error', err.message);
      } finally {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    };

    if (!appendMode) {
      setConfirmModal({
        isOpen: true,
        title: "Écraser le fichier existant",
        message: `Voulez-vous vraiment remplacer l'intégralité du contenu du fichier suivant ?\n\n${selectedFile.name}`,
        onConfirm: executeWrite
      });
    } else {
      executeWrite();
    }
  };

  // Traitement Upload Fichier direct (multipart/form-data)
  const handleUploadFileDirect = async (e) => {
    const fileObj = e.target.files[0];
    if (!fileObj) return;

    const fullPath = currentPath === '/' ? `/${fileObj.name}` : `${currentPath}/${fileObj.name}`;
    try {
      const form = new FormData();
      form.append('file', fileObj);
      const res = await fetch(`${API_BASE_URL}/files/write?path=${encodeURIComponent(fullPath)}&add=false`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) throw new Error("Échec du téléversement du fichier.");
      triggerToast('success', `Fichier "${fileObj.name}" téléversé avec succès.`);
      fetchFilesOrDirectory(currentPath);
    } catch (error) {
      triggerToast('error', error.message);
    }
  };

  // Navigation dans le File System
  const handleNavigateToFolder = (folderName) => {
    let newPath = '';
    if (folderName === '..') {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      newPath = '/' + parts.join('/');
    } else {
      newPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
    }
    fetchFilesOrDirectory(newPath);
  };

  const handleSelectFileItem = (fileItem) => {
    setSelectedFile(fileItem);
    const targetFilePath = currentPath === '/' ? `/${fileItem.name}` : `${currentPath}/${fileItem.name}`;
    fetchFilesOrDirectory(targetFilePath);
  };

  // --- EFFETS ET SYNCHRONISATION ---

  // Chargements initiaux au montage du composant
  React.useEffect(() => {
    fetchActiveJobs();
    fetchFilesOrDirectory('/');
  }, [fetchFilesOrDirectory]);

  // Boucle de rafraîchissement automatique pour l'état des processus
  React.useEffect(() => {
    let intervalId = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchActiveJobs();
        if (selectedJobId) {
          fetchJobDetailById(selectedJobId);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, selectedJobId, fetchJobDetailById]);

  // Maintien à jour du panneau de détail actif
  React.useEffect(() => {
    if (selectedJobId) {
      const match = jobs.find((j) => j.id === selectedJobId);
      if (match) setSelectedJobDetail(match);
    } else {
      setSelectedJobDetail(null);
    }
  }, [selectedJobId, jobs]);

  // --- CALCULS ET MÉTROPLES DE DASHBOARD ---
  const stats = React.useMemo(() => {
    let enCours = 0;
    let terminesSuccess = 0;
    let terminesErreur = 0;
    let arretes = 0;

    jobs.forEach((j) => {
      if (j.running) {
        enCours++;
      } else if (j.status === 0) {
        terminesSuccess++;
      } else if (j.status === 137 || j.status === -1) {
        arretes++;
      } else if (j.status !== null && j.status !== 0) {
        terminesErreur++;
      }
    });

    return { enCours, terminesSuccess, terminesErreur, arretes, total: jobs.length };
  }, [jobs]);

  // --- ARCHITECTURE DE STYLE DESIGN SYSTEM & THEMES ---
  const theme = isDarkMode ? {
    bg: 'bg-slate-950 text-slate-100',
    sidebar: 'bg-slate-900 border-slate-800 text-slate-200',
    header: 'bg-slate-900/80 border-slate-800 text-slate-100',
    card: 'bg-slate-900 border border-slate-800 rounded-xl shadow-xl shadow-black/40',
    input: 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-sky-500',
    hoverItem: 'hover:bg-slate-800/60',
    mutedText: 'text-slate-400',
    terminal: 'bg-black text-emerald-400 border border-slate-800 font-mono',
    badgeMuted: 'bg-slate-800 text-slate-400'
  } : {
    bg: 'bg-slate-50 text-slate-900',
    sidebar: 'bg-white border-slate-200 text-slate-800',
    header: 'bg-white/80 border-slate-200 text-slate-900',
    card: 'bg-white border border-slate-200 rounded-xl shadow-md shadow-slate-200/50',
    input: 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-600',
    hoverItem: 'hover:bg-slate-100',
    mutedText: 'text-slate-500',
    terminal: 'bg-slate-900 text-emerald-300 border border-slate-300 font-mono',
    badgeMuted: 'bg-slate-200 text-slate-600'
  };

  return (
    <div className={`min-h-screen flex text-sm transition-colors duration-200 selection:bg-sky-500/30 ${theme.bg}`}>
      
      {/* SIDEBAR NAVIGATION BAR */}
      <aside className={`w-64 border-r flex flex-col justify-between fixed top-0 bottom-0 left-0 z-30 transition-transform duration-300 ease-in-out -translate-x-full lg:translate-x-0 ${theme.sidebar} ${mobileMenuOpen ? 'translate-x-0' : ''}`}>
        <div>
          {/* Logo Brand / Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-inherit">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <i className="fa-solid fa-server text-sm"></i>
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-sm leading-none">ConsoleDev</h1>
              <span className="text-[10px] uppercase tracking-widest font-bold text-sky-500 block mt-0.5">Admin & Control</span>
            </div>
          </div>

          {/* Onglets de Navigation */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
              { id: 'shell', label: 'Commandes', icon: 'fa-terminal' },
              { id: 'processus', label: 'Processus', icon: 'fa-microchip', count: stats.enCours },
              { id: 'files', label: 'Fichiers', icon: 'fa-folder-open' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-150 ${
                  currentTab === tab.id
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : `hover:bg-opacity-100 ${theme.hoverItem} opacity-75`
                }`}
              >
                <div className="flex items-center gap-3">
                  <i className={`fa-solid ${tab.icon} w-4 text-center`}></i>
                  <span>{tab.label}</span>
                </div>
                {tab.count > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${currentTab === tab.id ? 'bg-white text-sky-500' : 'bg-sky-500 text-white'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Pied de la Sidebar */}
        <div className="p-4 border-t border-inherit text-[11px] opacity-50 flex flex-col gap-0.5">
          <div>Plateforme d'Administration</div>
          <div>Statut Node : Connecté en HTTPS</div>
        </div>
      </aside>

      {/* Overlay backdrop menu mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* BLOC PRINCIPAL DE CONTENU EN DROITE */}
      <div className="pl-0 lg:pl-64 flex-1 flex flex-col min-h-screen">
        
        {/* HEADER GLOBAL */}
        <header className={`h-16 border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 backdrop-blur-md z-20 transition-all ${theme.header}`}>
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            {/* Bouton menu hamburger mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden p-2 rounded-lg border border-slate-500/20 transition-all ${theme.hoverItem} flex-shrink-0`}
              title="Menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>

            {/* Titre : court sur mobile, long sur desktop */}
            <h2 className="font-bold text-sm lg:text-base capitalize tracking-tight truncate">
              {currentTab === 'dashboard' && <><span className="lg:hidden">Dashboard</span><span className="hidden lg:inline">Tableau de bord</span></>}
              {currentTab === 'shell' && <><span className="lg:hidden">Commandes</span><span className="hidden lg:inline">Gestionnaire de commandes</span></>}
              {currentTab === 'processus' && <><span className="lg:hidden">Processus</span><span className="hidden lg:inline">Suivi des processus</span></>}
              {currentTab === 'files' && <><span className="lg:hidden">Fichiers</span><span className="hidden lg:inline">Explorateur de fichiers</span></>}
            </h2>

            {/* Statut Réseau API - caché sur mobile */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 flex-shrink-0`}>
              <span className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : apiStatus === 'checking' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
              <span className={theme.mutedText}>
                API : {apiStatus === 'online' ? 'En ligne' : apiStatus === 'checking' ? 'Vérification...' : 'Déconnectée'}
              </span>
            </div>
          </div>

          {/* Outils et Actions à Droite */}
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {/* Auto Refresh Switch - icône seule sur mobile */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 lg:px-3 lg:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : 'bg-transparent border-slate-500/20 text-inherit opacity-60'
              }`}
              title={autoRefresh ? 'Sync Activée' : 'Sync Désactivée'}
            >
              <i className={`fa-solid ${autoRefresh ? 'fa-arrows-rotate fa-spin' : 'fa-play'}`}></i>
              <span className="hidden lg:inline">{autoRefresh ? 'Sync Activée' : 'Sync Désactivée'}</span>
            </button>

            {/* Manuel Refresh */}
            <button
              onClick={() => {
                fetchActiveJobs();
                fetchFilesOrDirectory(currentPath);
                triggerToast('success', 'Actualisation manuelle effectuée.');
              }}
              className={`p-2 rounded-lg border border-slate-500/20 transition-all ${theme.hoverItem}`}
              title="Actualiser"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>

            {/* Light/Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border border-slate-500/20 transition-all ${theme.hoverItem}`}
              title="Thème"
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-400'}`}></i>
            </button>
          </div>
        </header>

        {/* CONTAINER MAITRE DU CONTENU CENTRAL */}
        <main className="p-4 lg:p-8 flex-1 flex flex-col gap-6">

          {/* -------------------- 1. ONGLET: DASHBOARD -------------------- */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Grille des Cartes Analytiques / Statistiques */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${theme.card} p-5 flex items-center justify-between`}>
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.mutedText}`}>En Cours</span>
                    <h3 className="text-2xl font-black tracking-tight mt-1 text-sky-500">{stats.enCours}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center"><i className="fa-solid fa-spinner fa-spin-pulse"></i></div>
                </div>

                <div className={`${theme.card} p-5 flex items-center justify-between`}>
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.mutedText}`}>Succès</span>
                    <h3 className="text-2xl font-black tracking-tight mt-1 text-emerald-500">{stats.terminesSuccess}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><i className="fa-solid fa-circle-check"></i></div>
                </div>

                <div className={`${theme.card} p-5 flex items-center justify-between`}>
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.mutedText}`}>Erreurs</span>
                    <h3 className="text-2xl font-black tracking-tight mt-1 text-rose-500">{stats.terminesErreur}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center"><i className="fa-solid fa-circle-xmark"></i></div>
                </div>

                <div className={`${theme.card} p-5 flex items-center justify-between`}>
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.mutedText}`}>Arrêtés / Tués</span>
                    <h3 className="text-2xl font-black tracking-tight mt-1 text-amber-500">{stats.arretes}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><i className="fa-solid fa-ban"></i></div>
                </div>
              </div>

              {/* Contenu Section du Bas (Lancement rapide + Flux temporaire) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Lancement rapide à gauche */}
                <div className="lg:col-span-2 space-y-6">
                  <div className={`${theme.card} p-6`}>
                    <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                      <i className="fa-solid fa-bolt text-sky-500"></i> Lancement rapide d'instruction
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <span className="absolute left-3.5 top-2.5 font-mono text-xs opacity-40">$</span>
                        <input
                          type="text"
                          placeholder="Saisissez votre commande (ex: npm run build)..."
                          value={command}
                          onChange={(e) => setCommand(e.target.value)}
                          className={`w-full pl-8 pr-4 py-2 rounded-lg border outline-none font-mono text-xs transition-all ${theme.input}`}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Dossier (CWD optionnel)"
                        value={cwd}
                        onChange={(e) => setCwd(e.target.value)}
                        className={`sm:w-48 px-4 py-2 rounded-lg border outline-none font-mono text-xs transition-all ${theme.input}`}
                      />
                      <button
                        onClick={() => handleLaunchCommand(command, cwd)}
                        className="bg-sky-500 hover:bg-sky-600 font-semibold px-5 py-2 rounded-lg text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 whitespace-nowrap"
                      >
                        <i className="fa-solid fa-play text-[10px]"></i> Exec
                      </button>
                    </div>

                    {lastLaunchedJobId && (
                      <div className="mt-3 p-3 rounded-lg bg-sky-500/5 border border-sky-500/20 flex items-center justify-between text-xs animate-in slide-in-from-top-2">
                        <span className={theme.mutedText}>Dernier processus initialisé : <code className="font-bold text-sky-500">{lastLaunchedJobId}</code></span>
                        <button onClick={() => { setSelectedJobId(lastLaunchedJobId); setCurrentTab('processus'); }} className="text-sky-500 hover:underline font-bold">Suivre le flux →</button>
                      </div>
                    )}
                  </div>

                  {/* Liste des derniers lancements récents */}
                  <div className={`${theme.card} p-6`}>
                    <h4 className="font-bold text-sm mb-4">Statut des processus système récents</h4>
                    {jobs.length === 0 ? (
                      <div className={`text-center py-8 ${theme.mutedText} opacity-60 italic`}>Aucun processus lancé pour le moment.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`border-b border-slate-500/10 text-[11px] font-bold uppercase tracking-wider opacity-60 ${theme.mutedText}`}>
                              <th className="pb-2">Identifiant (ID)</th>
                              <th className="pb-2">Commande</th>
                              <th className="pb-2">État</th>
                              <th className="pb-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-500/10">
                            {jobs.slice(0, 5).map((job) => (
                              <tr key={job.id} className="group hover:bg-slate-500/5 transition-all">
                                <td className="py-3 font-mono text-xs font-bold text-sky-500">{job.id}</td>
                                <td className="py-3 max-w-xs truncate font-mono text-xs opacity-90">{job.command}</td>
                                <td className="py-3">
                                  {job.running ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/10 text-sky-500 tracking-wider">En cours</span>
                                  ) : job.status === 0 ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 tracking-wider">Succès</span>
                                  ) : job.status === 137 ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 tracking-wider">Arrêté</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/10 text-rose-500 tracking-wider">Erreur ({job.status})</span>
                                  )}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => { setSelectedJobId(job.id); setCurrentTab('processus'); }}
                                      className={`p-1.5 rounded bg-slate-500/10 opacity-70 group-hover:opacity-100 ${theme.hoverItem}`}
                                      title="Ouvrir dans le terminal"
                                    >
                                      <i className="fa-solid fa-terminal text-xs"></i>
                                    </button>
                                    {job.running && (
                                      <button
                                        onClick={() => handleKillProcess(job.id)}
                                        className="p-1.5 rounded bg-rose-500/10 text-rose-500 opacity-70 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all"
                                        title="Tuer le processus"
                                      >
                                        <i className="fa-solid fa-ban text-xs"></i>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section historique local à droite */}
                <div className={`${theme.card} p-6 flex flex-col`}>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left opacity-60"></i> Historique de commandes
                  </h4>
                  <p className={`text-xs mb-4 ${theme.mutedText}`}>Cliquez sur un élément pour charger ou relancer rapidement la commande.</p>
                  
                  {commandHistory.length === 0 ? (
                    <div className={`flex-1 flex flex-col items-center justify-center text-center opacity-40 italic p-6 border border-dashed border-slate-500/20 rounded-xl`}>
                      <i className="fa-solid fa-list-check text-xl mb-2"></i>
                      <span>Aucune commande dans l'historique de session.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1 flex-1">
                      {commandHistory.map((hCmd, idx) => (
                        <div key={idx} className={`w-full p-2.5 rounded-lg border border-slate-500/10 bg-slate-500/5 flex items-center justify-between gap-3 text-xs font-mono group transition-all`}>
                          <span className="truncate flex-1 opacity-80 cursor-pointer" onClick={() => setCommand(hCmd)} title="Charger dans le champ">$ {hCmd}</span>
                          <button
                            onClick={() => handleLaunchCommand(hCmd, '')}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 text-sky-500 hover:bg-sky-500/10 transition-all"
                            title="Relancer immédiatement"
                          >
                            <i className="fa-solid fa-play text-[10px]"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------------------- 2. ONGLET: GESTIONNAIRE DE COMMANDES AVANCÉ -------------------- */}
          {currentTab === 'shell' && (
            <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-200">
              <div className={`${theme.card} p-6 lg:p-8 space-y-6`}>
                <div>
                  <h3 className="text-base font-bold">Console d'exécution globale</h3>
                  <p className={`text-xs mt-1 ${theme.mutedText}`}>Envoyez des instructions systèmes directement au serveur distant.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Commande à exécuter *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 font-mono text-sm opacity-40">$</span>
                      <input
                        type="text"
                        placeholder="Ex: docker-compose up -d, webpack --mode production, etc."
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        className={`w-full pl-8 pr-4 py-3 rounded-lg border outline-none font-mono text-xs transition-all ${theme.input}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Dossier de travail ciblé (CWD)</label>
                    <input
                      type="text"
                      placeholder="Chemin absolu ou relatif (ex: /var/www/html). Laisser vide pour racine API."
                      value={cwd}
                      onChange={(e) => setCwd(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border outline-none font-mono text-xs transition-all ${theme.input}`}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex gap-3 text-xs leading-relaxed">
                    <i className="fa-solid fa-circle-exclamation text-base mt-0.5 flex-shrink-0"></i>
                    <div>
                      <span className="font-bold">Rappel sécuritaire d'administration :</span> Les commandes s'exécutent avec les privilèges du processus parent de l'API. Assurez-vous de la validité de vos scripts avant validation.
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    {command.trim() && (
                      <button
                        onClick={() => setCommand('')}
                        className={`px-4 py-2.5 rounded-lg border border-slate-500/20 font-semibold text-xs transition-all ${theme.hoverItem}`}
                      >
                        Effacer la saisie
                      </button>
                    )}
                    <button
                      onClick={() => handleLaunchCommand(command, cwd)}
                      disabled={!command.trim() || isLoadingJobs}
                      className="bg-sky-500 hover:bg-sky-600 disabled:opacity-40 font-semibold px-6 py-2.5 rounded-lg text-white transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20"
                    >
                      {isLoadingJobs ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-rocket"></i>}
                      <span>Déclencher l'exécution</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- 3. ONGLET: SUIVI DES PROCESSUS (TERMINAL INTERFACE) -------------------- */}
          {currentTab === 'processus' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1 animate-in fade-in duration-200">
              
              {/* Panneau latéral gauche : Sélecteur de Jobs */}
              <div className={`${theme.card} p-4 flex flex-col max-h-[calc(100vh-180px)]`}>
                <div className="flex justify-between items-center pb-3 border-b border-slate-500/10 mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider">Tous les Jobs ({jobs.length})</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 font-bold">{stats.enCours} actifs</span>
                </div>

                {jobs.length === 0 ? (
                  <div className={`text-center py-12 italic opacity-50 ${theme.mutedText}`}>Aucun job répertorié.</div>
                ) : (
                  <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                    {jobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                          selectedJobId === job.id
                            ? 'bg-sky-500/10 border-sky-500 text-sky-500 shadow-sm shadow-sky-500/5'
                            : `border-slate-500/15 bg-slate-500/5 ${theme.hoverItem}`
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <code className="text-xs font-mono font-bold bg-slate-500/10 px-2 py-0.5 rounded text-inherit">{job.id}</code>
                          <span className={`w-2 h-2 rounded-full ${job.running ? 'bg-sky-500 animate-pulse' : job.status === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        </div>
                        <p className="font-mono text-xs truncate w-full opacity-90 text-inherit">$ {job.command}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Panneau de droite : Console / Terminal */}
              <div className="lg:col-span-2 flex flex-col h-full min-h-[500px]">
                {selectedJobDetail ? (
                  <div className={`${theme.card} p-6 flex flex-col flex-1`}>
                    
                    {/* Top Detail Meta */}
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-500/10 pb-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-base">{selectedJobDetail.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            selectedJobDetail.running 
                              ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20' 
                              : selectedJobDetail.status === 0 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}>
                            {selectedJobDetail.running ? 'Running (Actif)' : selectedJobDetail.status === 137 ? 'Terminé (Killed)' : `Quitté - Code ${selectedJobDetail.status}`}
                          </span>
                        </div>
                        <div className="font-mono text-xs opacity-90 bg-slate-500/5 p-2 rounded-lg border border-slate-500/10 mt-2">
                          $ {selectedJobDetail.command}
                        </div>
                        {selectedJobDetail.cwd && (
                          <div className={`text-[11px] font-mono opacity-60 ${theme.mutedText}`}>
                            <i className="fa-solid fa-folder text-[10px] mr-1"></i> Path: {selectedJobDetail.cwd}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedJobDetail.running && (
                          <button
                            onClick={() => handleKillProcess(selectedJobDetail.id)}
                            className="bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/10"
                          >
                            <i className="fa-solid fa-ban"></i> Tuer
                          </button>
                        )}
                        <button
                          onClick={() => handleLaunchCommand(selectedJobDetail.command, selectedJobDetail.cwd)}
                          className="bg-sky-500 hover:bg-sky-600 px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/10"
                        >
                          <i className="fa-solid fa-rotate-left"></i> Relancer
                        </button>
                      </div>
                    </div>

                    {/* Terminal Menu Header */}
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className={`font-bold uppercase tracking-wider opacity-60 ${theme.mutedText}`}>Flux Console De Sortie</span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedJobDetail.stdout || '');
                            triggerToast('success', 'Flux Standard (stdout) copié.');
                          }}
                          disabled={!selectedJobDetail.stdout}
                          className={`px-2 py-1 rounded border border-slate-500/20 disabled:opacity-30 ${theme.hoverItem}`}
                        >
                          <i className="fa-solid fa-copy mr-1"></i> Copy Stdout
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedJobDetail.stderr || '');
                            triggerToast('success', 'Flux Erreur (stderr) copié.');
                          }}
                          disabled={!selectedJobDetail.stderr}
                          className={`px-2 py-1 rounded border border-slate-500/20 disabled:opacity-30 ${theme.hoverItem}`}
                        >
                          <i className="fa-solid fa-copy mr-1"></i> Copy Stderr
                        </button>
                        <button
                          onClick={() => {
                            setJobs((prev) => prev.map((j) => j.id === selectedJobDetail.id ? { ...j, stdout: '', stderr: '' } : j));
                            triggerToast('warning', 'Affichage du terminal nettoyé localement.');
                          }}
                          className={`px-2 py-1 rounded border border-slate-500/20 text-rose-500 ${theme.hoverItem}`}
                        >
                          <i className="fa-solid fa-trash-can"></i> Nettoyer
                        </button>
                      </div>
                    </div>

                    {/* Bloc Terminal de sortie textuelle */}
                    <div className={`p-4 rounded-xl flex-1 overflow-y-auto h-96 leading-relaxed flex flex-col gap-2 ${theme.terminal}`}>
                      {/* Affichage différencié sans HTML brut dangereux */}
                      {selectedJobDetail.stdout && (
                        <pre className="whitespace-pre-wrap font-mono text-xs">{selectedJobDetail.stdout}</pre>
                      )}
                      
                      {selectedJobDetail.stderr && (
                        <pre className="whitespace-pre-wrap font-mono text-xs text-rose-400 bg-rose-500/5 p-2 rounded border border-rose-500/10 mt-2">
                          {selectedJobDetail.stderr}
                        </pre>
                      )}

                      {!selectedJobDetail.stdout && !selectedJobDetail.stderr && (
                        <span className="opacity-30 italic font-mono text-slate-400">[Aucune donnée émise par le flux]</span>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className={`${theme.card} p-12 text-center opacity-50 flex flex-col items-center justify-center flex-1 min-h-[300px]`}>
                    <i className="fa-solid fa-terminal text-3xl mb-3 opacity-30 text-sky-500"></i>
                    <p className="max-w-xs text-xs">Sélectionnez un processus actif ou archivé dans le volet latéral pour inspecter sa console en temps réel.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* -------------------- 4. ONGLET: GESTIONNAIRE DE FICHIERS -------------------- */}
          {currentTab === 'files' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1 animate-in fade-in duration-200">
              
              {/* Explorateur Arborescence (Gauche) */}
              <div className={`${theme.card} p-5 space-y-4 max-h-[calc(100vh-180px)] flex flex-col`}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-500/10">
                  <span className="font-bold text-xs uppercase tracking-wider">Explorateur</span>
                  
                  {/* Upload Wrapper */}
                  <label className="bg-sky-500 hover:bg-sky-600 px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/10">
                    <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i>
                    <span>Upload</span>
                    <input type="file" onChange={handleUploadFileDirect} className="hidden" />
                  </label>
                </div>

                {/* Fil d'Ariane & Back button */}
                <div className="flex items-center gap-2 bg-slate-500/5 border border-slate-500/10 p-2 rounded-lg font-mono text-xs">
                  {currentPath !== '/' && (
                    <button
                      onClick={() => handleNavigateToFolder('..')}
                      className={`px-2 py-0.5 rounded bg-slate-500/10 font-bold transition-all ${theme.hoverItem}`}
                      title="Revenir au dossier parent"
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                    </button>
                  )}
                  <span className="truncate opacity-75"><i className="fa-solid fa-folder-tree mr-1.5 opacity-50 text-amber-500"></i>{currentPath}</span>
                </div>

                {/* Conteneur Liste Fichiers et Dossiers */}
                <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                  {isLoadingFiles ? (
                    <div className={`text-center py-8 text-xs ${theme.mutedText}`}><i className="fa-solid fa-spinner fa-spin mr-2"></i>Chargement du répertoire...</div>
                  ) : (
                    <>
                      {/* Dossiers */}
                      {explorerData.directories.map((dir) => (
                        <button
                          key={dir}
                          onClick={() => handleNavigateToFolder(dir)}
                          className={`w-full text-left p-2.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-2.5 transition-all text-amber-500 ${theme.hoverItem}`}
                        >
                          <i className="fa-solid fa-folder text-base"></i>
                          <span className="truncate">{dir}/</span>
                        </button>
                      ))}

                      {/* Fichiers */}
                      {explorerData.files.map((file) => {
                        const isCurrentActive = selectedFile?.name === file.name;
                        return (
                          <button
                            key={file.name}
                            onClick={() => handleSelectFileItem(file)}
                            className={`w-full text-left p-2.5 rounded-lg font-mono text-xs flex items-center justify-between transition-all border ${
                              isCurrentActive
                                ? 'bg-sky-500/10 border-sky-500/30 text-sky-500 shadow-sm'
                                : `border-transparent text-inherit opacity-90 ${theme.hoverItem}`
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {(() => {
                                const { icon, color } = getFileIcon(file.kind);
                                return <i className={`fa-solid ${icon} ${color} text-base`}></i>;
                              })()}
                              <span className="truncate">{file.name}</span>
                            </div>
                            <span className={`text-[10px] font-sans opacity-40 ml-2 whitespace-nowrap ${theme.mutedText}`}>{file.size}</span>
                          </button>
                        );
                      })}

                      {explorerData.directories.length === 0 && explorerData.files.length === 0 && (
                        <div className={`text-center py-8 text-xs italic opacity-40 ${theme.mutedText}`}>Répertoire vide</div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Inspecteur / Visualiseur & Éditeur (Droite) */}
              <div className="lg:col-span-2 flex flex-col h-full min-h-[450px]">
                {selectedFile ? (
                  <div className={`${theme.card} p-6 flex flex-col flex-1`}>
                    
                    {/* Top File Inspector Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-500/10 pb-4 mb-4">
                      <div>
                        <h4 className="font-bold font-mono text-sm flex items-center gap-2">
                          {(() => {
                            const { icon, color } = getFileIcon(selectedFile.kind);
                            return <i className={`fa-solid ${icon} ${color}`}></i>;
                          })()} {selectedFile.name}
                        </h4>
                        <p className={`text-[11px] mt-0.5 ${theme.mutedText}`}>Type détecté : {selectedFile.kind === 'image' ? 'Image' : selectedFile.kind === 'video' ? 'Vidéo' : selectedFile.kind === 'audio' ? 'Audio' : selectedFile.kind === 'pdf' ? 'Document PDF' : selectedFile.kind === 'code' || selectedFile.kind === 'text' ? 'Texte éditable' : 'Fichier binaire'}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditingFile && (
                          <>
                            <button
                              onClick={() => handleSaveFileContent(true)}
                              className={`px-3 py-1.5 rounded-lg border border-slate-500/25 font-semibold text-xs transition-all ${theme.hoverItem}`}
                            >
                              <i className="fa-solid fa-plus text-[10px] mr-1"></i> Append (Ajouter)
                            </button>
                            <button
                              onClick={() => handleSaveFileContent(false)}
                              className="bg-sky-500 hover:bg-sky-600 px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/10"
                            >
                              <i className="fa-solid fa-floppy-disk text-[10px]"></i> Sauvegarder
                            </button>
                          </>
                        )}

                        {selectedFile.kind !== 'text' && selectedFile.kind !== 'code' && (
                          <a
                            href={fileContent}
                            download={selectedFile.name}
                            onClick={() => triggerToast('success', 'Téléchargement du fichier brut lancé.')}
                            className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                          >
                            <i className="fa-solid fa-download"></i> Télécharger
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Zone d'affichage dynamique */}
                    <div className="flex-1 flex flex-col">
                      {isLoadingFiles ? (
                        <div className="flex-1 flex items-center justify-center opacity-50 text-xs"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Lecture du contenu...</div>
                      ) : selectedFile.kind === 'image' ? (
                        <div className="flex-1 bg-black border border-slate-500/10 rounded-xl overflow-hidden relative group flex items-center justify-center min-h-[320px]">
                          <img src={fileContent} alt="Aperçu média" className="w-full h-full object-contain" id="media-preview" />
                          <button
                            onClick={() => { const el = document.getElementById('media-preview'); if(el) el.requestFullscreen(); }}
                            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Plein écran"
                          >
                            <i className="fa-solid fa-expand"></i>
                          </button>
                        </div>
                      ) : selectedFile.kind === 'video' ? (
                        <div className="flex-1 bg-black border border-slate-500/10 rounded-xl overflow-hidden relative group flex items-center justify-center min-h-[320px]">
                          <video controls src={fileContent} className="w-full h-full object-contain" id="media-preview" />
                          <button
                            onClick={() => { const el = document.getElementById('media-preview'); if(el) el.requestFullscreen(); }}
                            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Plein écran"
                          >
                            <i className="fa-solid fa-expand"></i>
                          </button>
                        </div>
                      ) : selectedFile.kind === 'audio' ? (
                        <div className="flex-1 bg-slate-500/5 border border-slate-500/10 rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px]">
                          <audio controls src={fileContent} className="w-full max-w-md" />
                        </div>
                      ) : selectedFile.kind === 'pdf' ? (
                        <div className="flex-1 bg-slate-500/5 border border-slate-500/10 rounded-xl overflow-hidden">
                          <iframe src={fileContent} className="w-full h-full min-h-[500px] rounded-xl border-0" title={selectedFile.name} />
                        </div>
                      ) : selectedFile.kind === 'text' || selectedFile.kind === 'code' ? (
                        <textarea
                          value={fileContent}
                          onChange={(e) => setFileContent(e.target.value)}
                          className="w-full flex-1 min-h-[350px] p-4 font-mono text-xs rounded-xl border outline-none transition-all bg-slate-900 text-slate-100 border-slate-800 focus:border-sky-500 leading-relaxed"
                          spellCheck="false"
                        />
                      ) : (
                        <div className="flex-1 bg-slate-500/5 border border-slate-500/10 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[300px]">
                          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl"><i className="fa-solid fa-file-circle-question"></i></div>
                          <div>
                            <p className="font-bold text-xs">Fichier non visualisable</p>
                            <p className={`text-[11px] max-w-xs mt-1 leading-normal ${theme.mutedText}`}>Le contenu de ce fichier ne peut pas être affiché. Utilisez l'option de téléchargement pour le récupérer.</p>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className={`${theme.card} p-12 text-center opacity-50 flex flex-col items-center justify-center flex-1 min-h-[300px]`}>
                    <i className="fa-solid fa-folder-open text-3xl mb-3 opacity-30 text-amber-500"></i>
                    <p className="max-w-xs text-xs">Veuillez sélectionner un document ou un média dans l'explorateur pour afficher son contenu ou le modifier.</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* MODALE GENERIQUE DE CONFIRMATION */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-sm flex items-center gap-2 text-amber-500 uppercase tracking-wide">
              <i className="fa-solid fa-triangle-exclamation"></i> {confirmModal.title}
            </h3>
            <p className="text-xs opacity-85 my-4 leading-relaxed whitespace-pre-wrap">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all border border-slate-500/20 ${theme.hoverItem}`}
              >
                Annuler
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="bg-sky-500 hover:bg-sky-600 font-semibold px-4 py-2 rounded-lg text-white transition-all shadow-md shadow-sky-500/20"
              >
                Confirmer l'action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PILE DE TOAST NOTIFICATIONS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-xs w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200 ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
              toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
              'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}
          >
            <i className={`fa-solid ${
              toast.type === 'success' ? 'fa-circle-check' : toast.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-xmark'
            } mt-0.5 text-sm flex-shrink-0`}></i>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider">{toast.type === 'success' ? 'Opération Réussie' : toast.type === 'warning' ? 'Avertissement' : 'Erreur Détectée'}</p>
              <p className="text-xs opacity-90 mt-0.5 leading-normal">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ProcessAndFileManager;

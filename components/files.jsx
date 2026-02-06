const { useState, useEffect, useCallback, useMemo } = React;

// ============================================================================
// API Service
// ============================================================================
const CHUNK_SIZE = 1024 * 1024; // 1MB

const createFileAPI = (baseUrl) => {
  const request = async (endpoint, options = {}) => {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Erreur API');
    return data.data;
  };

  const uploadFile = async (path, file, mkdirs = true, onProgress = null) => {
    const totalSize = file.size;
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('path', path);
      formData.append('mkdirs', mkdirs ? '1' : '0');
      if (i > 0) {
        formData.append('add', '1');
      }
      formData.append('file', chunk, file.name);
      
      const response = await fetch(`${baseUrl}/write`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Erreur upload');
      
      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalChunks) * 100));
      }
    }
    return { success: true };
  };

  return {
    list: (path = '', recursive = false) => 
      request(`/list?path=${encodeURIComponent(path)}&recursive=${recursive ? 1 : 0}`),
    
    read: (path, mode = 'text') => 
      request(`/read?path=${encodeURIComponent(path)}&mode=${mode}`),
    
    write: async (path, content, mkdirs = true) => {
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const formData = new FormData();
      formData.append('path', path);
      formData.append('mkdirs', mkdirs ? '1' : '0');
      formData.append('file', blob, path.split('/').pop());
      
      const response = await fetch(`${baseUrl}/write`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Erreur écriture');
      return data.data;
    },
    
    upload: uploadFile,
    
    delete: (paths, deleteDir = true) => 
      request('/delete', {
        method: 'POST',
        body: JSON.stringify({
          ...(Array.isArray(paths) ? { paths } : { path: paths }),
          deleteDir,
        }),
      }),
    
    mkdir: (path) => 
      request('/mkdir', {
        method: 'POST',
        body: JSON.stringify({ path }),
      }),
    
    zip: (zipPath, paths) => 
      request('/zip', {
        method: 'POST',
        body: JSON.stringify({ zipPath, paths }),
      }),
    
    unzip: (zipPath, dest) => 
      request('/unzip', {
        method: 'POST',
        body: JSON.stringify({ zipPath, dest }),
      }),
  };
};

// ============================================================================
// Icons
// ============================================================================
const Icons = {
  Folder: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z" />
    </svg>
  ),
  FolderOpen: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  File: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  FileText: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  FileCode: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </svg>
  ),
  FileImage: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  FileZip: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 12v6" />
      <path d="m15 15-3 3-3-3" />
    </svg>
  ),
  ChevronRight: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronDown: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Plus: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Edit: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Download: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Upload: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Refresh: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <polyline points="21 3 21 8 16 8" />
    </svg>
  ),
  Home: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Copy: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Cut: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  ),
  Archive: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  ),
  Extract: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 5 17 10" />
      <line x1="12" y1="5" x2="12" y2="15" />
    </svg>
  ),
  Close: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Check: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Save: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Grid: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  List: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Search: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

const Toolbar = ({ 
  onRefresh, 
  onNewFile, 
  onNewFolder, 
  onUpload,
  onDelete,
  onZip,
  onUnzip,
  selectedCount,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-900/90 border-b border-gray-800 flex-wrap backdrop-blur-md">
      <div className="flex items-center gap-1">
        <button onClick={onRefresh} className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-md transition-colors" title="Actualiser">
          <Icons.Refresh className="w-4 h-4" />
        </button>
      </div>
      
      <div className="w-px h-6 bg-gray-800 mx-1" />
      
      <div className="flex items-center gap-1">
        <button onClick={onNewFile} className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-md transition-colors flex items-center gap-2" title="Nouveau fichier">
          <Icons.Plus className="w-4 h-4" />
          <span className="text-xs font-medium hidden lg:inline">Nouveau</span>
        </button>
        <button onClick={onNewFolder} className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-md transition-colors" title="Nouveau dossier">
          <Icons.Folder className="w-4 h-4" />
        </button>
        <button onClick={onUpload} className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-md transition-colors flex items-center gap-2" title="Uploader">
          <Icons.Upload className="w-4 h-4" />
          <span className="text-xs font-medium hidden lg:inline">Importer</span>
        </button>
      </div>
      
      <div className="w-px h-6 bg-gray-800 mx-1" />
      
      <div className="flex items-center gap-1">
        <button 
          onClick={onDelete} 
          disabled={selectedCount === 0}
          className="p-2 hover:bg-red-950/30 text-gray-400 hover:text-red-400 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
          title="Supprimer"
        >
          <Icons.Trash className="w-4 h-4" />
        </button>
        <button 
          onClick={onZip} 
          disabled={selectedCount === 0}
          className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
          title="Compresser"
        >
          <Icons.Archive className="w-4 h-4" />
        </button>
        <button 
          onClick={onUnzip} 
          disabled={selectedCount !== 1}
          className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
          title="Extraire"
        >
          <Icons.Extract className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1" />
      
      <div className="relative flex items-center">
        <Icons.Search className="absolute left-3 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher..."
          className="pl-9 pr-3 py-1.5 bg-gray-950/50 border border-gray-800 rounded-lg text-xs w-48 lg:w-64 focus:outline-none focus:border-blue-500/50 focus:bg-gray-950 transition-all"
        />
      </div>
      
      <div className="flex bg-gray-950/50 p-1 rounded-lg border border-gray-800">
        <button 
          onClick={() => onViewModeChange('grid')}
          className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-800 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Icons.Grid className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => onViewModeChange('list')}
          className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-800 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Icons.List className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ currentPath, onNavigate }) => {
  const sections = [
    {
      title: 'Favoris',
      items: [
        { label: 'Accueil', icon: Icons.Home, path: '' },
        { label: 'Bureau', icon: Icons.Grid, path: 'Desktop' },
        { label: 'Documents', icon: Icons.Folder, path: 'Documents' },
        { label: 'Images', icon: Icons.FileImage, path: 'Images' },
        { label: 'Téléchargements', icon: Icons.Download, path: 'Downloads' },
      ]
    },
    {
      title: 'Emplacements',
      items: [
        { label: 'Ce PC', icon: Icons.Archive, path: 'root' },
        { label: 'Réseau', icon: Icons.Refresh, path: 'network' },
      ]
    }
  ];

  return (
    <div className="w-64 bg-gray-900/80 border-r border-gray-800 flex flex-col hidden md:flex backdrop-blur-md">
      <div className="flex-1 overflow-y-auto pt-4">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <div className="px-6 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em]">
              {section.title}
            </div>
            <nav className="px-3 space-y-0.5">
              {section.items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-all duration-200 group
                    ${currentPath === item.path 
                      ? 'bg-blue-600/20 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]' 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${currentPath === item.path ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-800 bg-gray-900/40 font-mono tracking-tighter">
        <div className="flex items-center gap-3 px-3 py-2 text-[11px] font-medium text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
          <span className="uppercase tracking-wider">Serveur Connecté</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main FileManager Component
// ============================================================================
const FileManager = ({ baseUrl = '', className = '' }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  
  const [modal, setModal] = useState({ type: null, data: null });

  const api = useMemo(() => createFileAPI(baseUrl), [baseUrl]);

  const loadDirectory = useCallback(async (path = '') => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const data = await api.list(path);
      const rawItems = data.items || data || [];
      // Normaliser les données API (type/path -> isDir/name)
      const normalizedItems = rawItems.map(item => ({
        ...item,
        name: item.name || item.path?.split('/').pop() || item.path,
        isDir: item.isDir ?? (item.type === 'dir'),
      }));
      const sortedItems = normalizedItems.sort((a, b) => {
        if (a.isDir !== b.isDir) return b.isDir - a.isDir;
        return a.name.localeCompare(b.name);
      });
      setItems(sortedItems);
      setCurrentPath(path);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (baseUrl) loadDirectory('');
  }, [baseUrl, loadDirectory]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(query));
  }, [items, searchQuery]);

  const selectedItems = useMemo(() => 
    items.filter(item => selected.has(item.name)),
    [items, selected]
  );

  const handleSelect = (item, e) => {
    if (e.ctrlKey || e.metaKey) {
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(item.name)) next.delete(item.name);
        else next.add(item.name);
        return next;
      });
    } else if (e.shiftKey && selected.size > 0) {
      const lastSelected = Array.from(selected).pop();
      const lastIndex = items.findIndex(i => i.name === lastSelected);
      const currentIndex = items.findIndex(i => i.name === item.name);
      const [start, end] = [Math.min(lastIndex, currentIndex), Math.max(lastIndex, currentIndex)];
      setSelected(new Set(items.slice(start, end + 1).map(i => i.name)));
    } else {
      setSelected(new Set([item.name]));
    }
  };

  const handleOpen = async (item) => {
    if (item.isDir) {
      loadDirectory(joinPath(currentPath, item.name));
    } else {
      try {
        const data = await api.read(joinPath(currentPath, item.name), 'text');
        setModal({ 
          type: 'edit', 
          data: { 
            path: joinPath(currentPath, item.name), 
            content: data.content || data 
          } 
        });
      } catch (err) {
        setError(`Impossible de lire le fichier: ${err.message}`);
      }
    }
  };

  const handleContextMenu = (item, e) => {
    if (!selected.has(item.name)) {
      setSelected(new Set([item.name]));
    }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Ouvrir', icon: Icons.FolderOpen, onClick: () => handleOpen(item) },
        { label: 'Renommer', icon: Icons.Edit, onClick: () => {} },
        { separator: true },
        { label: 'Copier', icon: Icons.Copy, onClick: () => {} },
        { label: 'Couper', icon: Icons.Cut, onClick: () => {} },
        { separator: true },
        { label: 'Compresser', icon: Icons.Archive, onClick: () => setModal({ type: 'zip' }) },
        ...(item.name.endsWith('.zip') ? [{ label: 'Extraire', icon: Icons.Extract, onClick: () => setModal({ type: 'unzip', data: item }) }] : []),
        { separator: true },
        { label: 'Supprimer', icon: Icons.Trash, onClick: () => setModal({ type: 'delete' }) },
      ],
    });
  };

  const handleSave = async (path, content) => {
    await api.write(path, content);
    loadDirectory(currentPath);
    setModal({ type: null });
  };

  const handleDelete = async () => {
    const paths = selectedItems.map(item => joinPath(currentPath, item.name));
    await api.delete(paths);
    loadDirectory(currentPath);
  };

  const handleUpload = async (path, file, onProgress) => {
    await api.upload(path, file, true, onProgress);
    loadDirectory(currentPath);
  };

  const handleMkdir = async (path) => {
    await api.mkdir(path);
    loadDirectory(currentPath);
  };

  const handleZip = async (zipPath, paths) => {
    await api.zip(zipPath, paths);
    loadDirectory(currentPath);
  };

  const handleUnzip = async (zipPath, dest) => {
    await api.unzip(zipPath, dest);
    loadDirectory(currentPath);
  };

  if (!baseUrl) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        Veuillez configurer le baseUrl du serveur
      </div>
    );
  }

  return (
    <div className={`flex h-full bg-black text-white ${className}`}>
      <Sidebar currentPath={currentPath} onNavigate={loadDirectory} />
      
      <div className="flex-1 flex flex-col min-w-0 bg-gray-900/30">
        <Toolbar
          onRefresh={() => loadDirectory(currentPath)}
          onNewFile={() => setModal({ type: 'newFile', data: { path: currentPath } })}
          onNewFolder={() => setModal({ type: 'newFolder' })}
          onUpload={() => setModal({ type: 'upload' })}
          onDelete={() => setModal({ type: 'delete' })}
          onZip={() => setModal({ type: 'zip' })}
          onUnzip={() => selectedItems[0] && setModal({ type: 'unzip', data: selectedItems[0] })}
          selectedCount={selected.size}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-800 flex items-center gap-4">
          <div className="flex gap-1">
            <button 
              onClick={() => {
                const parent = currentPath.split('/').slice(0, -1).join('/');
                loadDirectory(parent);
              }}
              disabled={!currentPath}
              className="p-1.5 hover:bg-gray-800 rounded-md disabled:opacity-30"
            >
              <Icons.ChevronDown className="rotate-90" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <Breadcrumb path={currentPath} onNavigate={loadDirectory} />
          </div>
        </div>

        {error && (
          <div className="mx-4 my-2 px-3 py-2 bg-red-900/20 border border-red-900/50 text-red-400 text-sm rounded-md">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Chargement des fichiers...</span>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-center justify-center h-full text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <Icons.Folder className="w-12 h-12 opacity-20" />
                <span className="text-sm font-medium">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Ce dossier est vide'}
                </span>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-4 grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-4">
              {filteredItems.map(item => (
                <FileItemGrid
                  key={item.name}
                  item={item}
                  isSelected={selected.has(item.name)}
                  onSelect={(e) => handleSelect(item, e)}
                  onOpen={() => handleOpen(item)}
                  onContextMenu={(e) => handleContextMenu(item, e)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800 sticky top-0 bg-gray-900/90 backdrop-blur-sm z-10">
                <div className="flex-1">Nom</div>
                <div className="w-24 text-right">Taille</div>
                <div className="w-36 text-right">Modifié</div>
              </div>
              <div className="divide-y divide-gray-800/50">
                {filteredItems.map(item => (
                  <FileItemList
                    key={item.name}
                    item={item}
                    isSelected={selected.has(item.name)}
                    onSelect={(e) => handleSelect(item, e)}
                    onOpen={() => handleOpen(item)}
                    onContextMenu={(e) => handleContextMenu(item, e)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-gray-900/80 border-t border-gray-800 text-[11px] text-gray-500 flex justify-between items-center">
          <div>
            {filteredItems.length} élément(s) 
            {selected.size > 0 && <span className="ml-2 font-medium text-blue-400">• {selected.size} sélectionné(s)</span>}
          </div>
          <div className="flex items-center gap-3">
            <span>{baseUrl}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
        </div>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      <Modal
        isOpen={modal.type === 'edit'}
        onClose={() => setModal({ type: null })}
        title={modal.data?.path?.split('/').pop() || 'Éditeur'}
        size="xl"
      >
        {modal.type === 'edit' && (
          <FileEditor
            path={modal.data.path}
            content={modal.data.content}
            onSave={handleSave}
            onClose={() => setModal({ type: null })}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === 'newFile'}
        onClose={() => setModal({ type: null })}
        title="Nouveau fichier"
        size="xl"
      >
        {modal.type === 'newFile' && (
          <FileEditor
            path={modal.data.path}
            content=""
            isNew
            onSave={handleSave}
            onClose={() => setModal({ type: null })}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === 'newFolder'}
        onClose={() => setModal({ type: null })}
        title="Nouveau dossier"
        size="sm"
      >
        {modal.type === 'newFolder' && (
          <NewFolderModal
            currentPath={currentPath}
            onCreate={handleMkdir}
            onClose={() => setModal({ type: null })}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === 'upload'}
        onClose={() => setModal({ type: null })}
        title="Uploader des fichiers"
        size="md"
      >
        {modal.type === 'upload' && (
          <UploadModal
            currentPath={currentPath}
            onUpload={handleUpload}
            onClose={() => setModal({ type: null })}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === 'delete'}
        onClose={() => setModal({ type: null })}
        title="Confirmer la suppression"
        size="sm"
      >
        {modal.type === 'delete' && (
          <DeleteModal
            selectedItems={selectedItems}
            onDelete={handleDelete}
            onClose={() => setModal({ type: null })}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === 'zip'}
        onClose={() => setModal({ type: null })}
        title="Compresser"
        size="sm"
      >
        {modal.type === 'zip' && (
          <ZipModal
            selectedItems={selectedItems}
            currentPath={currentPath}
            onZip={handleZip}
            onClose={() => setModal({ type: null })}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === 'unzip'}
        onClose={() => setModal({ type: null })}
        title="Extraire"
        size="sm"
      >
        {modal.type === 'unzip' && modal.data && (
          <UnzipModal
            selectedItem={modal.data}
            currentPath={currentPath}
            onUnzip={handleUnzip}
            onClose={() => setModal({ type: null })}
          />
        )}
      </Modal>
    </div>
  );
};

const FileManagers = () => {
  const [urls, setUrls] = React.useState(() => {
    const saved = localStorage.getItem('fileManagerUrls');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = React.useState(0);
  const [newUrl, setNewUrl] = React.useState('');
  const [showAddInput, setShowAddInput] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('fileManagerUrls', JSON.stringify(urls));
  }, [urls]);

  const addUrl = () => {
    if (newUrl.trim() && !urls.includes(newUrl.trim())) {
      setUrls([...urls, newUrl.trim()]);
      setNewUrl('');
      setShowAddInput(false);
    }
  };

  const removeUrl = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
      if (activeTab >= newUrls.length) {
        setActiveTab(newUrls.length - 1);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center bg-gray-900 border-b border-gray-700">
        <div className="flex flex-1 overflow-x-auto">
          {urls.map((url, index) => (
            <div
              key={index}
              className={`flex items-center group ${
                activeTab === index
                  ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <button
                onClick={() => setActiveTab(index)}
                className="px-4 py-2 text-sm"
              >
                {url.replace(/^.*\//, '') || `Source ${index + 1}`}
              </button>
              {urls.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUrl(index);
                  }}
                  className="pr-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Supprimer"
                >
                  <Icons.Close />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {showAddInput ? (
          <div className="flex items-center gap-2 px-2 py-1">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addUrl()}
              placeholder="/api/files"
              className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={addUrl}
              className="p-1 text-green-400 hover:bg-gray-700 rounded"
            >
              <Icons.Check />
            </button>
            <button
              onClick={() => { setShowAddInput(false); setNewUrl(''); }}
              className="p-1 text-gray-400 hover:bg-gray-700 rounded"
            >
              <Icons.Close />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddInput(true)}
            className="p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Ajouter une source"
          >
            <Icons.Plus />
          </button>
        )}
      </div>
      <div className="flex-1">
        {urls.length > 0 ? (
          <FileManager key={`${activeTab}-${urls[activeTab]}`} baseUrl={urls[activeTab]} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Icons.Folder />
              <p className="mt-2">Cliquez sur + pour ajouter une source</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManagers;
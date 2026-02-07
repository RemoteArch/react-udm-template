const { useState, useEffect, useCallback, useMemo } = React;

// ============================================================================
// Utils
// ============================================================================
const joinPath = (...parts) => {
  return parts.filter(Boolean).join('/').replace(/\/+/g, '/');
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date) => {
  if (!date) return '-';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getFileIcon = (name, isDir) => {
  if (isDir) return Icons.Folder;
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'txt': case 'md': case 'log': return Icons.FileText;
    case 'js': case 'jsx': case 'ts': case 'tsx': case 'html': case 'css': case 'json': case 'py': return Icons.FileCode;
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': case 'webp': return Icons.FileImage;
    case 'zip': case 'rar': case '7z': case 'gz': return Icons.FileZip;
    default: return Icons.File;
  }
};

// ============================================================================
// Helper Components
// ============================================================================
const Breadcrumb = ({ path, onNavigate }) => {
  const parts = path.split('/').filter(Boolean);
  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
      <button 
        onClick={() => onNavigate('')}
        className="px-2 py-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
      >
        <Icons.Home className="w-3.5 h-3.5" />
        <span className="font-medium">root</span>
      </button>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <Icons.ChevronRight className="w-3 h-3 text-gray-600" />
          <button
            onClick={() => onNavigate(parts.slice(0, i + 1).join('/'))}
            className="px-2 py-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors font-medium"
          >
            {part}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

const FileItemGrid = ({ item, isSelected, onSelect, onOpen, onContextMenu }) => {
  const Icon = getFileIcon(item.name, item.isDir);
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      className={`flex flex-col items-center p-3 rounded-xl cursor-default select-none transition-all group border
        ${isSelected 
          ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
          : 'bg-transparent border-transparent hover:bg-gray-800/40 hover:border-gray-700/50'}`}
    >
      <div className={`relative p-3 rounded-lg mb-2 transition-transform duration-200 group-hover:scale-110
        ${item.isDir ? 'text-blue-400' : 'text-gray-400'}`}>
        <Icon className="w-12 h-12" />
        {item.isDir && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform" />}
      </div>
      <span className="text-[11px] font-medium text-center truncate w-full px-1" title={item.name}>
        {item.name}
      </span>
    </div>
  );
};

const FileItemList = ({ item, isSelected, onSelect, onOpen, onContextMenu }) => {
  const Icon = getFileIcon(item.name, item.isDir);
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      className={`flex items-center gap-4 px-4 py-2 cursor-default select-none transition-colors
        ${isSelected ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800/50 text-gray-300'}`}
    >
      <div className={`flex-shrink-0 ${item.isDir ? 'text-blue-400' : 'text-gray-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 font-medium text-sm truncate">
        {item.name}
      </div>
      <div className="w-24 text-right text-xs font-mono text-gray-500">
        {item.isDir ? '-' : formatSize(item.size)}
      </div>
      <div className="w-36 text-right text-xs font-mono text-gray-500">
        {formatDate(item.modifiedAt)}
      </div>
    </div>
  );
};

const ContextMenu = ({ x, y, items, onClose }) => {
  useEffect(() => {
    const handleGlobalClick = () => onClose();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [onClose]);

  return (
    <div 
      className="fixed z-[9999] w-56 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in duration-100"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        item.separator ? (
          <div key={i} className="my-1 border-t border-gray-800" />
        ) : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-blue-600 hover:text-white transition-colors group"
          >
            {item.icon && <item.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />}
            <span>{item.label}</span>
          </button>
        )
      ))}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full ${sizes[size]} bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-colors">
            <Icons.Close className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const FileEditor = ({ path, content: initialContent, isNew, onSave, onClose }) => {
  const [content, setContent] = useState(initialContent);
  const [fileName, setFileName] = useState(isNew ? '' : path.split('/').pop());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const fullPath = isNew ? joinPath(path, fileName) : path;
      await onSave(fullPath, content);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isNew && (
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Nom du fichier</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="script.js"
            autoFocus
          />
        </div>
      )}
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Contenu</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-96 bg-black border border-gray-800 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors resize-none"
          spellCheck="false"
        />
      </div>
      <div className="flex justify-end gap-3 mt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Annuler</button>
        <button
          onClick={handleSave}
          disabled={isSaving || (isNew && !fileName)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};

const NewFolderModal = ({ currentPath, onCreate, onClose }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate(joinPath(currentPath, name.trim()));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Nom du dossier</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Nouveau dossier"
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Annuler</button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-bold transition-all"
        >
          Créer
        </button>
      </div>
    </form>
  );
};

const UploadModal = ({ currentPath, onUpload, onClose }) => {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    setIsUploading(true);
    for (const file of files) {
      await onUpload(currentPath, file, (p) => {
        setProgress(prev => ({ ...prev, [file.name]: p }));
      });
    }
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative group">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="border-2 border-dashed border-gray-800 group-hover:border-blue-500/50 rounded-2xl p-8 transition-colors text-center">
          <Icons.Upload className="w-10 h-10 text-gray-600 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
          <p className="text-sm text-gray-400 group-hover:text-gray-300">
            {files.length > 0 ? `${files.length} fichiers sélectionnés` : 'Cliquez ou glissez-déposez pour uploader'}
          </p>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-2 px-1">
          {files.map(file => (
            <div key={file.name} className="flex flex-col gap-1.5 p-3 bg-black/50 border border-gray-800 rounded-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-300 truncate max-w-[200px]">{file.name}</span>
                <span className="text-gray-500 font-mono">{progress[file.name] || 0}%</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${progress[file.name] || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-800 pt-6">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Annuler</button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          {isUploading ? 'Transfert en cours...' : 'Démarrer l\'upload'}
        </button>
      </div>
    </div>
  );
};

const DeleteModal = ({ selectedItems, onDelete, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 p-4 bg-red-900/10 border border-red-900/20 rounded-xl">
        <Icons.Trash className="w-8 h-8 text-red-500" />
        <div>
          <p className="text-sm font-bold text-red-400">Confirmer la suppression ?</p>
          <p className="text-xs text-red-400/70">Cette action est irréversible.</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 px-1">
        Êtes-vous sûr de vouloir supprimer {selectedItems.length} élément(s) ?
      </p>
      <div className="flex justify-end gap-3 mt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Annuler</button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-600/20"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
};

const ZipModal = ({ selectedItems, currentPath, onZip, onClose }) => {
  const [name, setName] = useState(selectedItems.length === 1 ? `${selectedItems[0].name}.zip` : 'archive.zip');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const paths = selectedItems.map(item => joinPath(currentPath, item.name));
      await onZip(joinPath(currentPath, name), paths);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Nom de l'archive</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="archive.zip"
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Annuler</button>
        <button
          onClick={handleConfirm}
          disabled={loading || !name.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-bold transition-all"
        >
          Compresser
        </button>
      </div>
    </div>
  );
};

const UnzipModal = ({ selectedItem, currentPath, onUnzip, onClose }) => {
  const [dest, setDest] = useState(currentPath);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onUnzip(joinPath(currentPath, selectedItem.name), dest);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="p-3 bg-blue-900/10 border border-blue-900/20 rounded-xl mb-2">
        <p className="text-xs font-bold text-blue-400 uppercase mb-1">Archive</p>
        <p className="text-sm text-gray-300 font-mono truncate">{selectedItem.name}</p>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Dossier de destination</label>
        <input
          type="text"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="/destination/path"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Annuler</button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-bold transition-all"
        >
          Extraire
        </button>
      </div>
    </div>
  );
};

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
  // --- Logique (Conservée à l'identique) ---
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
    e.preventDefault(); // Empêche le menu navigateur par défaut
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
        { label: 'Supprimer', icon: Icons.Trash, onClick: () => setModal({ type: 'delete' }), danger: true },
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
    setModal({ type: null });
  };

  const handleUpload = async (path, file, onProgress) => {
    await api.upload(path, file, true, onProgress);
    loadDirectory(currentPath);
    setModal({ type: null });
  };

  const handleMkdir = async (path) => {
    await api.mkdir(path);
    loadDirectory(currentPath);
    setModal({ type: null });
  };

  const handleZip = async (zipPath, paths) => {
    await api.zip(zipPath, paths);
    loadDirectory(currentPath);
    setModal({ type: null });
  };

  const handleUnzip = async (zipPath, dest) => {
    await api.unzip(zipPath, dest);
    loadDirectory(currentPath);
    setModal({ type: null });
  };

  // --- Rendu UI Amélioré ---
  if (!baseUrl) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 bg-[#0B0F1A] text-slate-500 rounded-2xl border-2 border-dashed border-white/5 ${className}`}>
        <Icons.AlertTriangle className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-sm font-medium italic">Veuillez configurer le baseUrl du serveur</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-[#0B0F1A] text-slate-200 shadow-2xl overflow-hidden border border-white/5 ${className}`}>
      
      {/* 1. Header Toolbar */}
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

      {/* 2. Breadcrumb & Navigation */}
      <div className="flex items-center px-4 py-3 bg-white/[0.02] border-b border-white/5 backdrop-blur-md gap-4">
        <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
          <button 
            onClick={() => {
              const parent = currentPath.split('/').slice(0, -1).join('/');
              loadDirectory(parent);
            }}
            disabled={!currentPath}
            className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-20 transition-all active:scale-90"
          >
            <Icons.ChevronDown className="rotate-90 w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Breadcrumb path={currentPath} onNavigate={loadDirectory} />
        </div>
      </div>

      {/* 3. Status Error */}
      {error && (
        <div className="mx-4 my-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-3 animate-in slide-in-from-top-1">
          <Icons.AlertCircle size={14} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* 4. Main Explorer View */}
      <div className="flex-1 overflow-auto custom-scrollbar relative" onClick={() => setSelected(new Set())}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icons.Folder size={16} className="text-blue-500 animate-pulse" />
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">Récupération...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <Icons.FolderOpen className="w-16 h-16 mb-4 stroke-[1px]" />
            <span className="text-sm font-medium italic">
              {searchQuery ? 'Aucun résultat pour cette recherche' : 'Dossier vide'}
            </span>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-6 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-6">
            {filteredItems.map(item => (
              <FileItemGrid
                key={item.name}
                item={item}
                isSelected={selected.has(item.name)}
                onSelect={(e) => { e.stopPropagation(); handleSelect(item, e); }}
                onOpen={() => handleOpen(item)}
                onContextMenu={(e) => handleContextMenu(item, e)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-[#0B0F1A]/95 backdrop-blur-sm z-10">
              <div className="flex-1">Nom du fichier</div>
              <div className="w-24 text-right">Taille</div>
              <div className="w-40 text-right">Dernière modification</div>
            </div>
            <div className="px-2 py-2">
              {filteredItems.map(item => (
                <FileItemList
                  key={item.name}
                  item={item}
                  isSelected={selected.has(item.name)}
                  onSelect={(e) => { e.stopPropagation(); handleSelect(item, e); }}
                  onOpen={() => handleOpen(item)}
                  onContextMenu={(e) => handleContextMenu(item, e)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Footer Info Bar */}
      <div className="px-5 py-2 bg-black/60 border-t border-white/5 text-[10px] text-slate-500 flex justify-between items-center backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 font-bold">{filteredItems.length}</span>
            <span>éléments</span>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-1.5 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
              <Icons.Check size={10} strokeWidth={3} />
              <span className="font-bold">{selected.size} sélectionné(s)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 font-mono opacity-50">
          <span className="truncate max-w-[200px]">{baseUrl}</span>
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
        </div>
      </div>

      {/* --- Overlay Components --- */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Modals Mapping (Exactement comme ta logique originale) */}
      <Modal isOpen={modal.type === 'edit'} onClose={() => setModal({ type: null })} title={modal.data?.path?.split('/').pop() || 'Éditeur'} size="xl">
        {modal.type === 'edit' && <FileEditor path={modal.data.path} content={modal.data.content} onSave={handleSave} onClose={() => setModal({ type: null })} />}
      </Modal>

      <Modal isOpen={modal.type === 'newFile'} onClose={() => setModal({ type: null })} title="Nouveau fichier" size="xl">
        {modal.type === 'newFile' && <FileEditor path={modal.data.path} content="" isNew onSave={handleSave} onClose={() => setModal({ type: null })} />}
      </Modal>

      <Modal isOpen={modal.type === 'newFolder'} onClose={() => setModal({ type: null })} title="Nouveau dossier" size="sm">
        {modal.type === 'newFolder' && <NewFolderModal currentPath={currentPath} onCreate={handleMkdir} onClose={() => setModal({ type: null })} />}
      </Modal>

      <Modal isOpen={modal.type === 'upload'} onClose={() => setModal({ type: null })} title="Uploader des fichiers" size="md">
        {modal.type === 'upload' && <UploadModal currentPath={currentPath} onUpload={handleUpload} onClose={() => setModal({ type: null })} />}
      </Modal>

      <Modal isOpen={modal.type === 'delete'} onClose={() => setModal({ type: null })} title="Confirmer la suppression" size="sm">
        {modal.type === 'delete' && <DeleteModal selectedItems={selectedItems} onDelete={handleDelete} onClose={() => setModal({ type: null })} />}
      </Modal>

      <Modal isOpen={modal.type === 'zip'} onClose={() => setModal({ type: null })} title="Compresser" size="sm">
        {modal.type === 'zip' && <ZipModal selectedItems={selectedItems} currentPath={currentPath} onZip={handleZip} onClose={() => setModal({ type: null })} />}
      </Modal>

      <Modal isOpen={modal.type === 'unzip'} onClose={() => setModal({ type: null })} title="Extraire" size="sm">
        {modal.type === 'unzip' && modal.data && <UnzipModal selectedItem={modal.data} currentPath={currentPath} onUnzip={handleUnzip} onClose={() => setModal({ type: null })} />}
      </Modal>
    </div>
  );
};

const APILINKURL = "http://cdn.jsdelivr.net/gh/remotearch/php-api-template/file.php";

const FileManagers = () => {
  // --- Logique d'état et Persistance ---
  const [sources, setSources] = React.useState(() => {
    const saved = localStorage.getItem('fileManagerUrls');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      if (parsed.length === 0) return [];
      
      // Migration des anciennes chaînes vers des objets
      if (typeof parsed[0] === 'string') {
        return parsed.map((url, i) => ({
          name: (String(url).replace(/^.*\//, '') || `Source ${i + 1}`),
          url: String(url),
        }));
      }
      return parsed
        .filter((s) => s && typeof s === 'object')
        .map((s, i) => ({
          name: (typeof s.name === 'string' && s.name.trim()) ? s.name.trim() : `Source ${i + 1}`,
          url: typeof s.url === 'string' ? s.url : '',
        }))
        .filter((s) => s.url);
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = React.useState(null);
  const [newSourceName, setNewSourceName] = React.useState('');
  const [newSourceUrl, setNewSourceUrl] = React.useState('');
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('fileManagerUrls', JSON.stringify(sources));
  }, [sources]);

  // --- Actions ---
  const addSource = () => {
    const name = newSourceName.trim();
    const url = newSourceUrl.trim();
    if (!name || !url) return;
    if (sources.some((s) => s.url === url)) return;
    
    setSources([...sources, { name, url }]);
    setNewSourceName('');
    setNewSourceUrl('');
    setIsAddModalOpen(false);
  };

  const removeSource = (index) => {
    const next = sources.filter((_, i) => i !== index);
    setSources(next);
    
    if (activeTab === index) {
      setActiveTab(null);
    } else if (activeTab > index) {
      setActiveTab(activeTab - 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F1117] text-slate-300 font-sans">
      
      {/* --- BARRE D'ONGLETS (Header) --- */}
      <div className="flex items-center px-4 bg-gray-900/80 backdrop-blur-xl border-b border-white/5 h-14 shrink-0">
        <div className="flex items-center flex-1 gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          
          {/* Bouton Dashboard / Sources */}
          <button
            onClick={() => setActiveTab(null)}
            className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === null 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
              : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Icons.Folder className="w-4 h-4 mr-2" />
            Sources
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-2 shrink-0" />

          {/* Liste des onglets actifs */}
          {sources.map((source, index) => (
            <div
              key={index}
              className={`group flex items-center min-w-fit h-9 px-3 rounded-lg text-sm transition-all duration-200 border ${
                activeTab === index
                  ? 'bg-white/10 text-white border-white/10 shadow-sm'
                  : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <button
                onClick={() => setActiveTab(index)}
                className="truncate max-w-[140px] font-medium"
              >
                {source.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSource(index);
                }}
                className="ml-2 p-0.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Icons.Close size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Bouton Ajouter Rapidement */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="ml-4 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95 group"
          title="Ajouter une source"
        >
          <Icons.Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 w-3" />
        </button>

        {/* Bouton Télécharger le fichier PHP */}
        <a
          href={APILINKURL}
          download="file.php"
          className="ml-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all active:scale-95"
          title="Télécharger le fichier PHP"
        >
          <Icons.Download size={18} />
        </a>
      </div>

      {/* --- ZONE DE CONTENU --- */}
      <div className="flex-1 overflow-y-auto relative">
        {activeTab === null ? (
          <div className="w-full p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">Gestionnaire de fichiers</h2>
              <p className="text-slate-500 mt-2">Sélectionnez une source pour explorer vos fichiers ou ajoutez-en une nouvelle.</p>
            </header>
            
            {sources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sources.map((source, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className="group relative flex flex-col p-6 rounded-2xl bg-[#161922] border border-white/5 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/10 text-left overflow-hidden"
                  >
                    {/* Décoration subtile en arrière-plan */}
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        <Icons.Folder size={24} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-black/20 px-2 py-1 rounded">URL Distante</span>
                    </div>
                    
                    <div className="font-bold text-lg text-slate-100 group-hover:text-blue-400 transition-colors truncate">
                      {source.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono truncate mt-2 bg-black/30 p-2 rounded-lg border border-white/5">
                      {source.url}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 text-slate-700 shadow-inner">
                  <Icons.Folder size={40} />
                </div>
                <h3 className="text-xl font-medium text-slate-300">Aucune source configurée</h3>
                <p className="text-slate-500 mt-2 mb-8 text-center max-w-xs">Connectez votre premier serveur de fichiers pour commencer l'exploration.</p>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                  >
                    <Icons.Plus size={18} className="mr-2" />
                    Ajouter une source
                  </button>
                  <a
                    href={APILINKURL}
                    download="file.php"
                    className="flex items-center px-6 py-3 bg-white/5 text-slate-300 rounded-xl font-medium hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                  >
                    <Icons.Download size={18} className="mr-2" />
                    Télécharger le PHP
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          sources[activeTab] && (
            <div className="h-full animate-in fade-in duration-500">
               <FileManager 
                key={`${activeTab}-${sources[activeTab].url}`} 
                baseUrl={sources[activeTab].url} 
               />
            </div>
          )
        )}
      </div>

      {/* --- MODAL AJOUT --- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewSourceName('');
          setNewSourceUrl('');
        }}
        title="Nouvelle Connexion"
      >
        <div className="space-y-6 p-1">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nom descriptif</label>
            <input
              type="text"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              className="w-full bg-[#0F1117] border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
              placeholder="ex: Serveur de Production"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">URL de l'API</label>
            <input
              type="text"
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSource()}
              className="w-full bg-[#0F1117] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
              placeholder="https://api.votre-domaine.com"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={addSource}
              disabled={!newSourceName.trim() || !newSourceUrl.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition-all active:scale-[0.98]"
            >
              Ajouter la source
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FileManagers;
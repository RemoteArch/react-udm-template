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
  Folder: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  ),
  FolderOpen: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
      <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
    </svg>
  ),
  File: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  ),
  FileCode: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  ),
  FileImage: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  ),
  FileZip: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm4 0h2v2H8V4zm2 4H8v2h2V8zm-2 4h2v2H8v-2z" clipRule="evenodd" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Home: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Cut: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  ),
  Paste: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Archive: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  Extract: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Save: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  Grid: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  List: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

// ============================================================================
// Utility Functions
// ============================================================================
const getFileIcon = (name, isDir) => {
  if (isDir) return Icons.Folder;
  const ext = name.split('.').pop()?.toLowerCase();
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'php'];
  const zipExts = ['zip', 'rar', '7z', 'tar', 'gz'];
  
  if (imageExts.includes(ext)) return Icons.FileImage;
  if (codeExts.includes(ext)) return Icons.FileCode;
  if (zipExts.includes(ext)) return Icons.FileZip;
  if (['txt', 'md', 'log'].includes(ext)) return Icons.FileText;
  return Icons.File;
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const joinPath = (...parts) => parts.filter(Boolean).join('/').replace(/\/+/g, '/');

// ============================================================================
// Modal Component
// ============================================================================
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} mx-4 max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <Icons.Close />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Context Menu Component
// ============================================================================
const ContextMenu = ({ x, y, items, onClose }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div 
      className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        item.separator ? (
          <div key={i} className="border-t border-gray-600 my-1" />
        ) : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            disabled={item.disabled}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {item.icon && <item.icon />}
            {item.label}
          </button>
        )
      ))}
    </div>
  );
};

// ============================================================================
// Breadcrumb Component
// ============================================================================
const Breadcrumb = ({ path, onNavigate }) => {
  const parts = path.split('/').filter(Boolean);
  
  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto">
      <button 
        onClick={() => onNavigate('')}
        className="p-1 hover:bg-gray-700 rounded flex-shrink-0"
      >
        <Icons.Home />
      </button>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className="text-gray-500">/</span>
          <button
            onClick={() => onNavigate(parts.slice(0, i + 1).join('/'))}
            className="px-2 py-1 hover:bg-gray-700 rounded truncate max-w-[150px]"
          >
            {part}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

// ============================================================================
// Toolbar Component
// ============================================================================
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
    <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700 flex-wrap">
      <button onClick={onRefresh} className="p-2 hover:bg-gray-700 rounded" title="Actualiser">
        <Icons.Refresh />
      </button>
      
      <div className="w-px h-6 bg-gray-600" />
      
      <button onClick={onNewFile} className="p-2 hover:bg-gray-700 rounded" title="Nouveau fichier">
        <Icons.Plus />
      </button>
      <button onClick={onNewFolder} className="p-2 hover:bg-gray-700 rounded" title="Nouveau dossier">
        <Icons.Folder />
      </button>
      <button onClick={onUpload} className="p-2 hover:bg-gray-700 rounded" title="Uploader">
        <Icons.Upload />
      </button>
      
      <div className="w-px h-6 bg-gray-600" />
      
      <button 
        onClick={onDelete} 
        disabled={selectedCount === 0}
        className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-red-400" 
        title="Supprimer"
      >
        <Icons.Trash />
      </button>
      <button 
        onClick={onZip} 
        disabled={selectedCount === 0}
        className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
        title="Compresser"
      >
        <Icons.Archive />
      </button>
      <button 
        onClick={onUnzip} 
        disabled={selectedCount !== 1}
        className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
        title="Extraire"
      >
        <Icons.Extract />
      </button>
      
      <div className="flex-1" />
      
      <div className="relative flex items-center space-x-5">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher..."
          className="pl-8 pr-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm w-48 focus:outline-none focus:border-blue-500"
        />
      </div>
      
      <div className="flex bg-gray-700 rounded">
        <button 
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-l ${viewMode === 'grid' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
        >
          <Icons.Grid />
        </button>
        <button 
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-r ${viewMode === 'list' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
        >
          <Icons.List />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// File Item Component (Grid View)
// ============================================================================
const FileItemGrid = ({ item, isSelected, onSelect, onOpen, onContextMenu }) => {
  const Icon = getFileIcon(item.name, item.isDir);
  
  return (
    <div
      className={`p-3 rounded-lg cursor-pointer flex flex-col items-center gap-2 transition-colors
        ${isSelected ? 'bg-blue-600/30 ring-2 ring-blue-500' : 'hover:bg-gray-700'}`}
      onClick={(e) => onSelect(e)}
      onDoubleClick={() => onOpen()}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e); }}
    >
      <div className={`text-3xl ${item.isDir ? 'text-yellow-400' : 'text-gray-400'}`}>
        <Icon />
      </div>
      <span className="text-sm text-center truncate w-full" title={item.name}>
        {item.name}
      </span>
    </div>
  );
};

// ============================================================================
// File Item Component (List View)
// ============================================================================
const FileItemList = ({ item, isSelected, onSelect, onOpen, onContextMenu }) => {
  const Icon = getFileIcon(item.name, item.isDir);
  
  return (
    <div
      className={`px-3 py-2 cursor-pointer flex items-center gap-3 transition-colors
        ${isSelected ? 'bg-blue-600/30' : 'hover:bg-gray-700'}`}
      onClick={(e) => onSelect(e)}
      onDoubleClick={() => onOpen()}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e); }}
    >
      <div className={`${item.isDir ? 'text-yellow-400' : 'text-gray-400'}`}>
        <Icon />
      </div>
      <span className="flex-1 truncate">{item.name}</span>
      <span className="text-sm text-gray-500 w-24 text-right">
        {item.isDir ? '-' : formatSize(item.size || 0)}
      </span>
      <span className="text-sm text-gray-500 w-36 text-right">
        {formatDate(item.mtime)}
      </span>
    </div>
  );
};

// ============================================================================
// File Editor Component
// ============================================================================
const FileEditor = ({ path, content, onSave, onClose, isNew = false }) => {
  const [text, setText] = useState(content || '');
  const [fileName, setFileName] = useState(path.split('/').pop() || 'nouveau-fichier.txt');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalPath = isNew ? joinPath(path.replace(/[^/]*$/, ''), fileName) : path;
      await onSave(finalPath, text);
      if (!isNew) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {isNew && (
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">Nom du fichier</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
        style={{ minHeight: '300px' }}
      />
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving || (isNew && !fileName.trim())}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50 flex items-center gap-2"
        >
          <Icons.Save />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Upload Component
// ============================================================================
const UploadModal = ({ currentPath, onUpload, onClose }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    setUploading(true);
    for (const file of files) {
      setProgress(p => ({ ...p, [file.name]: 0 }));
      try {
        await onUpload(
          joinPath(currentPath, file.name), 
          file,
          (percent) => setProgress(p => ({ ...p, [file.name]: percent }))
        );
        setProgress(p => ({ ...p, [file.name]: 'done' }));
      } catch (err) {
        setProgress(p => ({ ...p, [file.name]: 'error' }));
      }
    }
    setUploading(false);
    onClose();
  };

  const getProgressDisplay = (fileProgress) => {
    if (fileProgress === 'done') return <span className="text-green-400">✓</span>;
    if (fileProgress === 'error') return <span className="text-red-400">✗</span>;
    if (typeof fileProgress === 'number') {
      return <span className="text-blue-400 text-sm">{fileProgress}%</span>;
    }
    return null;
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="w-full mb-4"
      />
      {files.length > 0 && (
        <div className="mb-4 max-h-48 overflow-auto">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <Icons.File />
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-sm text-gray-500">{formatSize(file.size)}</span>
              {getProgressDisplay(progress[file.name])}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">
          Annuler
        </button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
        >
          {uploading ? 'Upload en cours...' : 'Uploader'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// New Folder Modal
// ============================================================================
const NewFolderModal = ({ currentPath, onCreate, onClose }) => {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await onCreate(joinPath(currentPath, name));
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">Nom du dossier</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 mb-4"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">
          Annuler
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
        >
          {creating ? 'Création...' : 'Créer'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Zip Modal
// ============================================================================
const ZipModal = ({ selectedItems, currentPath, onZip, onClose }) => {
  const [zipName, setZipName] = useState('archive.zip');
  const [zipping, setZipping] = useState(false);

  const handleZip = async () => {
    if (!zipName.trim()) return;
    setZipping(true);
    try {
      const paths = selectedItems.map(item => joinPath(currentPath, item.name));
      await onZip(joinPath(currentPath, zipName), paths);
      onClose();
    } finally {
      setZipping(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Fichiers à compresser :</p>
        <div className="max-h-32 overflow-auto bg-gray-900 rounded p-2">
          {selectedItems.map((item, i) => (
            <div key={i} className="text-sm py-0.5">{item.name}</div>
          ))}
        </div>
      </div>
      <label className="block text-sm text-gray-400 mb-1">Nom de l'archive</label>
      <input
        type="text"
        value={zipName}
        onChange={(e) => setZipName(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 mb-4"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">
          Annuler
        </button>
        <button
          onClick={handleZip}
          disabled={!zipName.trim() || zipping}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
        >
          {zipping ? 'Compression...' : 'Compresser'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Unzip Modal
// ============================================================================
const UnzipModal = ({ selectedItem, currentPath, onUnzip, onClose }) => {
  const [dest, setDest] = useState(currentPath);
  const [unzipping, setUnzipping] = useState(false);

  const handleUnzip = async () => {
    setUnzipping(true);
    try {
      await onUnzip(joinPath(currentPath, selectedItem.name), dest);
      onClose();
    } finally {
      setUnzipping(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-400 mb-2">Fichier : {selectedItem.name}</p>
      <label className="block text-sm text-gray-400 mb-1">Destination</label>
      <input
        type="text"
        value={dest}
        onChange={(e) => setDest(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 mb-4"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">
          Annuler
        </button>
        <button
          onClick={handleUnzip}
          disabled={unzipping}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
        >
          {unzipping ? 'Extraction...' : 'Extraire'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Delete Confirmation Modal
// ============================================================================
const DeleteModal = ({ selectedItems, onDelete, onClose }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <p className="mb-4">
        Êtes-vous sûr de vouloir supprimer {selectedItems.length} élément(s) ?
      </p>
      <div className="max-h-32 overflow-auto bg-gray-900 rounded p-2 mb-4">
        {selectedItems.map((item, i) => (
          <div key={i} className="text-sm py-0.5 text-red-400">{item.name}</div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">
          Annuler
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded disabled:opacity-50"
        >
          {deleting ? 'Suppression...' : 'Supprimer'}
        </button>
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
    <div className={`flex flex-col h-full bg-gray-900 text-white ${className}`}>
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

      <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700">
        <Breadcrumb path={currentPath} onNavigate={loadDirectory} />
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-900/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            Chargement...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            {searchQuery ? 'Aucun résultat' : 'Dossier vide'}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
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
          <div className="divide-y divide-gray-800">
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
        )}
      </div>

      <div className="px-3 py-1.5 bg-gray-800 border-t border-gray-700 text-xs text-gray-500">
        {filteredItems.length} élément(s) • {selected.size} sélectionné(s)
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
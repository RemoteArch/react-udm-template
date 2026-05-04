const { useState, useEffect } = React;

// Charger Font Awesome
if(!document.head.querySelector("link[href*='font-awesome']")) {
  const link = document.createElement('link');
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

const tools = [
  { name: 'Admin', path: 'admin', icon: 'fa-wrench', color: 'text-blue-400' },
  { name: 'Database Manager', path: 'db1', icon: 'fa-chart-bar', color: 'text-amber-400' },
  { name: 'Files Manager', path: 'files', icon: 'fa-folder', color: 'text-sky-400' },
  { name: 'Logs Viewer', path: 'logs', icon: 'fa-file-lines', color: 'text-rose-400' },
  { name: 'Media Studio', path: 'media-studio', icon: 'fa-film', color: 'text-purple-400' },
  { name: 'Minimal OS', path: 'minimalos', icon: 'fa-laptop', color: 'text-indigo-400' },
];

function App() {
  return (
    <div className="min-h-screen bg-[#0f172a] font-sans antialiased text-slate-200">
      <div className="container mx-auto px-6 py-16">
        
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4">
            UDM <span className="text-indigo-500">Tools</span>
          </h1>
          <div className="h-1 w-20 bg-indigo-500 mx-auto mb-6 rounded-full"></div>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {tools.map((tool) => (
            <a
              key={tool.path}
              href={`#${tool.path}`}
              className="relative group overflow-hidden bg-slate-800/40 border-2 border-slate-700/50 rounded-xl p-6 transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-800"
            >
              {/* Active Indicator (Flat) */}
              <div className="absolute top-0 left-0 w-1 h-0 bg-indigo-500 transition-all duration-300 group-hover:h-full"></div>
              
              <div className="flex flex-col h-full">
                <div className={`text-3xl mb-5 ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`fas ${tool.icon}`}></i>
                </div>
                
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors duration-200">
                  {tool.name}
                </h3>
                
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    /{tool.path}
                  </span>
                  <i className="fas fa-arrow-right text-slate-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"></i>
                </div>
              </div>
            </a>
          ))}
        </div>
        
        {/* Footer info simple */}
      </div>
    </div>
  );
}

export default App;
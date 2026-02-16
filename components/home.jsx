
const Home = () => {
  // Helper pour les icônes SVG pour garder le JSX propre
  const IconWrapper = ({ children, color = "text-indigo-400" }) => (
    <div className={`p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 ${color} group-hover:scale-110 transition-transform duration-300`}>
      {children}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#020617] flex items-center justify-center px-4 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Background Decor - Mesh Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div className="relative w-full max-w-4xl bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden">
        
        {/* Header - Glassmorphism Card Style */}
        <div className="relative px-8 pt-12 pb-10 sm:px-16 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Système Actif
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              Interface <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Dynamique</span>
            </h1>
            
            <p className="max-w-2xl text-slate-400 text-lg leading-relaxed">
              Explorez une architecture modulaire où chaque composant est injecté intelligemment selon vos besoins.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-8 pb-12 sm:px-16 space-y-12">
          
          {/* Bento Grid Style for Navigation */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3 bg-slate-950/40 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <IconWrapper>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </IconWrapper>
                <h2 className="text-xl font-bold text-white">Routage par Hash</h2>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Le changement d'URL déclenche instantanément l'import asynchrone de vos composants JSX.
              </p>
              <div className="bg-slate-900/80 rounded-2xl p-4 font-mono text-xs border border-indigo-500/20 shadow-inner">
                 <div className="flex justify-between items-center text-slate-500 mb-2">
                    <span>Terminal</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>
                 </div>
                 <span className="text-indigo-400">$</span> window.location.hash = <span className="text-cyan-400">"#MonComposant"</span>
              </div>
            </div>

            <div className="md:col-span-2 bg-gradient-to-br from-indigo-600/20 to-transparent border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-between">
                <h3 className="text-white font-bold text-lg">Prêt à coder ?</h3>
                <p className="text-indigo-200/60 text-sm mt-2">
                    Ajoutez vos fichiers dans <code className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300">/components</code> pour les voir apparaître ici.
                </p>
                <button 
                  onClick={() => window.location.hash = '#Demo'}
                  className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  Tester la Démo
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
            </div>
          </div>

          {/* Features Horizontal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-800/50">
            {[
              { 
                title: "Lazy Load", 
                icon: <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>,
                color: "text-blue-400"
              },
              { 
                title: "Client-side", 
                icon: <path d="M20 7h-9m3 3-3-3 3-3M4 17h9m-3 3 3-3-3-3"/>,
                color: "text-purple-400"
              },
              { 
                title: "Auto-Fail", 
                icon: <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"/>,
                color: "text-rose-400"
              }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2 group cursor-default">
                <div className={`${f.color} transition-colors group-hover:text-white`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
                    {f.icon}
                  </svg>
                </div>
                <h4 className="text-slate-100 font-bold text-sm tracking-wide">{f.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Architecture optimisée pour le runtime.</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle Footer Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>
    </div>
  );
};

export default Home;
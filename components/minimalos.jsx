const { useState, useEffect } = React;

function formatDate(date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

if(!document.head.querySelector("link[href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css']")){
  let link = document.createElement('link');
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
  link.rel= "stylesheet";
  document.head.appendChild(link);
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOOK PERSONNALISÉ POUR LE THÈME
═══════════════════════════════════════════════════════════════════════════ */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  const colors = {
    dark: {
      bg: '#1a1a2e',
      surface: '#16213e',
      surfaceHover: '#0f3460',
      border: '#2d3561',
      text: '#f5f5f5',
      textMuted: '#a8a8a8',
      textSecondary: '#d4d4d4',
      accent: '#e94560',
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800'
    },
    light: {
      bg: '#f5f5f5',
      surface: '#ffffff',
      surfaceHover: '#e0e0e0',
      border: '#d0d0d0',
      text: '#212121',
      textMuted: '#757575',
      textSecondary: '#424242',
      accent: '#e94560',
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800'
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.body.style.backgroundColor = colors[theme].bg;
    document.body.style.color = colors[theme].text;
  }, [theme, colors]);

  return { theme, colors: colors[theme], toggleTheme };
}

/* ═══════════════════════════════════════════════════════════════════════════
   DONNÉES APPLICATIONS
═══════════════════════════════════════════════════════════════════════════ */
const APPS_DATA = [
  {
    id: 'browser',
    name: 'Navigateur',
    category: 'Productivité',
    icon: 'fas fa-globe',
    color: '#1793d1',
    url: 'https://www.google.com'
  },
  {
    id: 'terminal',
    name: 'Terminal',
    category: 'Système',
    icon: 'fas fa-terminal',
    color: '#a6e3a1',
    url: 'https://github.com'
  },
  {
    id: 'files',
    name: 'Fichiers',
    category: 'Système',
    icon: 'fas fa-folder',
    color: '#f9e2af',
    url: 'https://drive.google.com'
  },
  {
    id: 'editor',
    name: 'Éditeur',
    category: 'Productivité',
    icon: 'fas fa-edit',
    color: '#cba6f7',
    url: 'https://codepen.io'
  },
  {
    id: 'music',
    name: 'Musique',
    category: 'Média',
    icon: 'fas fa-music',
    color: '#fab387',
    url: 'https://www.youtube.com'
  },
  {
    id: 'gallery',
    name: 'Galerie',
    category: 'Média',
    icon: 'fas fa-images',
    color: '#89dceb',
    url: 'https://unsplash.com'
  },
  {
    id: 'settings',
    name: 'Paramètres',
    category: 'Système',
    icon: 'fas fa-cog',
    color: '#89b4fa',
    url: 'https://github.com/settings'
  },
  {
    id: 'games',
    name: 'Jeux',
    category: 'Jeux',
    icon: 'fas fa-gamepad',
    color: '#f38ba8',
    url: 'https://www.crazygames.com'
  },
  {
    id: 'calendar',
    name: 'Calendrier',
    category: 'Productivité',
    icon: 'fas fa-calendar',
    color: '#94e2d5',
    url: 'https://calendar.google.com'
  },
  {
    id: 'notes',
    name: 'Notes',
    category: 'Productivité',
    icon: 'fas fa-sticky-note',
    color: '#f9e2af',
    url: 'https://keep.google.com'
  }
];

/* ═══════════════════════════════════════════════════════════════════════════
   ÉCRAN DE CONNEXION
═══════════════════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin, onGuestLogin, colors, theme }) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulation d'authentification
    setTimeout(() => {
      if (pin === '1234' || pin === 'admin') {
        onLogin({ name: 'Utilisateur', avatar: '👤' });
      } else {
        setError('PIN incorrect');
      }
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{
           backgroundColor: colors.bg,
           backgroundImage: theme === 'dark' 
             ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
             : 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)'
         }}>
      <div className="w-full max-w-md">
        {/* Carte glassmorphism */}
        <div className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
             style={{
               backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
               border: '1px solid rgba(255, 255, 255, 0.2)'
             }}>
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                 style={{
                   backgroundColor: colors.accent,
                   color: 'white',
                   boxShadow: `0 8px 32px ${colors.accent}40`
                 }}>
              👤
            </div>
          </div>
          
          {/* Titre */}
          <h1 className="text-2xl font-bold text-center mb-2"
              style={{ color: colors.text }}>
            Bienvenue
          </h1>
          <p className="text-center mb-6"
             style={{ color: colors.textMuted }}>
            Entrez votre code PIN pour continuer
          </p>
          
          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Code PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-none outline-none text-center"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                  color: colors.text
                }}
                maxLength={10}
              />
            </div>
            
            {error && (
              <p className="text-center text-sm"
                 style={{ color: colors.error }}>
                {error}
              </p>
            )}
            
            <button
              type="submit"
              disabled={isLoading || !pin}
              className="w-full py-3 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: colors.accent,
                color: 'white',
                opacity: (isLoading || !pin) ? 0.5 : 1
              }}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          
          {/* Option invité */}
          <div className="mt-6 text-center">
            <button
              onClick={onGuestLogin}
              className="text-sm underline"
              style={{ color: colors.textMuted }}
            >
              Continuer en tant qu'invité
            </button>
          </div>
          
          {/* Indication PIN */}
          <p className="text-center text-xs mt-4"
             style={{ color: colors.textMuted }}>
            PIN par défaut : 1234 ou admin
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LISTE D'APPLICATIONS SIMPLE
═══════════════════════════════════════════════════════════════════════════ */
function AppList({ user, colors, onAppClick, onLogout, appsData }) {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(formatDate(new Date()));
    }, 60000); // Mettre à jour chaque minute
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
      {/* Header simple avec date et déconnexion */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
               style={{ backgroundColor: colors.accent, color: 'white' }}>
            {user.avatar}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
              {user.name}
            </h1>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {currentDate}
            </p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-lg font-medium transition-all hover:bg-red-500/20"
          style={{ color: colors.error }}
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Déconnexion
        </button>
      </div>
      
      {/* Grille d'applications */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {appsData.map(app => (
          <div
            key={app.id}
            className="p-6 rounded-xl cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
            style={{
              backgroundColor: colors.surface,
              border: `2px solid ${colors.border}`
            }}
            onClick={() => onAppClick(app)}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                   style={{ backgroundColor: `${app.color}20`, color: app.color }}>
                <i className={app.icon}></i>
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: colors.text }}>
                  {app.name}
                </h3>
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  {app.category}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOUTON FLOTTANT SIMPLE AVEC MODAL
═══════════════════════════════════════════════════════════════════════════ */
function FloatingButton({ colors, onShowAppList, user, onLogout, appsData }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleShowAppList = () => {
    setIsOpen(false);
    onShowAppList();
  };
  
  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40"
        style={{
          backgroundColor: colors.accent,
          color: 'white',
          boxShadow: `0 8px 32px ${colors.accent}40`
        }}
      >
        <i className="fas fa-th-large text-xl"></i>
      </button>
      
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal contenu */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh]"
               style={{ 
                 backgroundColor: colors.surface,
                 border: `1px solid ${colors.border}`
               }}>
            {/* Header */}
            <div className="p-4 border-b"
                 style={{ 
                   backgroundColor: colors.bg,
                   borderColor: colors.border,
                   color: colors.text
                 }}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Applications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg transition-all hover:bg-red-500/20"
                  style={{ color: colors.error }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            {/* Contenu */}
            <div className="p-4 space-y-4 overflow-auto max-h-[60vh]">
              {/* User info */}
              <div className="flex items-center gap-3 p-3 rounded-lg"
                   style={{ backgroundColor: colors.bg }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                     style={{ backgroundColor: colors.accent, color: 'white' }}>
                  {user.avatar}
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.text }}>{user.name}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>Utilisateur connecté</p>
                </div>
              </div>
              
              {/* Bouton voir toutes les apps */}
              <button
                onClick={handleShowAppList}
                className="w-full p-3 rounded-lg text-left transition-all hover:bg-white/10 flex items-center gap-3"
                style={{ color: colors.text }}
              >
                <i className="fas fa-th"></i>
                Voir toutes les applications
              </button>
              
              {/* Déconnexion */}
              <button
                onClick={onLogout}
                className="w-full p-3 rounded-lg text-left transition-all hover:bg-red-500/20 flex items-center gap-3"
                style={{ color: colors.error }}
              >
                <i className="fas fa-sign-out-alt"></i>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE D'APPLICATION
═══════════════════════════════════════════════════════════════════════════ */
function AppPage({ app, colors, theme, user, onBack, onLogout, toggleTheme }) {
  // Si c'est une app iframe, on affiche directement l'iframe
  if (app.url) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
        {/* Header simple pour les apps iframe */}
        <div className="flex items-center justify-between p-4 border-b"
             style={{ 
               backgroundColor: colors.surface,
               borderColor: colors.border,
               color: colors.text
             }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg transition-all hover:bg-white/10"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs"
                   style={{ backgroundColor: app.color, color: 'white' }}>
                <i className={app.icon}></i>
              </div>
              <span className="font-medium">{app.name}</span>
            </div>
          </div>
        </div>
        
        {/* Contenu de l'application */}
        <div className="h-[calc(100vh-73px)]">
          {app.url && (app.url.endsWith('.js') || app.url.endsWith('.mjs') || app.url.endsWith('.jsx')) ? (
            <web-app url={app.url} />
          ) : (
            <iframe
              src={app.url}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{ backgroundColor: 'white' }}
            />
          )}
        </div>
      </div>
    );
  }
  
  // Pour les apps React, on affiche un contenu simple
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      <FloatingButton
        colors={colors}
        onShowAppList={onBack}
        user={user}
        onLogout={onLogout}
      />
      
      {/* Contenu de l'application */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
              {app.name}
            </h1>
            <p className="mt-2" style={{ color: colors.textMuted }}>
              {app.category}
            </p>
          </div>
          
          {/* Contenu de l'application */}
          <div className="p-8 rounded-xl text-center"
               style={{ 
                 backgroundColor: colors.surface,
                 border: `1px solid ${colors.border}`
               }}>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4"
                 style={{ backgroundColor: `${app.color}20`, color: app.color }}>
              <i className={app.icon}></i>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              {app.name}
            </h2>
            <p style={{ color: colors.textMuted }}>
              Application en cours de développement...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
export default function MinimalOS({ apps }) {
  const { theme, colors, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState('login');
  const [currentApp, setCurrentApp] = useState(null);
  const [user, setUser] = useState(null);
  
  // Gérer les apps en props (JSON string ou objet)
  const appsData = React.useMemo(() => {
    if (!apps) {
      return APPS_DATA; // Utiliser les apps par défaut si aucune prop fournie
    }
    
    // Si c'est une chaîne JSON, la parser
    if (typeof apps === 'string') {
      try {
        return JSON.parse(apps);
      } catch (error) {
        console.error('Erreur lors du parsing JSON des apps:', error);
        return APPS_DATA; // Retourner les apps par défaut en cas d'erreur
      }
    }
    
    // Si c'est déjà un objet, l'utiliser directement
    if (Array.isArray(apps)) {
      return apps;
    }
    
    // Format non reconnu, utiliser les apps par défaut
    console.warn('Format des apps non reconnu, utilisation des apps par défaut');
    return APPS_DATA;
  }, [apps]);
  
  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('home');
  };
  
  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
    setCurrentApp(null);
  };
  
  const handleGuestLogin = () => {
    setUser({ name: 'Invité', avatar: '👤' });
    setCurrentView('home');
  };
  
  const handleAppClick = (app) => {
    console.log('Opening app:', app.name);
    if (app.url) {
      console.log('App URL:', app.url);
    }
    setCurrentApp(app);
    setCurrentView('app');
  };
  
  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentApp(null);
  };
  
  // Rendu conditionnel selon la vue actuelle
  if (currentView === 'login') {
    return <LoginScreen onLogin={handleLogin} onGuestLogin={handleGuestLogin} colors={colors} theme={theme} />;
  }
  
  if (currentView === 'app' && currentApp) {
    return (
      <>
        <AppPage
          app={currentApp}
          colors={colors}
          theme={theme}
          user={user}
          onBack={handleBackToHome}
          onLogout={handleLogout}
          toggleTheme={toggleTheme}
        />
        <FloatingButton
          colors={colors}
          onShowAppList={handleBackToHome}
          user={user}
          onLogout={handleLogout}
          appsData={appsData}
        />
      </>
    );
  }
  
  return (
    <>
      <AppList
        user={user}
        colors={colors}
        onAppClick={handleAppClick}
        onLogout={handleLogout}
        appsData={appsData}
      />
    </>
  );
}

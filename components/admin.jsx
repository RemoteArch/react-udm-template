/**
 * ============================================================
 * ADMIN DASHBOARD - COMPOSANT PRINCIPAL
 * ============================================================
 * Back Office Heineken Champions League Activation
 * Toute la configuration est centralisée dans config.js
 * ============================================================
 */

const { useState, useEffect } = React;

// ============================================================
// CHARGEMENT DE LA CONFIGURATION
// ============================================================
// CONFIG est chargé au démarrage et contient toutes les constantes
const CONFIG = await loadModule('admin-config.js');

window.CONFIG = CONFIG;

// Destructuration des constantes depuis CONFIG
const { AUTH, APP, API_URL, routes, getRoutePath, getDefaultRoute, getRouteById, flattenRoutes, style, api, theme } = CONFIG;

// ============================================================
// COMPOSANT 404 - PAGE NON TROUVÉE
// ============================================================
const NotFound = ({ pageId, onGoHome }) => (
    <div className="flex flex-col items-center justify-center h-full py-16">
        <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-exclamation-triangle text-danger text-4xl"></i>
            </div>
            <h1 className="text-6xl font-bold text-dark mb-2">404</h1>
            <h2 className="text-xl font-semibold text-text-muted mb-4">Page non trouvée</h2>
            <p className="text-muted mb-8 max-w-md mx-auto">
                La page <code className="bg-light px-2 py-1 rounded text-sm">{pageId || 'demandée'}</code> n'existe pas ou a été déplacée.
            </p>
            <button
                onClick={onGoHome}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition flex items-center gap-2 mx-auto"
            >
                <i className="fas fa-home"></i>
                Retour au tableau de bord
            </button>
        </div>
    </div>
);

// ============================================================
// GESTION DE SESSION
// ============================================================

// Enregistrer la session dans localStorage
const saveSession = (email) => {
    localStorage.setItem(AUTH.AUTH_KEY, JSON.stringify({
        isLoggedIn: true,
        email,
        loginTime: Date.now()
    }));
};

// Supprimer la session
const clearSession = () => {
    localStorage.removeItem(AUTH.AUTH_KEY);
};

// Vérifier si la session est valide
const isSessionValid = () => {
    try {
        const session = JSON.parse(localStorage.getItem(AUTH.AUTH_KEY));
        if (!session?.isLoggedIn) return false;
        // Vérifier expiration
        if (Date.now() - session.loginTime > AUTH.SESSION_DURATION) {
            clearSession();
            return false;
        }
        return true;
    } catch {
        return false;
    }
};

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        setTimeout(() => {
            if (email === AUTH.DEFAULT_EMAIL && password === AUTH.DEFAULT_PASSWORD) {
                saveSession(email);
                onLogin();
            } else if (!email || !password) {
                setError('Veuillez remplir tous les champs');
            } else {
                setError('Email ou mot de passe incorrect');
            }
            setLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
            <div className="bg-bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <i className={`fas fa-star text-accent text-4xl`}></i>
                    </div>
                    <h1 className="text-2xl font-bold text-dark">{APP.NAME}</h1>
                    <p className="text-lg font-medium text-primary mt-1">{APP.TITLE}</p>
                    <p className="text-muted text-sm mt-2">Connectez-vous à votre compte</p>
                </div>

                {error && (
                    <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-4">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-dark text-sm font-medium mb-2">
                            <i className="fas fa-envelope mr-2 text-muted"></i>
                            Adresse email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white"
                            placeholder="exemple@email.com"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-dark text-sm font-medium mb-2">
                            <i className="fas fa-lock mr-2 text-muted"></i>
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center">
                            <input type="checkbox" className="w-4 h-4 border-border rounded accent-primary" />
                            <span className="ml-2 text-sm text-muted">Se souvenir de moi</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center hover:bg-accent-dark"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Connexion...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sign-in-alt mr-2"></i>
                                Se connecter
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-muted text-sm">
                    &copy; {new Date().getFullYear()} {APP.NAME}. Tous droits réservés.
                </div>
            </div>
        </div>
    );
};

const MobileNav = ({ currentPage, setCurrentPage }) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleNavClick = (id) => {
        setCurrentPage(id);
        setShowMenu(false);
    };

    return (
        <>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`lg:hidden fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${showMenu ? 'bg-accent' : 'bg-primary'}`}
            >
                <i className={`fas ${showMenu ? 'fa-times' : 'fa-bars'} text-white text-xl`}></i>
            </button>

            {showMenu && (
                <div className="lg:hidden fixed inset-0 z-10 flex flex-col">
                    <div className="absolute inset-0 bg-dark/50" onClick={() => setShowMenu(false)}></div>
                    
                    <div className="absolute bottom-24 right-4 left-4 sm:left-auto sm:w-80 bg-dark text-white max-h-[70vh] overflow-y-auto rounded-2xl shadow-xl">
                        <div className="p-4 border-b border-muted/30">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                                    <i className={`fas ${APP.LOGO_ICON} text-white`}></i>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">{APP.NAME}</h2>
                                    <p className="text-text-light text-xs">{APP.TITLE}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-2">
                            {routes.map((route) => (
                                <div key={route.id}>
                                    {route.path ? (
                                        <button
                                            onClick={() => handleNavClick(route.id)}
                                            className={`w-full flex items-center px-4 py-3 rounded-lg mb-1 transition-all ${currentPage === route.id ? 'bg-primary text-white' : 'text-light hover:bg-muted/20'}`}
                                        >
                                            <i className={`fas ${route.icon} mr-3 w-5`}></i>
                                            <span>{route.title}</span>
                                        </button>
                                    ) : (
                                        <div className="mb-2">
                                            <div className="px-4 py-2 text-text-light text-xs uppercase tracking-wider font-medium">
                                                <i className={`fas ${route.icon} mr-2`}></i>
                                                {route.title}
                                            </div>
                                            {route.children?.map((child) => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => handleNavClick(child.id)}
                                                    className={`w-full flex items-center px-4 py-2.5 pl-8 rounded-lg mb-1 transition-all ${currentPage === child.id ? 'bg-primary text-white' : 'text-light hover:bg-muted/20'}`}
                                                >
                                                    <i className={`fas ${child.icon} mr-3 w-4 text-sm`}></i>
                                                    <span className="text-sm">{child.title}</span>
                                                    {child.badge && (
                                                        <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-full ml-auto">
                                                            {child.badge}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-muted/30">
                            <button 
                                onClick={() => setShowMenu(false)}
                                className="w-full py-3 bg-muted/30 hover:bg-muted/50 rounded-lg text-center font-medium transition-colors"
                            >
                                Fermer le menu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const MenuItem = ({ item, sidebarOpen, currentPage, setCurrentPage, expanded, onToggle }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = currentPage === item.id || (hasChildren && item.children.some(c => c.id === currentPage));
    
    const handleClick = () => {
        if (hasChildren) {
            onToggle(item.id);
        } else if (item.path) {
            setCurrentPage(item.id);
        }
    };

    return (
        <li>
            <button
                onClick={handleClick}
                className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-all ${
                    isActive && !hasChildren
                        ? 'bg-accent text-white'
                        : isActive && hasChildren
                        ? 'bg-white/10 text-white'
                        : 'text-light hover:bg-white/10 hover:text-white'
                }`}
            >
                <i className={`fas ${item.icon} ${sidebarOpen ? 'mr-3' : 'mx-auto'}`}></i>
                {sidebarOpen && (
                    <>
                        <span className="flex-1 text-left">{item.title}</span>
                        {item.badge && (
                            <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-full mr-2">
                                {item.badge}
                            </span>
                        )}
                        {hasChildren && (
                            <i className={`fas fa-chevron-${expanded ? 'down' : 'right'} text-xs`}></i>
                        )}
                    </>
                )}
            </button>
            
            {hasChildren && expanded && sidebarOpen && (
                <ul className="ml-4 mt-1 space-y-1 border-l border-light/20 pl-3">
                    {item.children.map(child => (
                        <li key={child.id}>
                            <button
                                onClick={() => setCurrentPage(child.id)}
                                className={`w-full flex items-center px-3 py-2 rounded-lg transition-all text-sm ${
                                    currentPage === child.id
                                        ? 'bg-accent text-white'
                                        : 'text-light hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <i className={`fas ${child.icon} mr-2 text-xs`}></i>
                                <span className="flex-1 text-left">{child.title}</span>
                                {child.badge && (
                                    <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-full">
                                        {child.badge}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};

const Navbar = ({ sidebarOpen, currentPage, setCurrentPage }) => {
    const [expandedItems, setExpandedItems] = useState({});

    const toggleExpand = (id) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <nav className={`h-screen text-white transition-all duration-300 bg-gradient-to-b from-bg-sidebar to-bg-sidebar-dark ${sidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-5">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <i className={`fas ${APP.LOGO_ICON} text-white`}></i>
                    </div>
                    {sidebarOpen && (
                        <div>
                            <h1 className="text-xl font-bold">{APP.NAME}</h1>
                            <p className="text-text-light text-xs">{APP.TITLE}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                {sidebarOpen && (
                    <p className="text-text-light text-xs uppercase tracking-wider mb-3 px-2">Menu principal</p>
                )}
                <ul className="space-y-1">
                    {routes.map(item => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            sidebarOpen={sidebarOpen}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            expanded={expandedItems[item.id]}
                            onToggle={toggleExpand}
                        />
                    ))}
                </ul>
            </div>
        </nav>
    );
};

const Breadcrumb = ({ currentPage }) => {
    const getBreadcrumb = () => {
        const crumbs = [];
        // Chercher la route courante et son parent
        for (const route of routes) {
            if (route.id === currentPage) {
                crumbs.push({ id: route.id, title: route.title, icon: route.icon });
                break;
            }
            if (route.children) {
                const child = route.children.find(c => c.id === currentPage);
                if (child) {
                    crumbs.push({ id: route.id, title: route.title, icon: route.icon });
                    crumbs.push({ id: child.id, title: child.title, icon: child.icon });
                    break;
                }
            }
        }
        return crumbs;
    };

    const crumbs = getBreadcrumb();

    return (
        <div className="flex items-center text-sm">
            <i className="fas fa-home text-muted mr-2"></i>
            {crumbs.map((crumb, index) => (
                <span key={crumb.id} className="flex items-center">
                    {index > 0 && <i className="fas fa-chevron-right text-border mx-2 text-xs"></i>}
                    <span className={index === crumbs.length - 1 ? 'text-dark font-medium' : 'text-muted'}>
                        {crumb.title}
                    </span>
                </span>
            ))}
        </div>
    );
};

const Header = ({ sidebarOpen, setSidebarOpen, currentPage, setCurrentPage, onLogout }) => {
    const [showProfile, setShowProfile] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Rechercher dans les routes
    const searchResults = searchQuery.trim() 
        ? flattenRoutes().filter(r => 
            r.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const handleSearchSelect = (id) => {
        setCurrentPage(id);
        setSearchQuery('');
        setShowSearch(false);
    };

    return (
        <header className="bg-bg-card border-b border-border px-4 py-2">
            <div className="flex items-center justify-between">
                {/* Left: Toggle + Breadcrumb */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex p-2 rounded-lg hover:bg-light transition"
                    >
                        <i className={`fas ${sidebarOpen ? 'fa-indent' : 'fa-outdent'} text-muted`}></i>
                    </button>
                    <div className="hidden sm:block">
                        <Breadcrumb currentPage={currentPage} />
                    </div>
                </div>

                {/* Right: Search + Profile */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2 rounded-lg hover:bg-light transition"
                        >
                            <i className="fas fa-search text-muted"></i>
                        </button>

                        {showSearch && (
                            <div className="absolute right-0 mt-2 w-72 bg-bg-card rounded-xl shadow-lg border border-border z-50">
                                <div className="p-3">
                                    <div className="relative">
                                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm"></i>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Rechercher une page..."
                                            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="border-t border-border max-h-48 overflow-y-auto">
                                        {searchResults.map(route => (
                                            <button
                                                key={route.id}
                                                onClick={() => handleSearchSelect(route.id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-light transition text-left"
                                            >
                                                <i className={`fas ${route.icon} text-muted text-sm`}></i>
                                                <span className="text-sm text-dark">{route.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {searchQuery && searchResults.length === 0 && (
                                    <div className="p-4 text-center text-muted text-sm">
                                        Aucune page trouvée
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-light transition"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-white text-sm font-medium">AD</span>
                            </div>
                            <i className="fas fa-chevron-down text-muted text-xs hidden sm:block"></i>
                        </button>

                        {showProfile && (
                            <div className="absolute right-0 mt-2 w-48 bg-bg-card rounded-xl shadow-lg border border-border z-50">
                                <div className="p-3 border-b border-border">
                                    <p className="text-sm font-medium text-dark">Admin</p>
                                    <p className="text-xs text-muted">{AUTH.DEFAULT_EMAIL}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={onLogout}
                                        className="flex items-center w-full px-4 py-2 text-sm text-danger hover:bg-danger/10 transition"
                                    >
                                        <i className="fas fa-sign-out-alt mr-3"></i>
                                        Déconnexion
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-bg-card border-t border-border px-4 py-2">
            <div className="flex items-center justify-between text-xs">
                <p className="text-muted">
                    {APP.NAME}
                </p>
                <div className="flex items-center gap-3">
                    <span className="text-text-light">v{APP.VERSION}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/10 text-success">
                        <span className="w-1.5 h-1.5 bg-success rounded-full mr-1.5"></span>
                        En ligne
                    </span>
                </div>
            </div>
        </footer>
    );
};

const App = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState(window.location.hash.slice(1) || getDefaultRoute());
    const [isLoggedIn, setIsLoggedIn] = useState(isSessionValid());
    const [PageContent, setPageContent] = useState(null);

    // Synchroniser le hash avec currentPage
    useEffect(() => {
        if (window.location.hash.slice(1) !== currentPage) {
            window.location.hash = currentPage;
        }
    }, [currentPage]);

    // Écouter les changements de hash (navigation browser)
    useEffect(() => {
        const handleHashChange = () => {
            const newPage = window.location.hash.slice(1) || getDefaultRoute();
            if (newPage !== currentPage) {
                setCurrentPage(newPage);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [currentPage]);

    // Charger le contenu de la page quand currentPage change
    useEffect(() => {
        const loadPage = async () => {
            const pagePath = getRoutePath(currentPage);
            // Si pas de path, afficher 404
            if (!pagePath) {
                setPageContent(null);
                return;
            }
            try {
                const pageModule = await loadModule(pagePath);
                setPageContent(() => pageModule.default || pageModule);
            } catch (err) {
                console.error('Error loading page:', err);
                setPageContent(null);
            }
        };
        loadPage();
    }, [currentPage]);

    // Aller à la page d'accueil
    const goToHome = () => {
        const defaultRoute = getDefaultRoute();
        setCurrentPage(defaultRoute);
        window.location.hash = defaultRoute;
    };

    const handleLogout = () => {
        clearSession();
        setIsLoggedIn(false);
    };

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const RenderContent = () =>{
        return(
            <div className="flex flex-col lg:flex-row min-h-screen">
                {/* Sidebar - Desktop */}
                <div className="hidden lg:block">
                    <Navbar 
                        sidebarOpen={sidebarOpen}
                        currentPage={currentPage}
                        setCurrentPage={(page) => {
                            setCurrentPage(page);
                            window.location.hash = page;
                        }}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                    <div className="sticky top-0 z-10">
                        <Header 
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            currentPage={currentPage}
                            setCurrentPage={(page) => {
                                setCurrentPage(page);
                                window.location.hash = page;
                            }}
                            onLogout={handleLogout}
                        />
                    </div>

                    <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-bg">
                        {PageContent ? (
                            <PageContent />
                        ) : currentPage && !getRoutePath(currentPage) ? (
                            <NotFound pageId={currentPage} onGoHome={goToHome} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        )}
                    </main>

                    {Footer && (
                        <div className="flex-shrink-0">
                            <Footer />
                        </div>
                    )}
                </div>

                {/* Mobile Navigation */}
                {MobileNav && (
                    <div className="lg:hidden">
                        <MobileNav 
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            currentPage={currentPage}
                            setCurrentPage={(page) => {
                                setCurrentPage(page);
                                window.location.hash = page;
                            }}
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
            {style().map((css, index) => (
                index == 0 ?(
                    <style key={index} type="text/tailwindcss">
                        {css}
                    </style>
                ):(
                    <style key={index}>
                        {css}
                    </style>
                )
            ))}

            {isLoggedIn ? RenderContent() : <Login onLogin={handleLogin} />}
        </>
    );
};


export default App;
/**
 * ============================================================
 * APP STORE - BACKOFFICE CONFIGURATION
 * ============================================================
 * Configuration centrale pour le backoffice de gestion
 * de la plateforme de jeux App Store.
 * ============================================================
 */

// ============================================================
// AUTHENTIFICATION
// ============================================================
export const AUTH = {
  DEFAULT_EMAIL: 'admin@appstore.com',
  DEFAULT_PASSWORD: 'admin123',
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24h
  AUTH_KEY: 'appstore_admin_auth',
  TOKEN_HEADERS_KEY: 'Token',
};

// ============================================================
// API
// ============================================================
// URL de l'API backend (auto-détection dev/prod)
export const API_URL = '../api/index.php';

// ============================================================
// APPLICATION
// ============================================================
export const APP = {
  NAME: 'App Store',
  TITLE: 'Plateforme de Jeux',
  VERSION: '1.0.0',
  LOGO_ICON: 'fa-gamepad',
  PRIMARY_COLOR: '#6366f1',          // Indigo moderne
  ACCENT_COLOR: '#fbbf24',           // Jaune doré
};

// ============================================================
// ROUTES / NAVIGATION
// ============================================================
// Configuration des routes du dashboard
// - id: identifiant unique (utilisé dans le hash URL)
// - title: titre affiché dans le menu
// - icon: classe Font Awesome
// - path: chemin vers le fichier .jsx (relatif à /admin/)
// - badge: (optionnel) badge de notification
// - children: (optionnel) sous-menu
export const routes = [
    {
        id: 'dashboard',
        title: 'Tableau de bord',
        icon: 'fa-tachometer-alt',
        path: 'pages/dashboard.jsx'
    },
    {
        id: 'jeux',
        title: 'Gestion des Jeux',
        icon: 'fa-gamepad',
        children: [
            {
                id: 'jeux-liste',
                title: 'Liste des jeux',
                icon: 'fa-list',
                path: 'pages/jeux-liste.jsx',
                table: 'games'
            },
            {
                id: 'wheel-config',
                title: 'Roue de la Fortune',
                icon: 'fa-circle-notch',
                path: 'pages/wheel-config.jsx',
                table: 'games_wheel_config'
            },
            {
                id: 'scratch-config',
                title: 'Jeu de Grattage',
                icon: 'fa-ticket',
                path: 'pages/scratch-config.jsx',
                table: 'games_scratch_config'
            },
            {
                id: 'prono-config',
                title: 'Instant Prono',
                icon: 'fa-futbol',
                path: 'pages/prono-config.jsx',
                table: 'games_prono_config'
            }
        ]
    },
    {
        id: 'resultats',
        title: 'Résultats & Stats',
        icon: 'fa-chart-bar',
        children: [
            {
                id: 'resultats-wheel',
                title: 'Résultats Roue',
                icon: 'fa-circle-notch',
                path: 'pages/resultats-wheel.jsx',
                table: 'games_results_wheel'
            },
            {
                id: 'resultats-scratch',
                title: 'Résultats Grattage',
                icon: 'fa-ticket',
                path: 'pages/resultats-scratch.jsx',
                table: 'games_results_scratch'
            },
            {
                id: 'resultats-prono',
                title: 'Résultats Prono',
                icon: 'fa-futbol',
                path: 'pages/resultats-prono.jsx',
                table: 'games_results_prono'
            },
            {
                id: 'statistiques',
                title: 'Statistiques globales',
                icon: 'fa-chart-pie',
                path: 'pages/statistiques.jsx'
            }
        ]
    },
    {
        id: 'joueurs',
        title: 'Joueurs',
        icon: 'fa-users',
        children: [
            {
                id: 'joueurs-liste',
                title: 'Liste des joueurs',
                icon: 'fa-user',
                path: 'pages/joueurs-liste.jsx',
                table: 'players'
            },
            {
                id: 'joueurs-activite',
                title: 'Activité joueurs',
                icon: 'fa-clock',
                path: 'pages/joueurs-activite.jsx',
                table: 'players_activity'
            },
            {
                id: 'joueurs-gains',
                title: 'Gains & Récompenses',
                icon: 'fa-trophy',
                path: 'pages/joueurs-gains.jsx',
                table: 'players_rewards'
            }
        ]
    },
    {
        id: 'recompenses',
        title: 'Récompenses',
        icon: 'fa-gift',
        children: [
            {
                id: 'lots',
                title: 'Catalogue de lots',
                icon: 'fa-box',
                path: 'pages/lots.jsx',
                table: 'rewards'
            },
            {
                id: 'stock-lots',
                title: 'Stock des lots',
                icon: 'fa-warehouse',
                path: 'pages/stock-lots.jsx',
                table: 'rewards_stock'
            },
            {
                id: 'distribution',
                title: 'Distribution',
                icon: 'fa-truck',
                path: 'pages/distribution.jsx',
                table: 'rewards_distribution'
            }
        ]
    },
    {
        id: 'configuration',
        title: 'Configuration',
        icon: 'fa-cog',
        children: [
            {
                id: 'parametres-generaux',
                title: 'Paramètres généraux',
                icon: 'fa-sliders-h',
                path: 'pages/parametres-generaux.jsx',
                table: 'settings'
            },
            {
                id: 'themes',
                title: 'Thèmes & Design',
                icon: 'fa-palette',
                path: 'pages/themes.jsx',
                table: 'themes'
            },
            {
                id: 'notifications',
                title: 'Notifications',
                icon: 'fa-bell',
                path: 'pages/notifications.jsx',
                table: 'notifications'
            },
            {
                id: 'admins',
                title: 'Administrateurs',
                icon: 'fa-user-shield',
                path: 'pages/admins.jsx',
                table: 'admin_users'
            }
        ]
    },
    {
        id: 'logs',
        title: 'Logs & Activité',
        icon: 'fa-history',
        children: [
            {
                id: 'logs-systeme',
                title: 'Logs système',
                icon: 'fa-server',
                path: 'pages/logs-systeme.jsx',
                table: 'system_logs'
            },
            {
                id: 'logs-jeux',
                title: 'Logs des jeux',
                icon: 'fa-gamepad',
                path: 'pages/logs-jeux.jsx',
                table: 'games_logs'
            },
            {
                id: 'logs-admin',
                title: 'Activité admin',
                icon: 'fa-user-shield',
                path: 'pages/logs-admin.jsx',
                table: 'admin_logs'
            }
        ]
    }
];

// ============================================================
// HELPERS - FONCTIONS UTILITAIRES
// ============================================================

/**
 * Recherche une route par son ID (récursif)
 * @param {string} id - ID de la route
 * @param {Array} routeList - Liste des routes à parcourir
 * @returns {Object|null} Route trouvée ou null
 */
export const getRouteById = (id, routeList = routes) => {
  for (const route of routeList) {
    if (route.id === id) return route;
    if (route.children) {
      const found = getRouteById(id, route.children);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Retourne le chemin du fichier pour une route donnée
 * @param {string} id - ID de la route
 * @returns {string} Chemin du fichier .jsx
 */
export const getRoutePath = (id) => {
  const route = getRouteById(id);
  return route?.path;
};

/**
 * Retourne la première route valide (avec path)
 * @returns {string} ID de la route par défaut
 */
export const getDefaultRoute = () => {
  const flat = flattenRoutes();
  return flat[0]?.id || '';
};

/**
 * Aplatit la liste des routes (récursif)
 * @param {Array} routeList - Liste des routes
 * @returns {Array} Liste plate des routes avec path
 */
export const flattenRoutes = (routeList = routes) => {
  return routeList.reduce((acc, route) => {
    if (route.path) acc.push(route);
    if (route.children) acc.push(...flattenRoutes(route.children));
    return acc;
  }, []);
};

export async function request(method, endpoint, data = null, options = {}) {
    let headers = options?.headers || {};
    let params = options?.params || {};
    let token = options?.token || localStorage.getItem('AUTH_KEY') || null;
    let url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    if (token) {
        headers[AUTH.TOKEN_HEADERS_KEY] = token;
    }

    const requestOptions = {
        method,
        params,
        headers: headers,
    };

    if (data !== null && data !== undefined) {
        if (data instanceof FormData) {
            requestOptions.body = data;
        } else {
            headers["Content-Type"] = "application/json";
            requestOptions.body = JSON.stringify(data);
        }
    }

    let response = fetch(url, requestOptions);

    return response;
}

export const api = {
    get(endpoint, params = {} , headers = {}) {
        return request("GET", endpoint, null, { params, headers });
    },

    post(endpoint, data, params = {} , headers = {}) {
        return request("POST", endpoint, data, { params, headers });
    },

    put(endpoint, data, params = {} , headers = {}) {
        return request("PUT", endpoint, data, { params, headers });
    },

    delete(endpoint, params = {} , headers = {}) {
        return request("DELETE", endpoint, null, { params, headers });
    },
};

window.api = api;
/**
 * ============================================================
 * STYLE - COULEURS @THEME TAILWINDCSS
 * ============================================================
 * Toutes les couleurs de l'application sont définies ici.
 * Utiliser UNIQUEMENT ces couleurs dans les composants.
 * 
 * Usage: bg-primary, text-accent, border-muted, etc.
 * ============================================================
 */
export const style = () => {
    const styles = [
        `@theme {
            /* Couleurs principales App Store */
            --color-primary: ${APP.PRIMARY_COLOR};
            --color-primary-dark: #4f46e5;
            --color-primary-light: #818cf8;
            
            /* Couleur accent */
            --color-accent: ${APP.ACCENT_COLOR};
            --color-accent-dark: #f59e0b;
            --color-accent-light: #fcd34d;
            
            /* Couleurs sémantiques */
            --color-success: #10b981;
            --color-danger: #ef4444;
            --color-warning: #f59e0b;
            --color-info: #3b82f6;
            
            /* Couleurs neutres */
            --color-dark: #0f172a;
            --color-muted: #64748b;
            --color-light: #f1f5f9;
            --color-white: #ffffff;
            
            /* Couleurs de fond */
            --color-bg: #f8fafc;
            --color-bg-card: #ffffff;
            --color-bg-sidebar: #1e293b;
            --color-bg-sidebar-dark: #0f172a;
            
            /* Couleurs de bordure */
            --color-border: #e2e8f0;
            --color-border-light: #f1f5f9;
            
            /* Couleurs de texte */
            --color-text: #0f172a;
            --color-text-muted: #64748b;
            --color-text-light: #94a3b8;
        }`,
        "@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');"
    ]
    return [...styles];
};
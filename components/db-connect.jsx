const { useState, useEffect } = React;

export default function Home() {
  const [formData, setFormData] = useState({
    host: '',
    port: '3306',
    name: '',
    user: '',
    pass: ''
  });

  const [tokenInput, setTokenInput] = useState('');
  const [history, setHistory] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('db_history') || '[]');
    setHistory(savedHistory);
  }, []);

  const buildBase64Config = () => {
    const rawString = `host||${formData.host}|||port||${formData.port}|||name||${formData.name}|||user||${formData.user}|||pass||${formData.pass}`;
    return {
      token: btoa(unescape(encodeURIComponent(rawString))),
      dbName: formData.name
    };
  };

  const decodeToken = (token) => {
    const decoded = decodeURIComponent(escape(atob(token)));

    const getValue = (key) => {
      const part = decoded.split(`${key}||`)[1];
      return part ? part.split('|||')[0] : '';
    };

    return {
      host: getValue('host'),
      port: getValue('port') || '3306',
      name: getValue('name'),
      user: getValue('user'),
      pass: getValue('pass')
    };
  };

  const fillFormFromToken = (token) => {
    try {
      const decodedFormData = decodeToken(token);
      setFormData(decodedFormData);
      setTokenInput(token);
    } catch (e) {
      alert('Token invalide');
    }
  };

  const saveToHistory = (dbName, token) => {
    const newHistory = history.filter(item => item.token !== token);
    newHistory.unshift({
      dbName,
      token,
      date: new Date().toLocaleDateString()
    });

    localStorage.setItem('db_history', JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const config = buildBase64Config();
    saveToHistory(config.dbName, config.token);
    loginWithToken(config.token);
  };

  const loginWithToken = (token) => {
    const url = window.location.pathname + '?config=' + token;
    window.location.href = url;
  };

  const handleTokenLogin = () => {
    if (!tokenInput) return;

    try {
      const decodedFormData = decodeToken(tokenInput);
      saveToHistory(decodedFormData.name, tokenInput);
      loginWithToken(tokenInput);
    } catch (e) {
      alert('Token invalide');
    }
  };

  const handleCopyConfig = async () => {
    const config = buildBase64Config();

    try {
      await navigator.clipboard.writeText(config.token);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('Erreur de copie');
    }
  };

  const deleteConfig = (tokenToDelete) => {
    if (confirm('Supprimer cette configuration ?')) {
      const newHistory = history.filter(item => item.token !== tokenToDelete);
      localStorage.setItem('db_history', JSON.stringify(newHistory));
      setHistory(newHistory);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  return (
    <div className="bg-black min-h-screen text-gray-200 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        <div className="lg:col-span-7 space-y-6">
          <div
            className="glass-panel p-8 rounded-2xl shadow-2xl"
            style={{
              background: 'rgba(31, 41, 55, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-600 p-3 rounded-lg shadow-lg shadow-blue-500/20">
                <i className="fas fa-database text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Connexion Database</h1>
                <p className="text-sm text-gray-400">Configurez vos accès manuellement</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Host</label>
                <input
                  type="text"
                  id="host"
                  value={formData.host}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="localhost"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Port</label>
                <input
                  type="number"
                  id="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Nom DB</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="production_db"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Utilisateur</label>
                <input
                  type="text"
                  id="user"
                  value={formData.user}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="root"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Mot de passe</label>
                <input
                  type="password"
                  id="pass"
                  value={formData.pass}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="md:col-span-2 flex gap-3 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plug"></i> Connecter
                </button>

                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
                >
                  <i className={`fas ${copySuccess ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
                </button>
              </div>
            </form>
          </div>

          <div
            className="glass-panel p-6 rounded-2xl shadow-xl"
            style={{
              background: 'rgba(31, 41, 55, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-key text-blue-400"></i> Accès Rapide par Token
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                placeholder="Coller votre token Base64 ici..."
              />

              <button
                onClick={() => fillFormFromToken(tokenInput)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 font-bold rounded-xl transition-all"
                title="Décoder et remplir le formulaire"
              >
                Décoder
              </button>

              <button
                onClick={handleTokenLogin}
                className="bg-gray-100 hover:bg-white text-gray-900 px-6 font-bold rounded-xl transition-all"
              >
                Login
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div
            className="glass-panel h-full flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(31, 41, 55, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Configurations Utilisées</h2>
              <span className="text-xs text-gray-400">
                {history.length} config{history.length > 1 ? 's' : ''}
              </span>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
              style={{ maxHeight: '600px' }}
            >
              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-500 italic">
                  <i className="fas fa-database text-2xl mb-3 block opacity-50"></i>
                  Aucune configuration enregistrée
                </div>
              ) : (
                history.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-900/50 border border-gray-700 p-4 rounded-xl hover:border-blue-500/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0">
                          <i className="fas fa-database text-sm"></i>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-sm uppercase tracking-tighter truncate">
                            {item.dbName}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono truncate">
                            {item.token.substring(0, 20)}...
                          </p>
                          <p className="text-[9px] text-gray-600 mt-1">
                            Ajoutée le {item.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => fillFormFromToken(item.token)}
                          className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Décoder et remplir le formulaire"
                        >
                          <i className="fas fa-edit text-[10px]"></i>
                        </button>

                        <button
                          onClick={() => loginWithToken(item.token)}
                          className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          title="Utiliser cette configuration"
                        >
                          <i className="fas fa-play text-[10px]"></i>
                          Connecter
                        </button>

                        <button
                          onClick={() => navigator.clipboard.writeText(item.token)}
                          className="bg-gray-600/20 hover:bg-gray-600 text-gray-400 hover:text-white px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Copier le token"
                        >
                          <i className="fas fa-copy text-[10px]"></i>
                        </button>

                        <button
                          onClick={() => deleteConfig(item.token)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Supprimer cette configuration"
                        >
                          <i className="fas fa-trash text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      const savedHistory = JSON.parse(
        localStorage.getItem('db_history') || '[]'
      );

      setHistory(Array.isArray(savedHistory) ? savedHistory : []);
    } catch (error) {
      console.error(
        'Erreur lors de la lecture de l’historique :',
        error
      );

      setHistory([]);
    }
  }, []);

  const buildBase64Config = () => {
    const rawString =
      `host||${formData.host}` +
      `|||port||${formData.port}` +
      `|||name||${formData.name}` +
      `|||user||${formData.user}` +
      `|||pass||${formData.pass}`;

    return {
      token: btoa(
        unescape(
          encodeURIComponent(rawString)
        )
      ),
      dbName: formData.name
    };
  };

  const decodeToken = (token) => {
    const cleanToken = token.trim();

    if (!cleanToken) {
      throw new Error('Token vide');
    }

    const decoded = decodeURIComponent(
      escape(
        atob(cleanToken)
      )
    );

    const getValue = (key) => {
      const part = decoded.split(`${key}||`)[1];

      return part
        ? part.split('|||')[0]
        : '';
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
      const cleanToken = token.trim();
      const decodedFormData = decodeToken(cleanToken);

      setFormData(decodedFormData);
      setTokenInput(cleanToken);
    } catch (error) {
      console.error(error);
      alert('Token invalide');
    }
  };

  const saveToHistory = (dbName, token) => {
    const cleanToken = token.trim();

    const newHistory = history.filter(
      (item) => item.token !== cleanToken
    );

    newHistory.unshift({
      dbName: dbName || 'Base sans nom',
      token: cleanToken,
      date: new Date().toLocaleString()
    });

    try {
      localStorage.setItem(
        'db_history',
        JSON.stringify(newHistory)
      );

      setHistory(newHistory);
    } catch (error) {
      console.error(
        'Erreur lors de la sauvegarde :',
        error
      );

      alert(
        'Impossible d’enregistrer la configuration. ' +
        'Le stockage du navigateur est peut-être plein.'
      );
    }
  };

  const loginWithToken = (token) => {
    const cleanToken = token.trim();

    const url =
      window.location.pathname +
      '?config=' +
      encodeURIComponent(cleanToken);

    window.location.href = url;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const config = buildBase64Config();

    saveToHistory(
      config.dbName,
      config.token
    );

    loginWithToken(config.token);
  };

  const handleTokenLogin = () => {
    const cleanToken = tokenInput.trim();

    if (!cleanToken) {
      alert('Veuillez saisir un token');
      return;
    }

    try {
      const decodedFormData = decodeToken(cleanToken);

      saveToHistory(
        decodedFormData.name,
        cleanToken
      );

      loginWithToken(cleanToken);
    } catch (error) {
      console.error(error);
      alert('Token invalide');
    }
  };

  const handleCopyConfig = async () => {
    const config = buildBase64Config();

    try {
      await navigator.clipboard.writeText(
        config.token
      );

      setCopySuccess(true);

      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Erreur lors de la copie :',
        error
      );

      alert('Erreur lors de la copie');
    }
  };

  const copyHistoryToken = async (token) => {
    try {
      await navigator.clipboard.writeText(token);
    } catch (error) {
      console.error(
        'Erreur lors de la copie :',
        error
      );

      alert('Erreur lors de la copie');
    }
  };

  const deleteConfig = (tokenToDelete) => {
    const shouldDelete = window.confirm(
      'Supprimer cette configuration ?'
    );

    if (!shouldDelete) {
      return;
    }

    const newHistory = history.filter(
      (item) => item.token !== tokenToDelete
    );

    try {
      localStorage.setItem(
        'db_history',
        JSON.stringify(newHistory)
      );

      setHistory(newHistory);
    } catch (error) {
      console.error(
        'Erreur lors de la suppression :',
        error
      );

      alert(
        'Impossible de supprimer cette configuration'
      );
    }
  };

  const clearHistory = () => {
    if (history.length === 0) {
      return;
    }

    const shouldClear = window.confirm(
      'Supprimer toutes les configurations enregistrées ?'
    );

    if (!shouldClear) {
      return;
    }

    try {
      localStorage.removeItem('db_history');
      setHistory([]);
    } catch (error) {
      console.error(
        'Erreur lors de la suppression :',
        error
      );

      alert(
        'Impossible de vider l’historique'
      );
    }
  };

  const handleInputChange = (event) => {
    const { id, value } = event.target;

    setFormData((previousFormData) => ({
      ...previousFormData,
      [id]: value
    }));
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
              border:
                '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-600 p-3 rounded-lg shadow-lg shadow-blue-500/20">
                <i className="fas fa-database text-2xl text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  Connexion Database
                </h1>

                <p className="text-sm text-gray-400">
                  Configurez vos accès manuellement
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label
                  htmlFor="host"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2"
                >
                  Host
                </label>

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
                <label
                  htmlFor="port"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2"
                >
                  Port
                </label>

                <input
                  type="number"
                  id="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  min="1"
                  max="65535"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2"
                >
                  Nom DB
                </label>

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
                <label
                  htmlFor="user"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2"
                >
                  Utilisateur
                </label>

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
                <label
                  htmlFor="pass"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2"
                >
                  Mot de passe
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    id="pass"
                    value={formData.pass}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 pr-12 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previousValue) =>
                          !previousValue
                      )
                    }
                    className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-gray-400 hover:text-white transition-colors"
                    title={
                      showPassword
                        ? 'Masquer le mot de passe'
                        : 'Afficher le mot de passe'
                    }
                    aria-label={
                      showPassword
                        ? 'Masquer le mot de passe'
                        : 'Afficher le mot de passe'
                    }
                  >
                    <i
                      className={`fas ${
                        showPassword
                          ? 'fa-eye-slash'
                          : 'fa-eye'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-3 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plug" />
                  Connecter
                </button>

                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
                  title="Copier le token"
                >
                  <i
                    className={`fas ${
                      copySuccess
                        ? 'fa-check text-green-400'
                        : 'fa-copy'
                    }`}
                  />
                </button>
              </div>
            </form>
          </div>

          <div
            className="glass-panel p-6 rounded-2xl shadow-xl"
            style={{
              background: 'rgba(31, 41, 55, 0.7)',
              backdropFilter: 'blur(12px)',
              border:
                '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-key text-blue-400" />
              Accès rapide par token
            </h2>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(event) =>
                  setTokenInput(
                    event.target.value
                  )
                }
                className="flex-1 px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                placeholder="Coller votre token Base64 ici..."
              />

              <button
                type="button"
                onClick={() =>
                  fillFormFromToken(tokenInput)
                }
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 font-bold rounded-xl transition-all"
                title="Décoder et remplir le formulaire"
              >
                Décoder
              </button>

              <button
                type="button"
                onClick={handleTokenLogin}
                className="bg-gray-100 hover:bg-white text-gray-900 px-6 py-2.5 font-bold rounded-xl transition-all"
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
              border:
                '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-6 border-b border-gray-700 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Configurations utilisées
                </h2>

                <span className="text-xs text-gray-400">
                  {history.length}{' '}
                  configuration
                  {history.length > 1 ? 's' : ''}{' '}
                  enregistrée
                  {history.length > 1 ? 's' : ''}
                </span>
              </div>

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
                >
                  <i className="fas fa-trash-alt mr-2" />
                  Tout supprimer
                </button>
              )}
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
              style={{
                maxHeight: '600px'
              }}
            >
              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-500 italic">
                  <i className="fas fa-database text-2xl mb-3 block opacity-50" />
                  Aucune configuration enregistrée
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.token}
                    className="bg-gray-900/50 border border-gray-700 p-4 rounded-xl hover:border-blue-500/50 transition-all group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0">
                          <i className="fas fa-database text-sm" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-sm uppercase tracking-tighter truncate">
                            {item.dbName ||
                              'Base sans nom'}
                          </p>

                          <p className="text-[10px] text-gray-500 font-mono truncate">
                            {item.token.substring(
                              0,
                              20
                            )}
                            ...
                          </p>

                          <p className="text-[9px] text-gray-600 mt-1">
                            Ajoutée le {item.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            fillFormFromToken(
                              item.token
                            )
                          }
                          className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Décoder et remplir le formulaire"
                        >
                          <i className="fas fa-edit text-[10px]" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            loginWithToken(
                              item.token
                            )
                          }
                          className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          title="Utiliser cette configuration"
                        >
                          <i className="fas fa-play text-[10px]" />
                          Connecter
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            copyHistoryToken(
                              item.token
                            )
                          }
                          className="bg-gray-600/20 hover:bg-gray-600 text-gray-400 hover:text-white px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Copier le token"
                        >
                          <i className="fas fa-copy text-[10px]" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteConfig(
                              item.token
                            )
                          }
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Supprimer cette configuration"
                        >
                          <i className="fas fa-trash text-[10px]" />
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

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}

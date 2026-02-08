const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-8 py-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Bienvenue sur la page d'accueil
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base">
            Découvrez la structure de votre projet React dynamique avec chargement de composants à la volée.
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6 bg-slate-900/80 text-slate-100">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="inline-block w-1 h-6 rounded-full bg-tertiary" />
              Navigation par hash
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Utilisez la barre d'adresse pour charger différents composants. Par exemple&nbsp;:
            </p>
            <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-3 font-mono text-xs sm:text-sm text-tertiary overflow-auto">
              <p>#Home</p>
              <p>#MonAutreComposant</p>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="bg-slate-800/80 rounded-xl p-4 flex flex-col gap-2 border border-slate-700/50">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-tertiary">
                Dynamique
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Les composants sont chargés à la demande via des fichiers JSX séparés.
              </p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-4 flex flex-col gap-2 border border-slate-700/50">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-tertiary">
                Babel &amp; JSX
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Le code JSX est transformé côté client pour permettre un prototypage rapide.
              </p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-4 flex flex-col gap-2 border border-slate-700/50">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-tertiary">
                Sécurité
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Un ErrorBoundary gère proprement les erreurs de chargement des composants.
              </p>
            </div>
          </section>

          <section className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-xs sm:text-sm text-slate-400">
              <p>
                Pour commencer, modifiez le composant <span className="font-mono">Home.jsx</span> ou
                ajoutez de nouveaux composants dans le dossier <span className="font-mono">components/</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="#Home"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-slate-100 text-sm font-semibold shadow-md hover:bg-secondary transition-colors"
              >
                Revenir à Home
              </a>
              <button
                type="button"
                onClick={() => (window.location.hash = '#Demo')}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-tertiary/70 text-tertiary text-sm font-semibold hover:bg-tertiary hover:text-slate-900 transition-colors"
              >
                Charger #Demo
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;
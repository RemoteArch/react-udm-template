const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-medium to-bg-light flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-8 py-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-light">
            Bienvenue sur la page d’accueil
          </h1>
          <p className="mt-2 text-text-light/80 text-sm sm:text-base">
            Découvrez la structure de votre projet React dynamique avec chargement de composants à la volée.
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6 bg-bg-dark/80 text-text-light">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="inline-block w-1 h-6 rounded-full bg-accent" />
              Navigation par hash
            </h2>
            <p className="text-sm sm:text-base text-text-light/80 leading-relaxed">
              Utilisez la barre d’adresse pour charger différents composants. Par exemple&nbsp;:
            </p>
            <div className="bg-black/30 border border-white/10 rounded-lg p-3 font-mono text-xs sm:text-sm text-accent overflow-auto">
              <p>#Home</p>
              <p>#MonAutreComposant</p>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="bg-bg-medium/80 rounded-xl p-4 flex flex-col gap-2 border border-white/10">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-accent">
                Dynamique
              </h3>
              <p className="text-xs sm:text-sm text-text-light/85">
                Les composants sont chargés à la demande via des fichiers JSX séparés.
              </p>
            </div>
            <div className="bg-bg-medium/80 rounded-xl p-4 flex flex-col gap-2 border border-white/10">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-accent">
                Babel &amp; JSX
              </h3>
              <p className="text-xs sm:text-sm text-text-light/85">
                Le code JSX est transformé côté client pour permettre un prototypage rapide.
              </p>
            </div>
            <div className="bg-bg-medium/80 rounded-xl p-4 flex flex-col gap-2 border border-white/10">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-accent">
                Sécurité
              </h3>
              <p className="text-xs sm:text-sm text-text-light/85">
                Un ErrorBoundary gère proprement les erreurs de chargement des composants.
              </p>
            </div>
          </section>

          <section className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-xs sm:text-sm text-text-light/70">
              <p>
                Pour commencer, modifiez le composant <span className="font-mono">Home.jsx</span> ou
                ajoutez de nouveaux composants dans le dossier <span className="font-mono">components/</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="#Home"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-text-light text-sm font-semibold shadow-md hover:bg-secondary transition-colors"
              >
                Revenir à Home
              </a>
              <button
                type="button"
                onClick={() => (window.location.hash = '#Demo')}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-accent/70 text-accent text-sm font-semibold hover:bg-accent hover:text-text-dark transition-colors"
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
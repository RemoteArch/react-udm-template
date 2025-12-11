const { useState , useEffect } = React;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorComponent handleRetry={this.handleRetry} error={this.state.error}/>
      );
    }
    return this.props.children;
  }
}

const loadModule = async (url) => {
  const finalUrl = /^http?:\/\//i.test(url) ? url : url;
  const response = await fetch(finalUrl);
  const source = await response.text();

  let code = source;
  if (/\.jsx$/i.test(url) && window.Babel) {
    const result = Babel.transform(source, {
      presets: ["react"],
      sourceType: "module",
    });
    code = result.code;
  }

  const blob = new Blob([code], { type: "text/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const module = await import(blobUrl);
    return module;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
};

window.loadModule = loadModule;

const ErrorComponent = ({ handleRetry, error }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-dark px-4">
      <div className="relative max-w-lg w-full bg-bg-dark/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-primary/40 overflow-hidden">
        {/* Accent border top */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

        <div className="p-8 sm:p-10 pt-10 sm:pt-12 text-center text-text-light">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-bg-dark border border-primary/40 shadow-[0_0_0_1px_rgba(59,130,246,0.45)]">
                <svg viewBox="0 0 24 24" className="w-14 h-14 text-primary">
                  <path
                    className="fill-none stroke-current stroke-[1.8]"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 18h4l2-10 3 14 2-8h5"
                  />
                  <path
                    className="fill-none stroke-current stroke-[1.8]"
                    strokeLinecap="round"
                    d="M12 4h.01M18 4h.01M6 4h.01"
                  />
                </svg>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/10 blur-xl" />
            </div>
          </div>

          {/* Title & description */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            <span className="block text-primary">404</span>
            <span className="block text-primary/80 text-lg sm:text-xl mt-1">
              Page introuvable
            </span>
          </h1>

          <p className="text-sm sm:text-base text-text-light/80 leading-relaxed max-w-md mx-auto">
            La page que vous cherchez n’existe pas ou n’a pas pu être chargée.
            Vérifiez l’adresse ou revenez à l’accueil pour continuer votre
            navigation.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8">
            <button
              onClick={() => {
                window.location.hash = '#Home';
                if (typeof handleRetry === 'function') handleRetry();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-medium bg-secondary text-white shadow-md shadow-primary/30 hover:shadow-xl hover:bg-secondary/90 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className="shrink-0"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4 12 8-8 8 8M6 10v10h12V10"
                />
              </svg>
              <span>Retour à l’accueil</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-medium bg-transparent border border-primary/60 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className="shrink-0"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M18.024 7.043A8.374 8.374 0 0 0 3.74 12.955" />
                  <path d="m17.35 2.75.832 3.372a1.123 1.123 0 0 1-.854 1.382l-3.372.843" />
                  <path d="M5.976 16.957a8.374 8.374 0 0 0 14.285-5.912" />
                  <path d="m6.65 21.25-.832-3.372a1.124 1.124 0 0 1 .855-1.382l3.371-.843" />
                </g>
              </svg>
              <span>Recharger la page</span>
            </button>
          </div>

          {/* Technical error (hidden by default) */}
          <div className="hidden mt-6 text-left">
            <p className="text-xs uppercase tracking-wide text-text-light/60 mb-1">
              Détails techniques
            </p>
            <div className="bg-bg-dark/80 rounded-lg p-3 text-xs font-mono text-primary/90 break-all border border-primary/40 max-h-32 overflow-auto shadow-inner shadow-primary/30">
              {String(error)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RenderComponent = ({ url , props = {} , children }) => {

  if(!url) return null;

  const lazyJsxEsm = () => {
    return React.lazy(async () => {
      const mod = await loadModule(url);
      const Comp = mod?.default;
      if (!Comp) throw new Error(`Aucun export par défaut après chargement de ${globalName}`);
      return { default: Comp };
    });
  }

  const Comp = React.useMemo(() => lazyJsxEsm(), [url]);
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>{children}</div>}>
        <Comp {...props} />
      </React.Suspense>
    </ErrorBoundary>
  );
};

function App() {
  const [name, setName] = useState(getComponentNameFromHash());
  const [url , setUrl] = React.useState(null);
  
  useEffect(() => {
    if(!name) return;
    setUrl(`./components/${name.toLowerCase()}.jsx`);
  }, [name]);

  function getComponentNameFromHash() {
    let hash = window.location.hash.replace('#', '') || 'Home';
    return hash
  }

  useEffect(() => {
    const handleHashChange = () => {
      setName(getComponentNameFromHash());
    };

    // Add event listener
    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial hash if empty
    if (!window.location.hash) {
      window.location.hash = '#Home';
    }

    handleHashChange()
    // Clean up event listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <RenderComponent key={url} url={url}/>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
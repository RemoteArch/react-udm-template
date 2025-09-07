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

const ErrorComponent = ({handleRetry , error})=>{
  return(
    <div className="h-screen w-screen flex item-center justify-center bg-gradient-to-br from-white to-gray-200">
          <div className="h-fit">
            <div className="text-center mb-6">
              <div className="mx-auto w-32 h-32 mb-4">
                <svg viewBox="0 0 24 24" className="w-full h-full text-secondary">
                  <circle cx="12" cy="12" r="10" className="fill-secondary/10" />
                  <path 
                    className="fill-secondary" 
                    d="M15.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
                  />
                  <path 
                    className="fill-none stroke-secondary stroke-2" 
                    d="M7.5 15.5c2 2 7 2 9 0" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-tertiary mb-2">Composant introuvable</h2>
              <p className="text-tertiary/70 mb-2">
                Le composant demandé n'a pas pu être chargé
              </p>
              <div className="hidden bg-secondary/10 rounded-lg p-4 mb-6 text-left">
                <p className="font-mono text-sm text-secondary break-all">
                  {String(error)}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg hover:from-primary-dark hover:to-primary transition-colors duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path stroke-miterlimit="10" d="M18.024 7.043A8.374 8.374 0 0 0 3.74 12.955"/><path stroke-linejoin="round" d="m17.35 2.75l.832 3.372a1.123 1.123 0 0 1-.854 1.382l-3.372.843"/><path stroke-miterlimit="10" d="M5.976 16.957a8.374 8.374 0 0 0 14.285-5.912"/><path stroke-linejoin="round" d="m6.65 21.25l-.832-3.372a1.124 1.124 0 0 1 .855-1.382l3.371-.843"/></g></svg>
                <span>Réessayer</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-secondary to-secondary-light text-white rounded-lg hover:from-secondary-dark hover:to-secondary transition-colors duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 12 12"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M10 4c-.8-1.1-2-2.5-4.1-2.5c-2.5 0-4.4 2-4.4 4.5s2 4.5 4.4 4.5c1.3 0 2.5-.6 3.3-1.5M11 1.5v3c0 .3-.2.5-.5.5h-3"/></svg>
                <span>Reload</span>
              </button>
            </div>
          </div>
      </div>
  )
}

const RenderComponent = ({ jsx , globalName , props = {} , children }) => {
  
  if(!jsx){
    if(children){
      return children;
    }else{
      return null;
    }
  };

  const getEsmUrlFromJsx = async (jsx , globalName) =>{
    const { code } = Babel.transform(jsx, {
      presets: ['react'],        // JSX -> JS
      sourceType: 'script',      // code “global” qui utilisera window.React
    });
    const esmSource = `
      const React = window.React;
      const ReactDOM = window.ReactDOM;
      (function(){ ${code}\n }).call(window);
      export default window['${globalName}'];
    `;
    const blob = new Blob([esmSource], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    try {
      return await import(blobUrl);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  const getEsmUrlFromJsxModule = async (jsx) => {
    // Transpile JSX -> ESM (préserve import/export)
    const { code } = Babel.transform(jsx, {
      presets: ["react"],
      sourceType: "module",   // <--- important : garde import/export
    });
  
    // Crée un blob en tant que module
    const blob = new Blob([code], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);
  
    try {
      // Charge le module
      return await import(blobUrl);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };
  
  let esmUrl = getEsmUrlFromJsxModule(jsx);
  const lazyJsxEsm = () => {
    return React.lazy(async () => {
      const mod = await esmUrl;
      const Comp = mod?.default;
      if (!Comp) throw new Error(`Aucun export par défaut après chargement de ${globalName}`);
      return { default: Comp };
    });
  }
  const Comp = React.useMemo(() => lazyJsxEsm(), []);
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>{children}</div>}>
        <Comp {...props} />
      </React.Suspense>
    </ErrorBoundary>
  );
};

const LazyComponent = ({globalName, children , props = {} }) => {
  const [jsxCode , setJsxCode] = React.useState(null);
  
  useEffect(() => {
    if(!globalName) return;
    getJsxCode().catch((error)=>{
      console.log(error)
      setJsxCode('()=>{}')
    });
    
  }, [globalName]);

  const getJsxCode = async () => {
    const res = await fetch(`./components/${globalName.toLowerCase()}.jsx`, { cache: 'reload' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} pour ${globalName}`);
    let jsx = await res.text();
    setJsxCode(jsx)
  }

  return (
   <RenderComponent key={jsxCode} jsx={jsxCode} globalName={globalName} props={props}>
     {children}
   </RenderComponent>
  );
};

function App() {
  const [name, setName] = useState(getComponentNameFromHash());

  function getComponentNameFromHash() {
    let hash = window.location.hash.replace('#', '') || 'Home';
    hash = hash.replaceAll('/', '-');
    hash = hash.replace('-' , '')
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
    <>
      <LazyComponent globalName={name} >
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 mx-auto"></div>
        </div>
      </LazyComponent>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
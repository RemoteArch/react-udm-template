const { useState , useEffect } = React;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorPageFailed: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorPageFailed: false });
  };

  handleErrorPageFailed = () => {
    this.setState({ errorPageFailed: true });
  };

  render() {
    if (this.state.hasError) {
      const { errorUrl } = this.props;
      
      if (errorUrl && !this.state.errorPageFailed) {
        return (
          <ErrorPageLoader 
            errorUrl={errorUrl} 
            onErrorPageFailed={this.handleErrorPageFailed}
          />
        );
      }
      
      return (
        <ErrorComponent handleRetry={this.handleRetry} error={this.state.error}/>
      );
    }
    return this.props.children;
  }
}

const ErrorPageLoader = ({ errorUrl, onErrorPageFailed }) => {
  const [ErrorPage, setErrorPage] = useState(null);

  useEffect(() => {
    let mounted = true;
    loadModule(errorUrl)
      .then((mod) => {
        if (mounted && mod?.default) {
          setErrorPage(() => mod.default);
        } else if (mounted) {
          onErrorPageFailed();
        }
      })
      .catch(() => {
        if (mounted) {
          onErrorPageFailed();
        }
      });
    return () => { mounted = false; };
  }, [errorUrl]);

  if (!ErrorPage) {
    return null;
  }

  return <ErrorPage />;
};

const loadModule = async (url) => {
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = `${url}${separator}_ts=${Date.now()}`;
  const response = await fetch(finalUrl);
  const source = await response.text();

  let code = source;
  if (/\.jsx$/i.test(url)) {
    if (!window.Babel) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Babel'));
        document.head.appendChild(script);
      });
    }
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Une erreur s'est produite lors du chargement.</p>
      <button
        onClick={handleRetry}
        style={{ 
          padding: '0.5rem 1rem', 
          backgroundColor: 'var(--color-primary)', 
          color: 'white', 
          borderRadius: '0.25rem', 
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Réessayer
      </button>
    </div>
  );
};

const RenderComponent = ({ url , props = {} , errorUrl, children }) => {

  if(!url) return null;

  const lazyJsxEsm = () => {
    return React.lazy(async () => {
      const mod = await loadModule(url);
      const Comp = mod?.default;
      if (!Comp) throw new Error(`Aucun export par défaut après chargement`);
      return { default: Comp };
    });
  }

  const Comp = React.useMemo(() => lazyJsxEsm(), [url]);
  return (
    <ErrorBoundary errorUrl={errorUrl}>
      <React.Suspense fallback={<div>{children}</div>}>
        <Comp {...props} />
      </React.Suspense>
    </ErrorBoundary>
  );
};

function App({ url, props = {}, errorUrl, children }) {
  return (
    <RenderComponent key={url} url={url} props={props} errorUrl={errorUrl}>
      {children}
    </RenderComponent>
  );
}

class WebAppElement extends HTMLElement {
  constructor() {
    super();
    this._url = null;
    this._errorUrl = null;
    this._props = {};
    this._children = null;
    this._root = null;
  }

  connectedCallback() {
    this._children = this.innerHTML;
    this._root = ReactDOM.createRoot(this);
    this._collectProps();
    const initialUrl = this.getAttribute('url');
    this._errorUrl = this.getAttribute('error');
    if (initialUrl) {
      this._url = initialUrl;
      this._render();
    }
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === 'url') {
        this._url = newValue;
      } else if (name === 'error') {
        this._errorUrl = newValue;
      } else {
        this._props[name] = newValue;
      }
      this._render();
    }
  }

  _collectProps() {
    this._props = {};
    for (const attr of this.attributes) {
      if (attr.name !== 'url' && attr.name !== 'error') {
        this._props[attr.name] = attr.value;
      }
    }
  }

  setErrorUrl(errorUrl) {
    this._errorUrl = errorUrl;
    this.setAttribute('error', errorUrl);
    this._render();
  }

  getErrorUrl() {
    return this._errorUrl;
  }

  setUrl(url) {
    this._url = url;
    this.setAttribute('url', url);
    this._render();
  }

  getUrl() {
    return this._url;
  }

  setProps(props) {
    this._props = { ...this._props, ...props };
    this._render();
  }

  getProps() {
    return this._props;
  }

  _render() {
    if (this._root && this._url) {
      this._root.render(
        <App url={this._url} props={this._props} errorUrl={this._errorUrl}>
          <div dangerouslySetInnerHTML={{ __html: this._children }} />
        </App>
      );
    }
  }
}

customElements.define('web-app', WebAppElement);
const LOCAL = window.local == true;
const REACT_URL = LOCAL ? "./assets/js/react.production.min.js" : "https://cdn.jsdelivr.net/gh/remotearch/react-udm-template/assets/js/react.production.min.js"
const REACT_DOM_URL = LOCAL ? "./assets/js/react-dom.production.min.js" : "https://cdn.jsdelivr.net/gh/remotearch/react-udm-template/assets/js/react-dom.production.min.js"
const BABEL_URL = LOCAL ? "./assets/js/babel.min.js" : "https://cdn.jsdelivr.net/gh/remotearch/react-udm-template/assets/js/babel.min.js"

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

window.loadScript = loadScript;

if (typeof React === 'undefined') {
  await loadScript(REACT_URL);
}
if (typeof ReactDOM === 'undefined') {
  await loadScript(REACT_DOM_URL);
}

let BASE_URL = '';
let CACHE_MAPS = {};

const loadModule = async (url) => {
  if(BASE_URL && !url.startsWith('http://') && !url.startsWith('https://')){
    url = BASE_URL+url;
  }
  const key = url;
  const cached = CACHE_MAPS[key];
  if (cached && cached.module) {
    return cached.module;
  }
  if (cached && cached.promise) {
    return await cached.promise;
  }
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = `${url}${separator}_ts=${Date.now()}`;
  const loader = (async () => {
    const response = await fetch(finalUrl);
    if (!response.ok) {
      throw new Error(`Impossible de charger le module: ${url}`);
    }

    const source = await response.text();

    let code = source;
    if (/\.jsx$/i.test(url)) {
      if (!window.Babel) {
        await loadScript(BABEL_URL);
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
  })();
  CACHE_MAPS[key] = { promise: loader };
  const module = await loader;
  CACHE_MAPS[key] = { module };
  return module;
};

window.loadModule = loadModule;

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
      if(this.props.errorhtml){
        return (
          <div dangerouslySetInnerHTML={{ __html: this.props.errorhtml }} />
        );
      }
      return null;
    }
    return this.props.children;
  }
}

class WebAppElement extends HTMLElement {
  constructor() {
    super();
    this._url = null;
    this._props = {};
    this._children = null;
    this._root = null;
    this._observer = null;
    this._useShadow = false;
    this._shadowRoot = null;
    this._errorHtml = null;
  }

  connectedCallback() {
    this._children = this.innerHTML;
    this._extratErrorHtml();
    
    this._useShadow = this.hasAttribute('shadow');
    
    if (this._useShadow) {
      this._shadowRoot = this.attachShadow({ mode: 'open' });
      this._root = ReactDOM.createRoot(this._shadowRoot);
    } else {
      this._root = ReactDOM.createRoot(this);
    }
    
    this._collectProps();
    const initialUrl = this.getAttribute('url');
    BASE_URL = this.getAttribute('base-url') || '';
    if (initialUrl) {
      this._url = initialUrl;
      this._render();
    }

    this._observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          this._handleAttributeChange(mutation.attributeName, mutation.oldValue);
        }
      }
    });
    this._observer.observe(this, { attributes: true, attributeOldValue: true });
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
    }
    if (this._root) {
      this._root.unmount();
    }
  }

  _extratErrorHtml() {
    const errorEl = this.querySelector('#web-app-error');
    if (errorEl) {
      this._errorHtml = errorEl.innerHTML;
    }
  }

  _handleAttributeChange(name) {
    const newValue = this.getAttribute(name);
    if (name === 'url') {
      this._url = newValue;
    }else if (name === 'base-url') {
      BASE_URL = newValue || '';
    } else if (name !== 'shadow') {
      this._props[name] = newValue;
    }
    this._render();
  }

  _collectProps() {
    this._props = {};
    for (const attr of this.attributes) {
      if (attr.name !== 'url' && attr.name !== 'error' && attr.name !== 'base-url' && attr.name !== 'shadow') {
        this._props[attr.name] = attr.value;
      }
    }
  }

  setProps(props) {
    this._props = { ...this._props, ...props };
    this._render();
  }

  getProps() {
    return this._props;
  }

  lazyJsxEsm = (url) => {
    return React.lazy(async () => {
      try {
        const mod = await loadModule(url);
        const Comp = mod?.default;
        if (!Comp) throw new Error(`Aucun export par défaut après chargement`);
        return { default: Comp };
      } catch (error) {
        // Forcer l'erreur à être capturée par ErrorBoundary
        console.error('Lazy component error:', error);
        throw error;
      }
    });
  }

  _render() {
    if (this._root && this._url) {
      const Comp = this.lazyJsxEsm(this._url);
      // console.log(this._errorHtml)
      const SuspenseWithError = () => (
        <ErrorBoundary errorhtml={this._errorHtml}>
          <React.Suspense fallback={<div dangerouslySetInnerHTML={{ __html: this._children }}></div>}>
            <Comp {...this._props} />
          </React.Suspense>
        </ErrorBoundary>
      );
      
      this._root.render(<SuspenseWithError />);
    }
  }
}

customElements.define('web-app', WebAppElement);

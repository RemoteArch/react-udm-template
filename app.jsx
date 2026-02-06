const {useState, useEffect} = React;

function App() {
  const [name, setName] = useState(getComponentNameFromHash());
  const [Component , setComponent] = useState(null);
  
  useEffect(() => {
    if(!name) return;
    loadModule(`./components/${name.toLowerCase()}.jsx`).then((module) => {
      setComponent(() => module.default);
    }).catch((err) => {
      console.error(`Failed to load component: ${name}`, err);
      setComponent(null);
    });
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
      Component ? <Component /> : null
    );
}

export default App;
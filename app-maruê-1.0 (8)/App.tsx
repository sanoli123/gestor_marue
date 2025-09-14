
import React, { useState } from 'react';
import Header from './components/Header.tsx';
import Dashboard from './features/Dashboard.tsx';
import Products from './features/Products.tsx';
import Production from './features/Production.tsx';
import Sales from './features/Sales.tsx';
import Costs from './features/Costs.tsx';
import DRE from './features/DRE.tsx';
import SKUConfig from './features/SKUConfig.tsx';
import Login from './features/Login.tsx';
import Settings from './features/Settings.tsx';
import { DataProvider, useData } from './context/DataContext.tsx';
import { ActivePage } from './types.ts';
import useLocalStorage from './hooks/useLocalStorage.ts';


type Credentials = { user: string; pass: string };

// Main application content, rendered when authenticated
const AppContent: React.FC<{
  onLogout: () => void;
  credentials: Credentials;
  setCredentials: (creds: Credentials) => void;
}> = ({ onLogout, credentials, setCredentials }) => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const { isLoading, error } = useData();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'production': return <Production />;
      case 'sales': return <Sales />;
      case 'costs': return <Costs />;
      case 'dre': return <DRE />;
      case 'sku': return <SKUConfig />;
      case 'settings': return <Settings credentials={credentials} onSave={setCredentials} />;
      default: return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-crema flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oliva mx-auto"></div>
          <p className="mt-4 text-lg text-espresso">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-crema flex justify-center items-center p-4">
        <div className="text-center text-red-600 bg-lino p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold">Erro ao Carregar os Dados</h2>
          <p className="mt-2 text-espresso">{error.message}</p>
          <p className="mt-4 text-sm text-oliva">Por favor, verifique a conexão com o banco de dados e atualize a página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crema text-espresso">
      <Header activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </main>
    </div>
  );
};

// Main App component now handles authentication with persistence
function App() {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('isAuthenticated', false);
  const [credentials, setCredentials] = useLocalStorage<Credentials>('credentials', { user: 'admin', pass: 'admin' });

  const handleLogin = (user: string, pass: string): boolean => {
    if (user === credentials.user && pass === credentials.pass) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };
  
  const handleSaveCredentials = (newCredentials: Credentials) => {
    setCredentials(newCredentials);
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <DataProvider>
      <AppContent
        onLogout={handleLogout}
        credentials={credentials}
        setCredentials={handleSaveCredentials}
      />
    </DataProvider>
  );
}

export default App;

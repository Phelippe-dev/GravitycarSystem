import React from 'react';
import { Car, User, LogOut, DollarSign, LayoutDashboard, PlusCircle, Sun, Moon, FileText, CreditCard } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CadastroVeiculo from './pages/CadastroVeiculo';
import Estoque from './pages/Estoque';
import Vendas from './pages/Vendas';
import Clientes from './pages/Clientes';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VeiculoDetalhesPage from './pages/VeiculoDetalhes';
import ClienteDetalhesPage from './pages/ClienteDetalhes';
import Relatorios from './pages/Relatorios';
import Fiscal from './pages/Fiscal';
import ContratoVenda from './pages/ContratoVenda';
import AvaliacaoVeiculo from './pages/AvaliacaoVeiculo';
import Cheques from './pages/Cheques';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('@GravityCar:theme') as 'dark' | 'light') || 'light';
  });

  React.useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
    localStorage.setItem('@GravityCar:theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '1.2rem' }}>Gravity Car System</span>
          </div>
          <button onClick={toggleTheme} className="theme-toggle-btn" title="Alternar Tema">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/cadastro/veiculos" className={`nav-item ${location.pathname === '/cadastro/veiculos' ? 'active' : ''}`}>
            <PlusCircle size={20} />
            Novo Veículo
          </Link>
          <Link to="/estoque" className={`nav-item ${location.pathname === '/estoque' ? 'active' : ''}`}>
            <Car size={20} />
            Estoque
          </Link>
          <Link to="/avaliacao" className={`nav-item ${location.pathname === '/avaliacao' ? 'active' : ''}`}>
            <FileText size={20} />
            Avaliação
          </Link>
          <Link to="/vendas" className={`nav-item ${location.pathname === '/vendas' ? 'active' : ''}`}>
            <DollarSign size={20} />
            Vendas
          </Link>
          <Link to="/financeiro/cheques" className={`nav-item ${location.pathname === '/financeiro/cheques' ? 'active' : ''}`}>
            <CreditCard size={20} />
            Cheques
          </Link>
          <Link to="/clientes" className={`nav-item ${location.pathname === '/clientes' ? 'active' : ''}`}>
            <User size={20} />
            Clientes
          </Link>
          <Link to="/relatorios" className={`nav-item ${location.pathname === '/relatorios' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            Relatórios
          </Link>
          <Link to="/fiscal" className={`nav-item ${location.pathname === '/fiscal' ? 'active' : ''}`}>
            <FileText size={20} />
            Fiscal
          </Link>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-profile-widget">
              <div className="user-avatar">
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user.nome}</span>
                <span className="user-role">Administrador</span>
              </div>
            </div>
          )}
          
          <button onClick={logout} className="nav-item w-full" style={{ background: 'transparent', border: 'none', cursor: 'pointer', justifyContent: 'flex-start' }}>
            <LogOut size={20} color="#ef4444" />
            <span style={{ color: '#ef4444' }}>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {children}
        
        {/* Global Floating Logo */}
        <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 0, opacity: 0.4, pointerEvents: 'none' }}>
          <img src="/src/assets/logo.png" alt="Gravity Tech Logo" style={{ width: '280px', height: 'auto' }} />
        </div>
      </main>
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-minha-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route path="*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/cadastro/veiculos" element={<CadastroVeiculo />} />
                  <Route path="/estoque" element={<Estoque />} />
                  <Route path="/avaliacao" element={<AvaliacaoVeiculo />} />
                  <Route path="/vendas" element={<Vendas />} />
                  <Route path="/financeiro/cheques" element={<Cheques />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/clientes/:id" element={<ClienteDetalhesPage />} />
                  <Route path="/veiculos/:id" element={<VeiculoDetalhesPage />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route path="/fiscal" element={<Fiscal />} />
                  <Route path="/contrato/:id" element={<ContratoVenda />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

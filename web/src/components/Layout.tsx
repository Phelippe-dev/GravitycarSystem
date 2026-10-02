import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, CircleDollarSign, BarChart3, Settings, LogOut, Bell, Search, Menu } from 'lucide-react';
import './Layout.css';
import logoXy from '../assets/Logo.png';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = localStorage.getItem('@MotorsXy:nome');

  const handleLogout = () => {
    localStorage.removeItem('@MotorsXy:token');
    localStorage.removeItem('@MotorsXy:nome');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/veiculos', icon: <Car size={20} />, label: 'Estoque' },
    { path: '/clientes', icon: <Search size={20} />, label: 'Clientes' },
    { path: '/vendas', icon: <CircleDollarSign size={20} />, label: 'Vendas' },
    { path: '/financeiro', icon: <BarChart3 size={20} />, label: 'Financeiro' },
    { path: '/configuracoes', icon: <Settings size={20} />, label: 'Configurações' },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logoXy} alt="Xy Works Logo" className="sidebar-logo" />
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar glass-panel">
          <div className="topbar-left">
            <button className="mobile-menu-btn">
              <Menu size={24} />
            </button>
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Buscar veículos, clientes..." />
            </div>
          </div>
          
          <div className="topbar-right">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="badge">3</span>
            </button>
            <div className="user-profile">
              <div className="avatar">{userName?.charAt(0) || 'U'}</div>
              <div className="user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role">Administrador</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-container animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

import React from 'react';
import { Car, User, LogOut, DollarSign, LayoutDashboard, PlusCircle, Sun, Moon, FileText, CreditCard, ShieldAlert, Settings, KeyRound, CheckCircle } from 'lucide-react';
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
import AdminPortal from './pages/AdminPortal';
import ConfiguracoesEmpresa from './pages/ConfiguracoesEmpresa';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { logout, user, activeRole, setActiveRole } = useAuth();
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('@GravityCar:theme') as 'dark' | 'light') || 'light';
  });

  // Estado para troca de senha
  const [senhaAtual, setSenhaAtual] = React.useState('');
  const [novaSenha, setNovaSenha] = React.useState('');
  const [confirmarSenha, setConfirmarSenha] = React.useState('');
  const [senhaLoading, setSenhaLoading] = React.useState(false);
  const [senhaMsg, setSenhaMsg] = React.useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [mostrarSenha, setMostrarSenha] = React.useState(false);

  const handleTrocarSenha = async () => {
    if (!novaSenha || novaSenha !== confirmarSenha) {
      setSenhaMsg({ tipo: 'erro', texto: 'As senhas não coincidem ou estão vazias.' });
      return;
    }
    if (novaSenha.length < 6) {
      setSenhaMsg({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    setSenhaLoading(true);
    setSenhaMsg(null);
    try {
      const token = localStorage.getItem('@GravityCar:token');
      const resp = await fetch(`${(await import('./api')).API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ senhaAtual, novaSenha })
      });
      if (resp.ok) {
        setSenhaMsg({ tipo: 'ok', texto: 'Senha alterada com sucesso!' });
        setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
      } else {
        const err = await resp.text();
        setSenhaMsg({ tipo: 'erro', texto: err || 'Senha atual incorreta.' });
      }
    } catch {
      setSenhaMsg({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' });
    }
    setSenhaLoading(false);
  };



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
          <div className="logo-container">
            <h2 className="sidebar-brand-name">Gravity Car System</h2>
          </div>
          <button 
            onClick={toggleTheme} 
            className="btn-theme-toggle" 
            title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-gray-400)', display: 'flex', alignItems: 'center' }}
          >
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
          {activeRole !== 'Vendedor' && (
            <Link to="/financeiro/cheques" className={`nav-item ${location.pathname === '/financeiro/cheques' ? 'active' : ''}`}>
              <CreditCard size={20} />
              Cheques
            </Link>
          )}
          <Link to="/clientes" className={`nav-item ${location.pathname === '/clientes' ? 'active' : ''}`}>
            <User size={20} />
            Clientes
          </Link>
          {activeRole !== 'Vendedor' && (
            <Link to="/relatorios" className={`nav-item ${location.pathname === '/relatorios' ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Relatórios
            </Link>
          )}
          {activeRole !== 'Vendedor' && (
            <Link to="/fiscal" className={`nav-item ${location.pathname === '/fiscal' ? 'active' : ''}`}>
              <FileText size={20} />
              Fiscal
            </Link>
          )}

          {/* Configurações da Empresa — Admin e SuperAdmin */}
          {(activeRole === 'Admin' || activeRole === 'SuperAdmin') && (
            <Link to="/configuracoes" className={`nav-item ${location.pathname === '/configuracoes' ? 'active' : ''}`}>
              <Settings size={20} />
              Configurações
            </Link>
          )}

          {/* Portal Admin: Visível EXCLUSIVAMENTE para o SuperAdmin / Dev ("pra mim") */}
          {activeRole === 'SuperAdmin' && (
            <>
              <div style={{ margin: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
              <Link to="/admin/empresas" className={`nav-item ${location.pathname === '/admin/empresas' ? 'active' : ''}`} style={{ color: 'var(--color-blue-light)' }}>
                <ShieldAlert size={20} />
                Portal Admin
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div 
              className="user-profile-widget" 
              onClick={() => setShowProfileModal(true)}
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '10px 12px' }}
              title="Clique para gerenciar seu perfil e nível de acesso"
            >
              <div 
                className="user-avatar" 
                style={{ 
                  background: activeRole === 'SuperAdmin' ? '#2563eb' : activeRole === 'Admin' ? '#10b981' : '#f59e0b',
                  boxShadow: activeRole === 'SuperAdmin' ? '0 0 12px rgba(37,99,235,0.5)' : activeRole === 'Admin' ? '0 0 12px rgba(16,185,129,0.5)' : '0 0 12px rgba(245,158,11,0.5)'
                }}
              >
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user.nome}</span>
                <span 
                  className="user-role" 
                  style={{ 
                    color: activeRole === 'SuperAdmin' ? 'var(--color-blue-light)' : activeRole === 'Admin' ? '#34d399' : '#fbbf24',
                    fontWeight: 600,
                    fontSize: '0.78rem'
                  }}
                >
                  {user.cargo || (activeRole === 'SuperAdmin' ? 'Super Administrador' : activeRole === 'Admin' ? 'Dono da Concessionária' : 'Consultor de Vendas')}
                </span>
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
      </main>

      {/* Modal de Perfil e Gestão de Níveis de Acesso */}
      {showProfileModal && user && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            {/* Cabeçalho do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>Meu Perfil & Controle de Acesso</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', margin: '4px 0 0 0' }}>Gerencie suas credenciais e o nível de acesso operacional</p>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="btn"
                style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--color-gray-400)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Cartão do Usuário */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: activeRole === 'SuperAdmin' ? '#2563eb' : activeRole === 'Admin' ? '#10b981' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#fff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
              }}>
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{user.nome}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-gray-400)' }}>{user.email}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--color-blue-light)' }}>
                  🏢 Concessionária Matriz • Gravidade Veículos
                </div>
              </div>
            </div>

            {/* Alternar Nível de Acesso (Papel do Sistema) */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-300)', marginBottom: '10px' }}>
                Alternar Nível de Acesso (Simulação Operacional)
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Opção 1: SuperAdmin (Master) */}
                <div 
                  onClick={() => setActiveRole('SuperAdmin')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: activeRole === 'SuperAdmin' ? '2px solid #2563eb' : '1px solid rgba(255,255,255,0.08)',
                    background: activeRole === 'SuperAdmin' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 700 }}>
                      👑
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: activeRole === 'SuperAdmin' ? '#93c5fd' : '#fff' }}>
                        Super Administrador (Você / Master)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>
                        Acesso total a todos os módulos + Portal Admin da plataforma
                      </div>
                    </div>
                  </div>
                  {activeRole === 'SuperAdmin' && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.15)', padding: '2px 8px', borderRadius: '4px' }}>ATIVO</span>
                  )}
                </div>

                {/* Opção 2: Dono da Concessionária (Admin) */}
                <div 
                  onClick={() => setActiveRole('Admin')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: activeRole === 'Admin' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                    background: activeRole === 'Admin' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontWeight: 700 }}>
                      🏢
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: activeRole === 'Admin' ? '#6ee7b7' : '#fff' }}>
                        Dono da Concessionária (Admin Cliente)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>
                        Controle geral da loja (Estoque, Vendas, Cheques, Fiscal). Sem Portal Admin.
                      </div>
                    </div>
                  </div>
                  {activeRole === 'Admin' && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px' }}>ATIVO</span>
                  )}
                </div>

                {/* Opção 3: Vendedor */}
                <div 
                  onClick={() => setActiveRole('Vendedor')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: activeRole === 'Vendedor' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                    background: activeRole === 'Vendedor' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontWeight: 700 }}>
                      💼
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: activeRole === 'Vendedor' ? '#fcd34d' : '#fff' }}>
                        Vendedor (Consultor Comercial)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>
                        Atendimento, Vendas, Avaliação e comissões. Sem acesso ao Fiscal e Portal Admin.
                      </div>
                    </div>
                  </div>
                  {activeRole === 'Vendedor' && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '4px' }}>ATIVO</span>
                  )}
                </div>
              </div>
            </div>

            {/* Informações de Comissão (se for vendedor) ou Financeiras (se for dono) */}
            {activeRole === 'Vendedor' ? (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '20px',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💰</span> Gestão de Comissão do Vendedor
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem' }}>Taxa de Comissão</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fbbf24' }}>{user.comissaoPercent.toFixed(1)}% / venda</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--color-gray-400)', fontSize: '0.72rem' }}>Acesso Fiscal</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ef4444' }}>Bloqueado (Restrito)</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '20px',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✓</span> Controle Administrativo Geral da Loja
                </div>
                <div style={{ color: 'var(--color-gray-300)', fontSize: '0.78rem' }}>
                  Você possui permissão para gerenciar estoque, vendas, contratos, cheques, emissão de NF-e e relatórios gerenciais da concessionária.
                </div>
              </div>
            )}

            {/* Troca de Senha */}
            <div style={{ marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setMostrarSenha(v => !v); setSenhaMsg(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--color-blue-light)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', padding: 0 }}
              >
                <KeyRound size={16} />
                {mostrarSenha ? 'Ocultar troca de senha' : 'Alterar minha senha'}
              </button>

              {mostrarSenha && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Senha atual"
                    value={senhaAtual}
                    onChange={e => setSenhaAtual(e.target.value)}
                    style={{ fontSize: '0.88rem' }}
                  />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Nova senha (mín. 6 caracteres)"
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    style={{ fontSize: '0.88rem' }}
                  />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Confirmar nova senha"
                    value={confirmarSenha}
                    onChange={e => setConfirmarSenha(e.target.value)}
                    style={{ fontSize: '0.88rem' }}
                  />
                  {senhaMsg && (
                    <div style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', background: senhaMsg.tipo === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: senhaMsg.tipo === 'ok' ? '#34d399' : '#ef4444', border: `1px solid ${senhaMsg.tipo === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
                      {senhaMsg.tipo === 'ok' ? <CheckCircle size={14} /> : '⚠'} {senhaMsg.texto}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleTrocarSenha}
                    disabled={senhaLoading}
                    style={{ fontSize: '0.85rem', alignSelf: 'flex-start' }}
                  >
                    {senhaLoading ? 'Salvando...' : '🔒 Salvar Nova Senha'}
                  </button>
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => { setShowProfileModal(false); setMostrarSenha(false); setSenhaMsg(null); }}
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
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
                  <Route path="/admin/empresas" element={<AdminPortal />} />
                  <Route path="/configuracoes" element={<ConfiguracoesEmpresa />} />
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

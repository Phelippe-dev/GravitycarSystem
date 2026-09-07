import React from 'react';
import { Car, User, LogOut, DollarSign, LayoutDashboard, PlusCircle, FileText,
         CreditCard, ShieldAlert, Settings, KeyRound, CheckCircle, Users, Zap, AlertTriangle } from 'lucide-react';
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
import FuncionariosPage from './pages/Funcionarios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { UserRole } from './contexts/AuthContext';

// ─── Componente do indicador de saldo ─────────────────────────────────────────
const SaldoIndicador: React.FC = () => {
  const { saldo, activeRole } = useAuth();
  if (activeRole === 'Vendedor') return null; // Vendedor não vê saldo
  const { saldoConsultas } = saldo;
  const critico = saldoConsultas === 0;
  const baixo = saldoConsultas > 0 && saldoConsultas <= 10;
  const cor = critico ? '#ef4444' : baixo ? '#f59e0b' : '#34d399';
  const bg = critico ? 'rgba(239,68,68,0.12)' : baixo ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.08)';
  const borda = critico ? 'rgba(239,68,68,0.4)' : baixo ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.2)';

  return (
    <div style={{ padding: '8px 12px', background: bg, border: `1px solid ${borda}`, borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {critico ? <AlertTriangle size={14} color={cor} /> : <Zap size={14} color={cor} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)' }}>Consultas Veiculares</div>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: cor }}>
          {critico ? 'Sem saldo — recarregue' : `${saldoConsultas} consulta${saldoConsultas !== 1 ? 's' : ''} restante${saldoConsultas !== 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  );
};

// ─── Layout Principal ──────────────────────────────────────────────────────────
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { logout, user, activeRole, setActiveRole } = useAuth();
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('@GravityCar:theme') as 'dark' | 'light') || 'light';
  });
  const [senhaAtual, setSenhaAtual] = React.useState('');
  const [novaSenha, setNovaSenha] = React.useState('');
  const [confirmarSenha, setConfirmarSenha] = React.useState('');
  const [senhaLoading, setSenhaLoading] = React.useState(false);
  const [senhaMsg, setSenhaMsg] = React.useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [mostrarSenha, setMostrarSenha] = React.useState(false);

  // Forçar sempre modo escuro
  React.useEffect(() => {
    document.body.classList.remove('theme-light');
  }, []);

  const handleTrocarSenha = async () => {
    if (!novaSenha || novaSenha !== confirmarSenha) { setSenhaMsg({ tipo: 'erro', texto: 'As senhas não coincidem ou estão vazias.' }); return; }
    if (novaSenha.length < 6) { setSenhaMsg({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 6 caracteres.' }); return; }
    setSenhaLoading(true); setSenhaMsg(null);
    try {
      const token = localStorage.getItem('@GravityCar:token');
      const resp = await fetch(`${(await import('./api')).API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ senhaAtual, novaSenha })
      });
      if (resp.ok) { setSenhaMsg({ tipo: 'ok', texto: 'Senha alterada com sucesso!' }); setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha(''); }
      else { const err = await resp.text(); setSenhaMsg({ tipo: 'erro', texto: err || 'Senha atual incorreta.' }); }
    } catch { setSenhaMsg({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' }); }
    setSenhaLoading(false);
  };

  React.useEffect(() => {
    if (theme === 'light') document.body.classList.add('theme-light');
    else document.body.classList.remove('theme-light');
    localStorage.setItem('@GravityCar:theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Helpers de permissão
  const isAdmin = activeRole === 'Admin' || activeRole === 'SuperAdmin';
  const isGerente = activeRole === 'Gerente' || isAdmin;
  const isSuperAdmin = activeRole === 'SuperAdmin';

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-container">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <h2 className="sidebar-brand-name">Gravity Car System</h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}><LayoutDashboard size={20} />Dashboard</Link>
          <Link to="/cadastro/veiculos" className={`nav-item ${isActive('/cadastro/veiculos') ? 'active' : ''}`}><PlusCircle size={20} />Novo Veículo</Link>
          <Link to="/estoque" className={`nav-item ${isActive('/estoque') ? 'active' : ''}`}><Car size={20} />Estoque</Link>
          <Link to="/avaliacao" className={`nav-item ${isActive('/avaliacao') ? 'active' : ''}`}><FileText size={20} />Avaliação</Link>
          <Link to="/vendas" className={`nav-item ${isActive('/vendas') ? 'active' : ''}`}><DollarSign size={20} />Vendas</Link>
          <Link to="/clientes" className={`nav-item ${isActive('/clientes') ? 'active' : ''}`}><User size={20} />Clientes</Link>

          {/* Gerente + Admin + SuperAdmin */}
          {isGerente && (
            <Link to="/financeiro/cheques" className={`nav-item ${isActive('/financeiro/cheques') ? 'active' : ''}`}><CreditCard size={20} />Cheques</Link>
          )}
          {isGerente && (
            <Link to="/relatorios" className={`nav-item ${isActive('/relatorios') ? 'active' : ''}`}><LayoutDashboard size={20} />Relatórios</Link>
          )}
          {isGerente && (
            <Link to="/fiscal" className={`nav-item ${isActive('/fiscal') ? 'active' : ''}`}><FileText size={20} />Fiscal</Link>
          )}

          {/* Admin + SuperAdmin */}
          {isAdmin && (
            <>
              <Link to="/configuracoes" className={`nav-item ${isActive('/configuracoes') ? 'active' : ''}`}><Settings size={20} />Configurações</Link>
              <Link to="/configuracoes/funcionarios" className={`nav-item ${isActive('/configuracoes/funcionarios') ? 'active' : ''}`}><Users size={20} />Funcionários</Link>
            </>
          )}

          {/* SuperAdmin apenas */}
          {isSuperAdmin && (
            <>
              <div style={{ margin: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
              <Link to="/admin/empresas" className={`nav-item ${isActive('/admin/empresas') ? 'active' : ''}`} style={{ color: 'var(--color-blue-light)' }}>
                <ShieldAlert size={20} />Portal Admin
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {/* ─── Indicador de Saldo de Consultas ─── */}
          <SaldoIndicador />

          {user && (
            <div className="user-profile-widget" onClick={() => setShowProfileModal(true)}
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '10px 12px' }}
              title="Clique para gerenciar seu perfil">
              <div className="user-avatar" style={{
                background: activeRole === 'SuperAdmin' ? '#2563eb' : activeRole === 'Admin' ? '#10b981' : activeRole === 'Gerente' ? '#8b5cf6' : '#f59e0b',
                boxShadow: activeRole === 'SuperAdmin' ? '0 0 12px rgba(37,99,235,0.5)' : activeRole === 'Admin' ? '0 0 12px rgba(16,185,129,0.5)' : activeRole === 'Gerente' ? '0 0 12px rgba(139,92,246,0.5)' : '0 0 12px rgba(245,158,11,0.5)'
              }}>
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user.nome}</span>
                <span className="user-role" style={{
                  color: activeRole === 'SuperAdmin' ? 'var(--color-blue-light)' : activeRole === 'Admin' ? '#34d399' : activeRole === 'Gerente' ? '#c4b5fd' : '#fbbf24',
                  fontWeight: 600, fontSize: '0.78rem'
                }}>
                  {user.cargo || (activeRole === 'SuperAdmin' ? 'Super Administrador' : activeRole === 'Admin' ? 'Dono da Concessionária' : activeRole === 'Gerente' ? 'Gerente' : 'Consultor de Vendas')}
                </span>
              </div>
            </div>
          )}
          <button onClick={logout} className="nav-item w-full" style={{ background: 'transparent', border: 'none', cursor: 'pointer', justifyContent: 'flex-start' }}>
            <LogOut size={20} color="#ef4444" /><span style={{ color: '#ef4444' }}>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {children}
      </main>

      {/* ─── Modal de Perfil ──────────────────────────────────────────────── */}
      {showProfileModal && user && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ maxWidth: '580px', width: '100%', padding: '28px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>Meu Perfil & Controle de Acesso</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', margin: '4px 0 0 0' }}>Gerencie suas credenciais e nível de acesso operacional</p>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="btn"
                style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--color-gray-400)', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Cartão do usuário */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: activeRole === 'SuperAdmin' ? '#2563eb' : activeRole === 'Admin' ? '#10b981' : activeRole === 'Gerente' ? '#8b5cf6' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}>
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{user.nome}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-gray-400)' }}>{user.email}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--color-blue-light)' }}>
                  🏢 Concessionária Matriz
                </div>
              </div>
            </div>

            {/* ─── Seleção de Papel (4 níveis) ─── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-300)', marginBottom: '10px' }}>
                Alternar Nível de Acesso (Simulação Operacional)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([
                  { role: 'SuperAdmin' as UserRole, icon: '👑', label: 'Super Administrador (Você)', desc: 'Acesso total + Portal Admin de todas as lojas', color: '#2563eb', colorLight: '#93c5fd', bg: 'rgba(37,99,235,0.12)' },
                  { role: 'Admin' as UserRole, icon: '🏢', label: 'Dono da Concessionária', desc: 'Gestão completa da loja + cadastro de funcionários', color: '#10b981', colorLight: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },
                  { role: 'Gerente' as UserRole, icon: '📊', label: 'Gerente', desc: 'Vendas, Financeiro, Relatórios e Fiscal — sem configurações', color: '#8b5cf6', colorLight: '#c4b5fd', bg: 'rgba(139,92,246,0.12)' },
                  { role: 'Vendedor' as UserRole, icon: '💼', label: 'Consultor de Vendas', desc: 'Estoque, Vendas e Atendimento — sem acesso financeiro', color: '#f59e0b', colorLight: '#fcd34d', bg: 'rgba(245,158,11,0.12)' },
                ] as const).map(({ role, icon, label, desc, color, colorLight, bg }) => (
                  <div key={role} onClick={() => setActiveRole(role)} style={{
                    padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                    border: activeRole === role ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
                    background: activeRole === role ? bg : 'rgba(255,255,255,0.02)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: activeRole === role ? colorLight : '#fff' }}>{label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>{desc}</div>
                      </div>
                    </div>
                    {activeRole === role && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color, background: `${color}25`, padding: '2px 8px', borderRadius: '4px' }}>ATIVO</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Troca de Senha ─── */}
            <div style={{ marginBottom: '20px' }}>
              <button type="button" onClick={() => { setMostrarSenha(v => !v); setSenhaMsg(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--color-blue-light)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', padding: 0 }}>
                <KeyRound size={16} />{mostrarSenha ? 'Ocultar troca de senha' : 'Alterar minha senha'}
              </button>
              {mostrarSenha && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="password" className="form-input" placeholder="Senha atual" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} style={{ fontSize: '0.88rem' }} />
                  <input type="password" className="form-input" placeholder="Nova senha (mín. 6 caracteres)" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} style={{ fontSize: '0.88rem' }} />
                  <input type="password" className="form-input" placeholder="Confirmar nova senha" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} style={{ fontSize: '0.88rem' }} />
                  {senhaMsg && (
                    <div style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', background: senhaMsg.tipo === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: senhaMsg.tipo === 'ok' ? '#34d399' : '#ef4444', border: `1px solid ${senhaMsg.tipo === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
                      {senhaMsg.tipo === 'ok' ? <CheckCircle size={14} /> : '⚠'} {senhaMsg.texto}
                    </div>
                  )}
                  <button type="button" className="btn btn-primary" onClick={handleTrocarSenha} disabled={senhaLoading} style={{ fontSize: '0.85rem', alignSelf: 'flex-start' }}>
                    {senhaLoading ? 'Salvando...' : '🔒 Salvar Nova Senha'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => { setShowProfileModal(false); setMostrarSenha(false); setSenhaMsg(null); }} style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Concluir</button>
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
                  <Route path="/configuracoes/funcionarios" element={<FuncionariosPage />} />
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
